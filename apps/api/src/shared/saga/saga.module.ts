import { Module } from '@nestjs/common';
import { InventarioModule } from '../../modules/inventario/inventario.module';
import { CobrosModule } from '../../modules/cobros/cobros.module';
import { PagosModule } from '../../modules/pagos/pagos.module';
import { AutomatizacionModule } from '../../modules/automatizacion/automatizacion.module';
import { SagaDispatcher } from './saga.dispatcher';
import { RabbitMqEventBus } from './rabbitmq-event-bus';

/**
 * Orquestación de la saga in-process. Importa los módulos cuyos use cases reacciona
 * (Inventario, Cobros, Pagos, Automatización) — que los exportan. No acopla los
 * módulos entre sí: la coordinación vive aquí, disparada por eventos del Outbox.
 */
@Module({
  imports: [InventarioModule, CobrosModule, PagosModule, AutomatizacionModule],
  providers: [SagaDispatcher, RabbitMqEventBus],
  exports: [SagaDispatcher],
})
export class SagaModule {}
