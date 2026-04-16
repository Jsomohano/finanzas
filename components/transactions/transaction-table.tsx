'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { deleteTransaction } from '@/app/(app)/transactions/actions';
import type { Transaction, Category, Account } from '@/lib/db/types';

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
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    setPending(id);
    const result = await deleteTransaction(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Transacción eliminada');
      router.refresh();
    }
    setConfirming(null);
    setPending(null);
  }

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
        {transactions.map((t) => {
          const cat = catMap.get(t.category_id);
          const acc = t.account_id ? accMap.get(t.account_id) : null;
          const isDeletable = t.source !== 'msi_aggregate';
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
                {isDeletable && (
                  confirming === t.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending === t.id}
                        onClick={() => handleDelete(t.id)}
                      >
                        {pending === t.id ? '…' : 'Sí'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending === t.id}
                        onClick={() => setConfirming(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirming(t.id)}
                    >
                      Borrar
                    </Button>
                  )
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
