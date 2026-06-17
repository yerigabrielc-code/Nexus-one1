import { SalesOrder } from './sales-order.entity';

describe('SalesOrder (cálculo de ITBIS)', () => {
  it('calcula subtotal, ITBIS 18% y total', () => {
    const o = SalesOrder.create({
      customerId: 'cust-1',
      lines: [{ productId: 'p1', quantity: 10, unitPrice: 80 }],
    });
    expect(o.subtotal.toString()).toBe('800');
    expect(o.taxTotal.toString()).toBe('144'); // 800 * 0.18
    expect(o.total.toString()).toBe('944');
  });

  it('suma múltiples líneas', () => {
    const o = SalesOrder.create({
      customerId: 'c',
      lines: [
        { productId: 'a', quantity: 2, unitPrice: 100 },
        { productId: 'b', quantity: 1, unitPrice: 50, taxRate: 0 },
      ],
    });
    expect(o.subtotal.toString()).toBe('250');
    expect(o.taxTotal.toString()).toBe('36'); // solo la línea A (200*0.18)
    expect(o.total.toString()).toBe('286');
  });

  it('rechaza pedido sin líneas', () => {
    expect(() => SalesOrder.create({ customerId: 'c', lines: [] })).toThrow();
  });

  it('rechaza cantidad <= 0', () => {
    expect(() => SalesOrder.create({ customerId: 'c', lines: [{ productId: 'p', quantity: 0, unitPrice: 10 }] })).toThrow();
  });
});
