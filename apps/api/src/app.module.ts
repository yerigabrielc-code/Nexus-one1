import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './shared/prisma/prisma.module';
import { OutboxModule } from './shared/outbox/outbox.module';
import { TenantInterceptor } from './shared/tenant/tenant.interceptor';
import { SagaDrainInterceptor } from './shared/saga/saga-drain.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ComercialModule } from './modules/comercial/comercial.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { CobrosModule } from './modules/cobros/cobros.module';
import { AnaliticaModule } from './modules/analitica/analitica.module';
import { ComprasModule } from './modules/compras/compras.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { ActivosModule } from './modules/activos/activos.module';
import { DocumentalModule } from './modules/documental/documental.module';
import { AutomatizacionModule } from './modules/automatizacion/automatizacion.module';
import { PortalModule } from './modules/portal/portal.module';
import { SagaModule } from './shared/saga/saga.module';

@Module({
  imports: [
    PrismaModule,
    OutboxModule,
    AuthModule,
    ComercialModule,
    InventarioModule,
    FiscalModule,
    VentasModule,
    CobrosModule,
    AnaliticaModule,
    ComprasModule,
    PagosModule,
    ActivosModule,
    DocumentalModule,
    AutomatizacionModule,
    PortalModule,
    SagaModule,
  ],
  providers: [
    // Orden importa: TenantInterceptor (externo) establece el contexto; luego el
    // drenado síncrono de la saga corre dentro de ese contexto.
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SagaDrainInterceptor },
  ],
})
export class AppModule {}
