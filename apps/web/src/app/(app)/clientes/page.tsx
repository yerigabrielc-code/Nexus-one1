'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  code: string;
  legalName: string;
  type: string;
  createdAt: string;
}

export default function ClientesPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [form, setForm] = useState({ code: '', legalName: '', taxIdType: 'RNC', taxId: '', type: 'CUSTOMER' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get<Customer[]>('/customers').then(setList).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api.post('/customers', form);
      setMsg(`Cliente ${form.code} creado.`);
      setForm({ code: '', legalName: '', taxIdType: 'RNC', taxId: '', type: 'CUSTOMER' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Nuevo cliente</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Razón social</Label>
                <Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Tipo ID</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={form.taxIdType}
                    onChange={(e) => setForm({ ...form, taxIdType: e.target.value })}
                  >
                    <option value="RNC">RNC</option>
                    <option value="CEDULA">Cédula</option>
                    <option value="NONE">Ninguno</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Identificación</Label>
                  <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="131123456" />
                </div>
              </div>
              {msg && <p className="text-sm text-primary">{msg}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Crear cliente</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Listado ({list.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {list.length ? list.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                <div>
                  <span className="font-medium">{c.legalName}</span>
                  <span className="ml-2 text-muted-foreground">{c.code}</span>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{c.type}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aún no hay clientes.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
