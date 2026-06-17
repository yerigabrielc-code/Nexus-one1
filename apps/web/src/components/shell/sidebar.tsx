'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ShoppingCart, Wallet, Boxes,
  ShoppingBag, CreditCard, Wrench, Bell, FileText, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Boxes },
  { href: '/cobros', label: 'Cobros', icon: Wallet },
  { href: '/compras', label: 'Compras', icon: ShoppingBag },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/activos', label: 'Activos', icon: Wrench },
  { href: '/documental', label: 'Documental', icon: FileText },
  { href: '/portal', label: 'Portal', icon: Building2 },
  { href: '/alertas', label: 'Alertas', icon: Bell },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 py-4">
        <span className="text-lg font-bold tracking-tight">Nexus<span className="text-primary">One</span></span>
        <p className="text-xs text-muted-foreground">Business OS</p>
      </div>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
