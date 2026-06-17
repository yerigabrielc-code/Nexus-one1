import type { Tx } from '../../../shared/prisma/tenant-runner';

/** Datos mínimos que un documento fiscal necesita para emitirse. */
export interface FiscalIssueRequest {
  invoiceId: string;
  customerTaxId: string | null;
  customerTaxIdType: 'RNC' | 'CEDULA' | 'NONE';
  subtotal: string;
  taxTotal: string;
  total: string;
  /** El tipo lo decide el motor fiscal según el cliente (con/sin RNC). */
}

export interface FiscalIssueResult {
  ncfType: string; // p.ej. "E31" | "E32" | "E34"
  ncf: string; // e-NCF completo, p.ej. "E310000000001"
  fiscalStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  fiscalTrackId: string;
  fiscalSecurityCode: string;
}

/**
 * Puerto del motor de cumplimiento fiscal. Cada país implementa su proveedor
 * (RD/DGII, MX/SAT, PE/SUNAT...). Permite expandir a otros países sin tocar Ventas.
 */
export interface FiscalProviderPort {
  countryCode: string;
  issue(tx: Tx, req: FiscalIssueRequest): Promise<FiscalIssueResult>;
}

export const FISCAL_PROVIDER = Symbol('FISCAL_PROVIDER');
