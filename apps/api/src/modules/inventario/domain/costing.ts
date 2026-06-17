import { Prisma } from '@prisma/client';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export interface StockState {
  onHand: Prisma.Decimal;
  avgCost: Prisma.Decimal;
}

/**
 * Costeo PROMEDIO PONDERADO. Lógica de dominio pura (sin IO).
 * Todo en Prisma.Decimal — nunca float — para no perder centavos.
 */
export function applyInbound(
  state: StockState,
  qty: Prisma.Decimal.Value,
  unitCost: Prisma.Decimal.Value,
): { onHand: Prisma.Decimal; avgCost: Prisma.Decimal } {
  const q = D(qty);
  if (q.lte(0)) throw new Error('La cantidad de entrada debe ser > 0');
  const newOnHand = state.onHand.plus(q);
  // avg = (valorActual + valorEntrante) / cantidadTotal
  const currentValue = state.onHand.times(state.avgCost);
  const inboundValue = q.times(D(unitCost));
  const newAvg = newOnHand.isZero()
    ? D(0)
    : currentValue.plus(inboundValue).div(newOnHand);
  return { onHand: newOnHand, avgCost: newAvg };
}

/**
 * Salida: descuenta cantidad al costo promedio vigente (no cambia avgCost).
 */
export function applyOutbound(
  state: StockState,
  qty: Prisma.Decimal.Value,
  allowNegative = false,
): { onHand: Prisma.Decimal; avgCost: Prisma.Decimal; unitCost: Prisma.Decimal } {
  const q = D(qty);
  if (q.lte(0)) throw new Error('La cantidad de salida debe ser > 0');
  const newOnHand = state.onHand.minus(q);
  if (!allowNegative && newOnHand.lt(0)) {
    throw new Error('Stock insuficiente para la salida');
  }
  return { onHand: newOnHand, avgCost: state.avgCost, unitCost: state.avgCost };
}
