import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventTypes } from '@nexus/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { withTenant } from '../prisma/tenant-runner';
import { tenantStorage, currentTenantId } from '../tenant/tenant-context';
import { ReserveStockUseCase } from '../../modules/inventario/application/reserve-stock.usecase';
import { IssueOutboundUseCase } from '../../modules/inventario/application/issue-outbound.usecase';
import { RegisterInboundUseCase } from '../../modules/inventario/application/register-inbound.usecase';
import { CreateReceivableFromInvoiceUseCase } from '../../modules/cobros/application/create-receivable-from-invoice.usecase';
import { CreatePayableFromReceiptUseCase } from '../../modules/pagos/application/create-payable-from-receipt.usecase';
import { CreateAlertUseCase } from '../../modules/automatizacion/application/create-alert.usecase';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';
const POLL_MS = 1500;
const MAX_ATTEMPTS = 10;

/**
 * Dispatcher IN-PROCESS del Outbox (saga del monolito modular).
 * Lee outbox_event con el rol BYPASSRLS (todos los tenants), enruta cada evento
 * a su handler ejecutándolo en el contexto del tenant correcto, y marca processedAt.
 *
 * Es la alternativa a la ruta RabbitMQ (apps/workers): en dev usamos ESTE; al
 * activar RabbitMQ se desactiva este (ambos consumen el mismo outbox.processedAt,
 * solo uno debe correr). Los handlers (use cases) se reutilizan en ambas rutas.
 */
@Injectable()
export class SagaDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('SagaDispatcher');
  private relay!: PrismaClient;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reserve: ReserveStockUseCase,
    private readonly outbound: IssueOutboundUseCase,
    private readonly inbound: RegisterInboundUseCase,
    private readonly createReceivable: CreateReceivableFromInvoiceUseCase,
    private readonly createPayable: CreatePayableFromReceiptUseCase,
    private readonly createAlert: CreateAlertUseCase,
  ) {}

  onModuleInit() {
    if (process.env.SAGA_MODE === 'sync') {
      this.logger.log('Saga SÍNCRONA: el Outbox se drena por request (sin poller, sin BYPASSRLS). Ideal serverless.');
      return;
    }
    if (process.env.RABBITMQ_ENABLED === 'true') {
      this.logger.log('Saga vía RabbitMQ: poller in-process desactivado (lo dispara el consumer).');
      return;
    }
    if (process.env.SAGA_INPROCESS === 'false') {
      this.logger.log('Dispatcher in-process deshabilitado (SAGA_INPROCESS=false).');
      return;
    }
    this.relay = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_RELAY_URL ?? process.env.DATABASE_MIGRATION_URL },
      },
    });
    this.timer = setInterval(() => void this.tick(), POLL_MS);
    this.logger.log('Dispatcher in-process del Outbox iniciado.');
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.relay?.$disconnect();
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const pending = await this.relay.outboxEvent.findMany({
        where: { processedAt: null, attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { occurredAt: 'asc' },
        take: 25,
      });
      for (const ev of pending) {
        try {
          const envelope = ev.payload as any; // envelope completo con .payload anidado
          await this.handle(ev.eventType, envelope.payload, ev.tenantId);
          await this.relay.outboxEvent.update({
            where: { id: ev.id },
            data: { processedAt: new Date(), attempts: { increment: 1 } },
          });
        } catch (err) {
          await this.relay.outboxEvent.update({
            where: { id: ev.id },
            data: { attempts: { increment: 1 } },
          });
          this.logger.error(`Handler falló (${ev.eventType}): ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`tick() error: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /**
   * Modo SÍNCRONO (serverless/Supabase): drena el Outbox del tenant ACTUAL en la
   * misma petición, con el rol de app. La RLS limita las filas a ese tenant, así
   * que NO se necesita BYPASSRLS. Itera porque los handlers emiten nuevos eventos.
   */
  async drainCurrentTenant(): Promise<void> {
    const tenantId = currentTenantId();
    if (!tenantId) return;
    for (let round = 0; round < 20; round++) {
      const pending = await withTenant(this.prisma, (tx) =>
        tx.outboxEvent.findMany({
          where: { processedAt: null, attempts: { lt: MAX_ATTEMPTS } },
          orderBy: { occurredAt: 'asc' },
          take: 50,
        }),
      );
      if (!pending.length) break;
      for (const ev of pending) {
        try {
          const env = ev.payload as any;
          await this.handle(ev.eventType, env.payload, ev.tenantId);
        } catch (err) {
          this.logger.error(`drain (${ev.eventType}): ${(err as Error).message}`);
        }
        await withTenant(this.prisma, (tx) =>
          tx.outboxEvent.update({
            where: { id: ev.id },
            data: { processedAt: new Date(), attempts: { increment: 1 } },
          }),
        );
      }
    }
  }

  /** Ejecuta el handler dentro del AsyncLocalStorage del tenant. Público: lo usa
   *  el poller in-process, el consumer de RabbitMQ y el drenado síncrono. */
  handle(eventType: string, payload: any, tenantId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      tenantStorage.run({ tenantId, userId: SYSTEM_USER, permissions: [] }, () => {
        this.route(eventType, payload, tenantId).then(resolve, reject);
      });
    });
  }

  private async route(eventType: string, payload: any, tenantId: string): Promise<void> {
    switch (eventType) {
      case EventTypes.OrderConfirmed:
        return this.onOrderConfirmed(payload);
      case EventTypes.InvoiceIssued:
        return this.onInvoiceIssued(payload, tenantId);
      case EventTypes.GoodsReceived:
        return this.onGoodsReceived(payload, tenantId);
      case EventTypes.StockReservationFailed:
        return this.onReservationFailed(payload);
      default:
        return; // sin handler de saga -> no-op (se marca procesado)
    }
  }

  /** goods.received -> ENTRADA de stock (recosteo) por línea + crear CxP. */
  private async onGoodsReceived(payload: any, tenantId: string): Promise<void> {
    for (const line of payload.lines ?? []) {
      await this.inbound.execute({
        productId: line.productId,
        warehouseId: payload.warehouseId,
        quantity: line.quantity,
        unitCost: line.unitCost,
        refType: 'PurchaseOrder',
        refId: payload.purchaseOrderId,
      });
    }
    await this.createPayable.execute(payload, tenantId);
  }

  /** stock.reservation_failed -> alerta para el equipo comercial. */
  private async onReservationFailed(payload: any): Promise<void> {
    await this.createAlert.execute({
      type: 'STOCK_RESERVATION_FAILED',
      message: `Stock insuficiente para el pedido ${payload.orderId} (producto ${payload.productId}).`,
      entityType: 'SalesOrder',
      entityId: payload.orderId,
    });
  }

  /** order.confirmed -> reservar stock de cada línea en el almacén por defecto. */
  private async onOrderConfirmed(payload: any): Promise<void> {
    const warehouseId = await this.defaultWarehouseId();
    if (!warehouseId) {
      this.logger.warn('No hay almacén configurado; se omite la reserva de stock.');
      return;
    }
    for (const line of payload.lines ?? []) {
      await this.reserve.execute({
        productId: line.productId,
        warehouseId,
        quantity: line.quantity,
        orderId: payload.orderId,
      });
    }
  }

  /** invoice.issued -> crear CxC (Cobros) + descontar stock (Inventario). */
  private async onInvoiceIssued(payload: any, tenantId: string): Promise<void> {
    await this.createReceivable.execute(payload, tenantId);

    const warehouseId = await this.defaultWarehouseId();
    if (warehouseId) {
      for (const line of payload.lines ?? []) {
        await this.outbound.execute({
          productId: line.productId,
          warehouseId,
          quantity: line.quantity,
          refType: 'Invoice',
          refId: payload.invoiceId,
          fromReservation: true,
        });
      }
    }
  }

  private defaultWarehouseId(): Promise<string | null> {
    return withTenant(this.prisma, async (tx) => {
      const wh = await tx.warehouse.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      return wh?.id ?? null;
    });
  }
}
