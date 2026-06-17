'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';

export default function InventarioPage() {
  const [product, setProduct] = useState({ sku: '', name: '', basePrice: '0' });
  const [warehouse, setWarehouse] = useState({ code: '', name: '' });
  const [inbound, setInbound] = useState({ productId: '', warehouseId: '', quantity: '', unitCost: '' });
  const [log, setLog] = useState<string[]>([]);

  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 12));
  const run = (fn: () => Promise<unknown>, ok: (r: any) => string) =>
    fn().then((r) => push(ok(r))).catch((e) => push(`❌ ${e.message}`));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Nuevo producto</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); run(() => api.post('/products', product), (r) => `✔ Producto ${r.sku} · id=${r.id}`); }}
            >
              <div className="space-y-1.5"><Label>SKU</Label><Input value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Precio base</Label><Input value={product.basePrice} onChange={(e) => setProduct({ ...product, basePrice: e.target.value })} /></div>
              <Button type="submit" className="w-full">Crear producto</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Nuevo almacén</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); run(() => api.post('/warehouses', warehouse), (r) => `✔ Almacén ${r.code} · id=${r.id}`); }}
            >
              <div className="space-y-1.5"><Label>Código</Label><Input value={warehouse.code} onChange={(e) => setWarehouse({ ...warehouse, code: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={warehouse.name} onChange={(e) => setWarehouse({ ...warehouse, name: e.target.value })} required /></div>
              <Button type="submit" className="w-full">Crear almacén</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Entrada de stock</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); run(() => api.post('/stock/inbound', inbound), (r) => `✔ Entrada · onHand=${r.onHand} avgCost=${r.avgCost}`); }}
            >
              <div className="space-y-1.5"><Label>Product ID</Label><Input value={inbound.productId} onChange={(e) => setInbound({ ...inbound, productId: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Warehouse ID</Label><Input value={inbound.warehouseId} onChange={(e) => setInbound({ ...inbound, warehouseId: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>Cantidad</Label><Input value={inbound.quantity} onChange={(e) => setInbound({ ...inbound, quantity: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label>Costo unit.</Label><Input value={inbound.unitCost} onChange={(e) => setInbound({ ...inbound, unitCost: e.target.value })} required /></div>
              </div>
              <Button type="submit" className="w-full">Registrar entrada</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actividad</CardTitle></CardHeader>
        <CardContent className="space-y-1 font-mono text-xs">
          {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <p className="text-muted-foreground">Sin actividad.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
