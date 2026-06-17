'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';
import { money } from '@/lib/utils';

interface Supplier { id: string; code: string; legalName: string }
interface Warehouse { id: string; code: string; name: string }
interface Product { id: string; sku: string; name: string }
interface PO { id: string; number: string; status: string; total: string }
interface Line { productId: string; quantity: string; unitCost: string }

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [supForm, setSupForm] = useState({ code: '', legalName: '', taxIdType: 'RNC', taxId: '' });
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '1', unitCost: '0' }]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function loadAll() {
    api.get<Supplier[]>('/suppliers').then((s) => { setSuppliers(s); if (s[0]) setSupplierId(s[0].id); }).catch(() => {});
    api.get<Warehouse[]>('/warehouses').then((w) => { setWarehouses(w); if (w[0]) setWarehouseId(w[0].id); }).catch(() => {});
    api.get<Product[]>('/products').then(setProducts).catch(() => {});
    api.get<PO[]>('/purchase-orders').then(setPos).catch(() => {});
  }
  useEffect(loadAll, []);

  const wrap = (fn: () => Promise<unknown>, ok: string) =>
    fn().then(() => { setMsg(ok); setError(''); loadAll(); }).catch((e) => setError(e.message));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
      {msg && <p className="text-sm text-primary">{msg}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Nuevo proveedor</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); wrap(() => api.post('/suppliers', supForm), `Proveedor ${supForm.code} creado.`); setSupForm({ code: '', legalName: '', taxIdType: 'RNC', taxId: '' }); }}
            >
              <div className="space-y-1.5"><Label>Código</Label><Input value={supForm.code} onChange={(e) => setSupForm({ ...supForm, code: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Razón social</Label><Input value={supForm.legalName} onChange={(e) => setSupForm({ ...supForm, legalName: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>RNC</Label><Input value={supForm.taxId} onChange={(e) => setSupForm({ ...supForm, taxId: e.target.value })} /></div>
              <Button type="submit" className="w-full">Crear proveedor</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Nueva orden de compra</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.legalName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Almacén destino</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <select className="col-span-6 h-10 rounded-md border border-input bg-background px-2 text-sm" value={l.productId}
                  onChange={(e) => setLines((ls) => ls.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x))}>
                  <option value="">— producto —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <Input className="col-span-2" placeholder="Cant." value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} />
                <Input className="col-span-3" placeholder="Costo" value={l.unitCost} onChange={(e) => setLines((ls) => ls.map((x, idx) => idx === i ? { ...x, unitCost: e.target.value } : x))} />
                <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: '1', unitCost: '0' }])}>
              <Plus className="h-4 w-4" /> Línea
            </Button>
            <Button className="w-full" onClick={() => wrap(() => api.post('/purchase-orders', { supplierId, warehouseId, lines }), 'Orden de compra creada.')}>
              Crear OC
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Órdenes de compra</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pos.length ? pos.map((po) => (
            <div key={po.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
              <span className="font-medium">{po.number}</span>
              <span>{money(po.total)}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs">{po.status}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={po.status !== 'DRAFT'} onClick={() => wrap(() => api.post(`/purchase-orders/${po.id}/approve`, {}), `OC ${po.number} aprobada.`)}>Aprobar</Button>
                <Button size="sm" variant="outline" disabled={po.status !== 'APPROVED'} onClick={() => wrap(() => api.post(`/purchase-orders/${po.id}/receive`, {}), `OC ${po.number} recibida (entra a stock + CxP).`)}>Recibir</Button>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Sin órdenes.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
