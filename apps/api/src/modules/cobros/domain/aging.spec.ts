import { Prisma } from '@prisma/client';
import { buildAging } from './aging';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const now = new Date('2026-06-15T00:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysAhead = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe('Aging Report', () => {
  it('clasifica saldos por antigüedad', () => {
    const r = buildAging(
      [
        { dueDate: daysAhead(10), balance: D(100) }, // por vencer
        { dueDate: daysAgo(15), balance: D(50) }, // 1-30
        { dueDate: daysAgo(45), balance: D(30) }, // 31-60
        { dueDate: daysAgo(120), balance: D(20) }, // +90
      ],
      now,
    );
    expect(r.current).toBe('100');
    expect(r.d1_30).toBe('50');
    expect(r.d31_60).toBe('30');
    expect(r.d90_plus).toBe('20');
    expect(r.total).toBe('200');
  });

  it('cartera vacía da ceros', () => {
    const r = buildAging([], now);
    expect(r.total).toBe('0');
  });
});
