'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteTransaction } from '@/app/(app)/transactions/actions';
import { TransactionForm } from './transaction-form';
import type { Transaction, Category, Account } from '@/lib/db/types';

const UNDO_DELAY_MS = 6000;

export function TransactionTable({
  transactions,
  categories,
  accounts,
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const incomeCategories = categories.filter((c) => c.kind === 'income');

  const [confirming, setConfirming] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const router = useRouter();

  const handleDelete = useCallback((id: string) => {
    setConfirming(null);
    setHidden((prev) => new Set(prev).add(id));

    const toastId = toast('Transacción eliminada', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          const timer = undoTimers.current.get(id);
          if (timer) clearTimeout(timer);
          undoTimers.current.delete(id);
          setHidden((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.dismiss(toastId);
        },
      },
      duration: UNDO_DELAY_MS,
    });

    const timer = setTimeout(async () => {
      undoTimers.current.delete(id);
      const result = await deleteTransaction(id);
      if (result.error) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.error(result.error);
      } else {
        router.refresh();
      }
    }, UNDO_DELAY_MS);

    undoTimers.current.set(id, timer);
  }, [router]);

  function onEditDone() {
    setEditing(null);
    router.refresh();
    toast.success('Transacción actualizada');
  }

  const q = search.trim().toLowerCase();
  const visible = transactions.filter((t) => {
    if (hidden.has(t.id)) return false;
    if (!q) return true;
    return (
      t.description.toLowerCase().includes(q) ||
      (catMap.get(t.category_id)?.name ?? '').toLowerCase().includes(q) ||
      (t.account_id ? accMap.get(t.account_id)?.name ?? '' : '').toLowerCase().includes(q)
    );
  });

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">Sin transacciones todavía.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Registra tu primer gasto o ingreso con el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="Buscar por descripción, categoría o cuenta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {q && (
          <span className="text-xs text-muted-foreground">
            {visible.length} resultado{visible.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {visible.length === 0 && q ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Sin resultados para "{search}".</p>
          <button
            className="text-xs text-muted-foreground/60 underline underline-offset-2 mt-1 hover:text-foreground"
            onClick={() => setSearch('')}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((t) => {
              const cat = catMap.get(t.category_id);
              const acc = t.account_id ? accMap.get(t.account_id) : null;
              const isEditable = t.source !== 'msi_aggregate';
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.date}</TableCell>
                  <TableCell>
                    {t.description}
                    {t.source === 'msi_aggregate' && (
                      <Badge variant="secondary" className="ml-2">MSI</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{cat?.name ?? '—'}</TableCell>
                  <TableCell className="text-xs">{acc?.name ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={t.kind === 'expense' ? 'text-negative' : 'text-positive'}>
                      {t.kind === 'expense' ? '−' : '+'}${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isEditable && (
                      <div className="flex gap-1">
                        {confirming === t.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(t.id)}
                            >
                              Sí
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirming(null)}
                            >
                              No
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => setEditing(t)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirming(t.id)}
                            >
                              Borrar
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar transacción</DialogTitle>
          </DialogHeader>
          {editing && (
            <TransactionForm
              accounts={accounts}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              initial={editing}
              onDone={onEditDone}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
