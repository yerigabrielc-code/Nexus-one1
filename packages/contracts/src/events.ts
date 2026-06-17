// Contrato del SOBRE (envelope) estándar de eventos de dominio (ADR-003).
// Todos los eventos viajan envueltos así, vía Outbox -> RabbitMQ.

export interface DomainEventEnvelope<TPayload = unknown> {
  eventId: string;
  eventType: string; // "<contexto>.<agregado>.<hecho>"  ej. "comercial.customer.created"
  eventVersion: number;
  occurredAt: string; // ISO-8601
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  correlationId?: string;
  causationId?: string;
  actor?: { userId: string };
  payload: TPayload;
}

// ── Tipos de evento del MVP ──
export const EventTypes = {
  CustomerCreated: 'comercial.customer.created',
  OrderConfirmed: 'ventas.order.confirmed',
  StockReserved: 'inventario.stock.reserved',
  StockReservationFailed: 'inventario.stock.reservation_failed',
  InvoiceIssued: 'ventas.invoice.issued',
  PaymentRegistered: 'cobros.payment.registered',
  PromiseCreated: 'cobros.promise.created',
  // Fase 2
  GoodsReceived: 'compras.goods.received',
  DisbursementRegistered: 'pagos.disbursement.registered',
  // Fase 3
  WorkOrderCompleted: 'activos.workorder.completed',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// Payload del evento de creación de cliente (slice del Walking Skeleton).
export interface CustomerCreatedPayload {
  customerId: string;
  code: string;
  legalName: string;
  type: 'PROSPECT' | 'CUSTOMER';
}
