'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';

interface Doc { id: string; name: string; mimeType: string; version: number; groupId: string; createdAt: string }

export default function DocumentalPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [form, setForm] = useState({ name: '', mimeType: 'application/pdf', storageKey: '', entityType: '', entityId: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get<Doc[]>('/documents').then(setDocs).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        mimeType: form.mimeType,
        storageKey: form.storageKey || `docs/${Date.now()}-${form.name}`,
      };
      if (form.entityType) payload.entityType = form.entityType;
      if (form.entityId) payload.entityId = form.entityId;
      const r = await api.post<{ version: number }>('/documents', payload);
      setMsg(`Documento registrado (v${r.version}).`);
      setForm({ name: '', mimeType: 'application/pdf', storageKey: '', entityType: '', entityId: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Gestión Documental</h1>
      <p className="text-sm text-muted-foreground">El binario se almacena en S3-compatible; aquí se registran metadatos y versiones.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Registrar documento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.mimeType} onChange={(e) => setForm({ ...form, mimeType: e.target.value })}>
                  <option value="application/pdf">PDF</option>
                  <option value="application/vnd.ms-excel">Excel</option>
                  <option value="image/png">Imagen</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Vincular a (tipo)</Label><Input value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })} placeholder="Invoice / Customer / Asset" /></div>
              <div className="space-y-1.5"><Label>Vincular a (ID)</Label><Input value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} placeholder="uuid (opcional)" /></div>
              {msg && <p className="text-sm text-primary">{msg}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Registrar</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Documentos ({docs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {docs.length ? docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 border-b border-border py-2 text-sm last:border-0">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">v{d.version}</span>
                <span className="ml-auto text-xs text-muted-foreground">{d.mimeType}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sin documentos.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
