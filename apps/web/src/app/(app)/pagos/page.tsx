'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Cashflow { overdue: string; next7: string; next30: string; beyond30: string; total: string }
interface Payable { id: string; amount: string; balance: string; status: string; dueDate: string }

export default function PagosPage() {
  const [cf, setCf] = useState<Cashflow | null>(null);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get<Cashflow>('/reports/cashflow').then(setCf).catch((e) => setError(e.message));
    api.get<Payable[]>('/payables').then(setPayables).catch(() => {});
  }
  useEffect(load, []);

  async function pay(id: string) {
    try {
      await api.post('/disbursements', { payableId: id, amount: amounts[id] ?? '0', method: 'TRANSFER' });
      setMsg('Desembolso registrado.'); setError(''); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  const buckets = cf ? [
    { label: 'Vencido', value: cf.overdue },
    { label: 'Próx. 7 días', value: cf.next7 },
    { label: 'Próx. 30 días', value: cf.next30 },
    { label: '+30 días', value: cf.beyond30 },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
      {msg && <p className="text-sm text-primary">{msg}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Flujo de caja (egresos) · Total {cf ? money(cf.total) : '—'}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {buckets.map((b) => (
              <div key={b.label} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="text-base font-semibold">{money(b.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cuentas por pagar</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {payables.length ? payables.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
              <span>Saldo <b>{money(p.balance)}</b> / {money(p.amount)}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs">{p.status}</span>
              <div className="flex items-center gap-2">
                <Input className="h-8 w-28" placeholder="Monto" value={amounts[p.id] ?? ''} onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })} />
                <Button size="sm" disabled={p.status === 'PAID'} onClick={() => pay(p.id)}>Pagar</Button>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Sin cuentas por pagar.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
