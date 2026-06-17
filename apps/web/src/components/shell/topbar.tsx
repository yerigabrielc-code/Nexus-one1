'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { getUser, clearSession } from '@/lib/auth';
import { api } from '@/lib/api';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const user = getUser();

  async function onLogout() {
    await api.post('/auth/logout', {}).catch(() => {}); // limpia cookies en el server
    clearSession();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Menú">
        <Menu className="h-5 w-5" />
      </Button>

      <button className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex">
        <Search className="h-4 w-4" /> Buscar… <kbd className="ml-2 rounded bg-muted px-1.5 text-xs">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.fullName ?? 'Usuario'}</span>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Salir">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
