'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Users, Boxes, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Executive {
  salesTotal: string;
  receivableOutstanding: string;
  customersCount: number;
  productsCount: number;
  ordersCount: number;
}
interface SalesSummary {
  byStatus: { status: string; count: number; total: string }[];
  recent: { number: string; ncf: string | null; total: string; status: string; issueDate: string | null }[];
}

export default function DashboardPage() {
  const [exec, setExec] = useState<Executive | null>(null);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get<Executive>('/analytics/executive'), api.get<SalesSummary>('/analytics/sales')])
      .then(([e, s]) => { setExec(e); setSales(s); })
      .catch((err) => setError(err.message));
  }, []);

  const kpis = [
    { label: 'Ventas', value: exec ? money(exec.salesTotal) : '—', icon: TrendingUp },
    { label: 'Cartera pendiente', value: exec ? money(exec.receivableOutstanding) : '—', icon: Wallet },
    { label: 'Clientes', value: exec?.customersCount ?? '—', icon: Users },
    { label: 'Productos', value: exec?.productsCount ?? '—', icon: Boxes },
    { label: 'Pedidos', value: exec?.ordersCount ?? '—', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard ejecutivo</h1>
        <p className="text-sm text-muted-foreground">Indicadores en tiempo real de tu empresa.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <k.icon className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <span className="text-lg font-semibold">{k.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Facturas por estado</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sales?.byStatus.length ? sales.byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.status} · {s.count}</span>
                <span className="font-medium">{money(s.total)}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sin datos aún.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimas facturas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sales?.recent.length ? sales.recent.map((r) => (
              <div key={r.number} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.number} · {r.ncf ?? 's/NCF'}</span>
                <span className="font-medium">{money(r.total)}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sin facturas aún.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
