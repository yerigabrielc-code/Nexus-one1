import { DgiiFiscalProvider } from './dgii.provider';
import { tenantStorage } from '../../../shared/tenant/tenant-context';

// tx falso: el proveedor solo usa tx.invoice.count para la secuencia.
const fakeTx = (used: number) => ({ invoice: { count: async () => used } }) as any;

const baseReq = { invoiceId: 'inv-1', customerTaxId: '131123456', subtotal: '800', taxTotal: '144', total: '944' };

async function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    tenantStorage.run({ tenantId: 'tenant-1', userId: 'u', permissions: [] }, () => fn().then(resolve, reject));
  });
}

describe('DGII e-NCF (RD, Ley 32-23)', () => {
  const provider = new DgiiFiscalProvider();

  it('genera E31 (crédito fiscal) para cliente con RNC', async () => {
    const r = await withTenant(() => provider.issue(fakeTx(0), { ...baseReq, customerTaxIdType: 'RNC' }));
    expect(r.ncfType).toBe('E31');
    expect(r.ncf).toBe('E310000000001');
    expect(r.fiscalStatus).toBe('ACCEPTED');
  });

  it('genera E32 (consumo) para cliente sin RNC', async () => {
    const r = await withTenant(() => provider.issue(fakeTx(4), { ...baseReq, customerTaxIdType: 'NONE' }));
    expect(r.ncfType).toBe('E32');
    expect(r.ncf).toBe('E320000000005'); // secuencia = used + 1
  });
});
