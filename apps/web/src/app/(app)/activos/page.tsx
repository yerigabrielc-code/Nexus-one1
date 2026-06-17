'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';

interface Asset { id: string; code: string; name: string; status: string }
interface WO { id: string; number: string; type: string; status: string }

export default function ActivosPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [wos, setWos] = useState<WO[]>([]);
  const [asset, setAsset] = useState({ code: '', name: '', category: '' });
  const [assetId, setAssetId] = useState('');
  const [wo, setWo] = useState({ type: 'PREVENTIVE', description: '', checklist: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get<Asset[]>('/assets').then((a) => { setAssets(a); if (a[0]) setAssetId(a[0].id); }).catch((e) => setError(e.message));
    api.get<WO[]>('/work-orders').then(setWos).catch(() => {});
  }
  useEffect(load, []);

  const wrap = (fn: () => Promise<unknown>, ok: string) =>
    fn().then(() => { setMsg(ok); setError(''); load(); }).catch((e) => setError(e.message));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Activos y Mantenimiento</h1>
      {msg && <p className="text-sm text-primary">{msg}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Nuevo activo</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); wrap(() => api.post('/assets', asset), `Activo ${asset.code} creado.`); setAsset({ code: '', name: '', category: '' }); }}>
              <div className="space-y-1.5"><Label>Código</Label><Input value={asset.code} onChange={(e) => setAsset({ ...asset, code: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={asset.name} onChange={(e) => setAsset({ ...asset, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Categoría</Label><Input value={asset.category} onChange={(e) => setAsset({ ...asset, category: e.target.value })} /></div>
              <Button type="submit" className="w-full">Crear activo</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Nueva orden de trabajo</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const checklist = wo.checklist.split('\n').map((s) => s.trim()).filter(Boolean);
                wrap(() => api.post('/work-orders', { assetId, type: wo.type, description: wo.description, checklist }), 'OT creada.');
              }}
            >
              <div className="space-y-1.5">
                <Label>Activo</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={wo.type} onChange={(e) => setWo({ ...wo, type: e.target.value })}>
                  <option value="PREVENTIVE">Preventivo</option>
                  <option value="CORRECTIVE">Correctivo</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Descripción</Label><Input value={wo.description} onChange={(e) => setWo({ ...wo, description: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Checklist (una tarea por línea)</Label>
                <textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={wo.checklist} onChange={(e) => setWo({ ...wo, checklist: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={!assetId}>Crear OT</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Órdenes de trabajo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {wos.length ? wos.map((w) => (
            <div key={w.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
              <span className="font-medium">{w.number}</span>
              <span className="text-muted-foreground">{w.type}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs">{w.status}</span>
              <Button size="sm" variant="outline" disabled={w.status === 'DONE'} onClick={() => wrap(() => api.post(`/work-orders/${w.id}/complete`, {}), `OT ${w.number} completada.`)}>Completar</Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">Sin órdenes de trabajo.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
