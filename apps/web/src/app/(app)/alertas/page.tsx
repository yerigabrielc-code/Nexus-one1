'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface Alert { id: string; type: string; message: string; isRead: boolean; createdAt: string }

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Alert[]>('/alerts').then(setAlerts).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
      <p className="text-sm text-muted-foreground">Generadas por el Centro de Automatización (reglas y eventos del sistema).</p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Notificaciones ({alerts.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length ? alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 border-b border-border py-3 text-sm last:border-0">
              <Bell className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p>{a.message}</p>
                <span className="text-xs text-muted-foreground">{a.type} · {new Date(a.createdAt).toLocaleString('es-DO')}</span>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">Sin alertas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
