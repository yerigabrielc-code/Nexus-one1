'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Customer { id: string; legalName: string; code: string }
interface Statement {
  customer: { legalName: string; code: string };
  aging: { current: string; d1_30: string; d31_60: string; d61_90: string; d90_plus: string; total: string };
  invoices: { number: string; ncf: string | null; total: string; status: string; dueDate: string | null }[];
}

export default function PortalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [stmt, setStmt] = useState<Statement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Customer[]>('/customers').then((c) => { setCustomers(c); if (c[0]) setCustomerId(c[0].id); }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!customerId) return;
    api.get<Statement>(`/portal/customers/${customerId}/statement`).then(setStmt).catch((e) => setError(e.message));
  }, [customerId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Portal de Clientes</h1>
      <p className="text-sm text-muted-foreground">Estado de cuenta consolidado (base del portal externo de autoservicio).</p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="max-w-sm">
        <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.legalName} ({c.code})</option>)}
        </select>
      </div>

      {stmt && (
        <>
          <Card>
            <CardHeader><CardTitle>{stmt.customer.legalName} · Cartera total {money(stmt.aging.total)}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[['Por vencer', stmt.aging.current], ['1–30', stmt.aging.d1_30], ['31–60', stmt.aging.d31_60], ['61–90', stmt.aging.d61_90], ['+90', stmt.aging.d90_plus]].map(([l, v]) => (
                  <div key={l} className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="text-base font-semibold">{money(v)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Facturas ({stmt.invoices.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {stmt.invoices.length ? stmt.invoices.map((i) => (
                <div key={i.number} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
                  <span className="font-medium">{i.number}</span>
                  <span className="text-muted-foreground">{i.ncf ?? 's/NCF'}</span>
                  <span>{money(i.total)}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">{i.status}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sin facturas.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
