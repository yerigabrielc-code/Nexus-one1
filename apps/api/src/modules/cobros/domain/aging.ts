import { Prisma } from '@prisma/client';

export interface AgingRow {
  dueDate: Date;
  balance: Prisma.Decimal;
}

export interface AgingBuckets {
  current: string; // por vencer
  d1_30: string;
  d31_60: string;
  d61_90: string;
  d90_plus: string;
  total: string;
}

/** Clasifica saldos por antigüedad respecto a 'now'. Lógica pura. */
export function buildAging(rows: AgingRow[], now: Date = new Date()): AgingBuckets {
  const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
  const b = { current: D(0), d1_30: D(0), d31_60: D(0), d61_90: D(0), d90_plus: D(0), total: D(0) };

  for (const r of rows) {
    const days = Math.floor((now.getTime() - r.dueDate.getTime()) / 86_400_000);
    b.total = b.total.plus(r.balance);
    if (days <= 0) b.current = b.current.plus(r.balance);
    else if (days <= 30) b.d1_30 = b.d1_30.plus(r.balance);
    else if (days <= 60) b.d31_60 = b.d31_60.plus(r.balance);
    else if (days <= 90) b.d61_90 = b.d61_90.plus(r.balance);
    else b.d90_plus = b.d90_plus.plus(r.balance);
  }

  return {
    current: b.current.toString(),
    d1_30: b.d1_30.toString(),
    d31_60: b.d31_60.toString(),
    d61_90: b.d61_90.toString(),
    d90_plus: b.d90_plus.toString(),
    total: b.total.toString(),
  };
}
