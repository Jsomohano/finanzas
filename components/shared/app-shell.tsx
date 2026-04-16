'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { ThemeToggle } from './theme-toggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
