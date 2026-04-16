'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  List,
  CreditCard,
  Repeat,
  TrendingUp,
  Wallet,
  BarChart3,
  Settings,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/transactions', label: 'Transacciones', icon: List },
    ],
  },
  {
    label: 'Compromisos',
    items: [
      { href: '/msi', label: 'MSI', icon: CreditCard },
      { href: '/recurring', label: 'Recurrentes', icon: Repeat },
    ],
  },
  {
    label: 'Patrimonio',
    items: [
      { href: '/investments', label: 'Inversiones', icon: TrendingUp, disabled: true },
      { href: '/accounts', label: 'Cuentas', icon: Wallet },
      { href: '/transfers', label: 'Transferencias', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { href: '/reports', label: 'Reportes', icon: BarChart3 },
      { href: '/settings', label: 'Ajustes', icon: Settings },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-card h-screen flex flex-col shadow-lg md:shadow-none">
      <div className="px-4 py-5 border-b">
        <div className="font-display font-bold text-base tracking-tight">Finanzas</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              if ((item as { disabled?: boolean }).disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground/40 cursor-not-allowed"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span className="ml-auto text-[9px] tracking-wider">Pronto</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm rounded-none transition-colors hover:bg-muted',
                    active
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-foreground/70'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
