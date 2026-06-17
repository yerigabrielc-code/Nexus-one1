import { Customer } from './customer.entity';

describe('Customer (validación DGII RD)', () => {
  const base = { code: 'C1', legalName: 'ACME SRL', type: 'CUSTOMER' as const };

  it('acepta RNC de 9 dígitos', () => {
    const c = Customer.create({ ...base, taxIdType: 'RNC', taxId: '131123456' });
    expect(c.props.taxId).toBe('131123456');
  });

  it('acepta Cédula de 11 dígitos', () => {
    const c = Customer.create({ ...base, taxIdType: 'CEDULA', taxId: '00112345678' });
    expect(c.props.taxIdType).toBe('CEDULA');
  });

  it('rechaza RNC con longitud inválida', () => {
    expect(() => Customer.create({ ...base, taxIdType: 'RNC', taxId: '123' })).toThrow();
  });

  it('rechaza Cédula con longitud inválida', () => {
    expect(() => Customer.create({ ...base, taxIdType: 'CEDULA', taxId: '123' })).toThrow();
  });

  it('exige número si se declara tipo de identificación', () => {
    expect(() => Customer.create({ ...base, taxIdType: 'RNC' })).toThrow();
  });

  it('exige código y razón social', () => {
    expect(() => Customer.create({ code: '', legalName: '', taxIdType: 'NONE', type: 'PROSPECT' })).toThrow();
  });
});
