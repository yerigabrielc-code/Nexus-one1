'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Customer { id: string; legalName: string; code: string }
interface Line { productId: string; quantity: string; unitPrice: string }

export default function VentasPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '1', unitPrice: '0' }]);
  const [order, setOrder] = useState<{ id: string; number: string; status: string } | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Customer[]>('/customers').then((c) => { setCustomers(c); if (c[0]) setCustomerId(c[0].id); }).catch(() => {});
  }, []);

  const total = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0) * 1.18, 0);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function createOrder() {
    setError(''); setResult('');
    try {
      const r = await api.post<{ id: string; number: string }>('/orders', { customerId, lines });
      setOrder({ ...r, status: 'DRAFT' });
      setResult(`Pedido ${r.number} creado.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }
  async function confirmOrder() {
    if (!order) return;
    try { await api.post(`/orders/${order.id}/confirm`, {}); setOrder({ ...order, status: 'CONFIRMED' }); setResult('Pedido confirmado (stock se reservará vía saga).'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }
  async function invoiceOrder() {
    if (!order) return;
    try {
      const r = await api.post<{ ncf: string; number: string; fiscalStatus: string }>(`/orders/${order.id}/invoice`, {});
      setOrder({ ...order, status: 'INVOICED' });
      setResult(`Factura ${r.number} · e-NCF ${r.ncf} · DGII: ${r.fiscalStatus}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>

      <Card>
        <CardHeader><CardTitle>Nuevo pedido</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.legalName} ({c.code})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Líneas (ITBIS 18% incluido en el total)</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-6" placeholder="Product ID" value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value })} />
                <Input className="col-span-2" placeholder="Cant." value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                <Input className="col-span-3" placeholder="Precio" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: '1', unitPrice: '0' }])}>
              <Plus className="h-4 w-4" /> Agregar línea
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="text-lg font-semibold">{money(total)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={createOrder} disabled={!customerId}>Crear pedido</Button>
            <Button onClick={confirmOrder} variant="outline" disabled={!order || order.status !== 'DRAFT'}>Confirmar</Button>
            <Button onClick={invoiceOrder} variant="outline" disabled={!order || order.status !== 'CONFIRMED'}>Facturar (e-NCF)</Button>
          </div>

          {result && <p className="text-sm text-primary">{result}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {order && <p className="text-xs text-muted-foreground">Pedido {order.number} · estado {order.status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
