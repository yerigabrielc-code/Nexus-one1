'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Aging {
  current: string; d1_30: string; d31_60: string; d61_90: string; d90_plus: string; total: string;
}

export default function CobrosPage() {
  const [aging, setAging] = useState<Aging | null>(null);
  const [pay, setPay] = useState({ receivableId: '', amount: '', method: 'TRANSFER' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get<Aging>('/reports/aging').then(setAging).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function registerPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const r = await api.post<{ balance: string; status: string }>('/payments', pay);
      setMsg(`Pago registrado · saldo ${money(r.balance)} · ${r.status}`);
      setPay({ receivableId: '', amount: '', method: 'TRANSFER' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
  }

  const buckets = aging ? [
    { label: 'Por vencer', value: aging.current },
    { label: '1–30', value: aging.d1_30 },
    { label: '31–60', value: aging.d31_60 },
    { label: '61–90', value: aging.d61_90 },
    { label: '+90', value: aging.d90_plus },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>

      <Card>
        <CardHeader><CardTitle>Aging Report · Total {aging ? money(aging.total) : '—'}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {buckets.length ? buckets.map((b) => (
              <div key={b.label} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="text-base font-semibold">{money(b.value)}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sin cartera.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader><CardTitle>Registrar pago</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={registerPayment} className="space-y-3">
            <div className="space-y-1.5"><Label>Receivable ID</Label><Input value={pay.receivableId} onChange={(e) => setPay({ ...pay, receivableId: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Monto</Label><Input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                </select>
              </div>
            </div>
            {msg && <p className="text-sm text-primary">{msg}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Registrar pago</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
