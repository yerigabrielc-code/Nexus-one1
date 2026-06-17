import { Prisma } from '@prisma/client';
import { applyInbound, applyOutbound } from './costing';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

describe('Costeo promedio ponderado', () => {
  it('recostea correctamente una entrada', () => {
    const state = { onHand: D(90), avgCost: D(50) };
    const r = applyInbound(state, 20, 60); // (90*50 + 20*60)/110 = 51.8181...
    expect(r.onHand.toString()).toBe('110');
    expect(r.avgCost.toDecimalPlaces(4).toString()).toBe('51.8182');
  });

  it('primera entrada fija el costo promedio', () => {
    const r = applyInbound({ onHand: D(0), avgCost: D(0) }, 100, 50);
    expect(r.onHand.toString()).toBe('100');
    expect(r.avgCost.toString()).toBe('50');
  });

  it('salida descuenta al costo promedio sin alterarlo', () => {
    const r = applyOutbound({ onHand: D(100), avgCost: D(50) }, 10);
    expect(r.onHand.toString()).toBe('90');
    expect(r.unitCost.toString()).toBe('50');
  });

  it('rechaza salida con stock insuficiente', () => {
    expect(() => applyOutbound({ onHand: D(5), avgCost: D(10) }, 10)).toThrow();
  });

  it('rechaza entradas con cantidad <= 0', () => {
    expect(() => applyInbound({ onHand: D(0), avgCost: D(0) }, 0, 10)).toThrow();
  });
});
