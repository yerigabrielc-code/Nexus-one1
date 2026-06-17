import { Global, Module } from '@nestjs/common';
import { FISCAL_PROVIDER } from './domain/fiscal.port';
import { DgiiFiscalProvider } from './infrastructure/dgii.provider';

/**
 * El proveedor se resuelve por el país del tenant. Hoy solo RD (DGII).
 * Al sumar MX/PE se inyecta un factory que elige el proveedor por countryCode.
 */
@Global()
@Module({
  providers: [{ provide: FISCAL_PROVIDER, useClass: DgiiFiscalProvider }],
  exports: [FISCAL_PROVIDER],
})
export class FiscalModule {}
