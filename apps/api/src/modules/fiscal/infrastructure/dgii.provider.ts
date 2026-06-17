import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Tx } from '../../../shared/prisma/tenant-runner';
import { currentTenantId } from '../../../shared/tenant/tenant-context';
import type {
  FiscalProviderPort,
  FiscalIssueRequest,
  FiscalIssueResult,
} from '../domain/fiscal.port';

/**
 * Proveedor fiscal de REPÚBLICA DOMINICANA (DGII) — Facturación Electrónica (e-CF),
 * Ley 32-23. Genera el e-NCF con el formato oficial: 'E' + tipo(2) + secuencia(10).
 *
 * Tipos relevantes:
 *   E31 Factura de Crédito Fiscal Electrónica (cliente con RNC -> da derecho a ITBIS)
 *   E32 Factura de Consumo Electrónica       (consumidor final / sin RNC)
 *   E34 Nota de Crédito Electrónica
 *
 * NOTA: esta implementación asigna la secuencia localmente y simula la respuesta
 * de la DGII (ACCEPTED). La integración real (firma XML + envío al servicio
 * de recepción de la DGII y obtención del TrackID) se conecta en este mismo punto.
 */
@Injectable()
export class DgiiFiscalProvider implements FiscalProviderPort {
  readonly countryCode = 'DO';

  async issue(tx: Tx, req: FiscalIssueRequest): Promise<FiscalIssueResult> {
    const ncfType = req.customerTaxIdType === 'RNC' ? 'E31' : 'E32';

    // Secuencia por tenant + tipo: siguiente correlativo en base a lo ya emitido.
    const tenantId = currentTenantId()!;
    const used = await tx.invoice.count({ where: { tenantId, ncfType } });
    const sequence = (used + 1).toString().padStart(10, '0');
    const ncf = `${ncfType}${sequence}`;

    return {
      ncfType,
      ncf,
      fiscalStatus: 'ACCEPTED', // simulado; real: 'PENDING' hasta confirmación DGII
      fiscalTrackId: randomUUID(),
      fiscalSecurityCode: randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase(),
    };
  }
}
