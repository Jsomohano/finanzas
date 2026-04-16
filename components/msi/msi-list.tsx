'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { MsiPurchaseWithAccount } from '@/lib/db/types';
import { monthlyAmount, monthsRemaining } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';
import { toast } from 'sonner';
import { cancelMsiPurchase } from '@/app/(app)/msi/actions';

/** If the account's closing day has already passed this month, the current month
 *  installment has already appeared on the statement → count it as paid. */
function paidInstallments(p: MsiPurchaseWithAccount, nowMonth: string): number {
  const remaining = monthsRemaining(
    { id: p.id, total_amount: p.total_amount, installments: p.installments, first_payment_month: p.first_payment_month, status: p.status },
    nowMonth
  );
  const paidFromPast = p.installments - remaining; // months strictly before current month

  const closingDay = p.accounts?.closing_day ?? null;
  const todayDay = new Date().getDate();
  const currentMonthClosed = closingDay !== null && todayDay >= closingDay && remaining > 0;

  return paidFromPast + (currentMonthClosed ? 1 : 0);
}

const UNDO_DELAY_MS = 6000;

export function MsiList({ purchases }: { purchases: MsiPurchaseWithAccount[] }) {
  const nowMonth = currentMonthMX();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const router = useRouter();

  const handleCancel = useCallback((id: string) => {
    setConfirming(null);
    setHidden((prev) => new Set(prev).add(id));

    const toastId = toast('Compra MSI cancelada', {
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
      const result = await cancelMsiPurchase(id);
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

  if (purchases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">Sin compras en esta categoría.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Las compras MSI activas aparecen aquí con su calendario de pagos.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Comercio</TableHead>
          <TableHead>Tarjeta</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Mensualidad</TableHead>
          <TableHead>Progreso</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.filter((p) => !hidden.has(p.id)).map((p) => {
          const per = monthlyAmount(p);
          const paid = paidInstallments(p, nowMonth);
          return (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.merchant ?? '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {p.accounts?.name ?? '—'}
                {p.accounts?.last_four ? ` ···${p.accounts.last_four}` : ''}
              </TableCell>
              <TableCell className="text-right font-mono">${p.total_amount.toLocaleString('es-MX')}</TableCell>
              <TableCell className="text-right font-mono">${per.toLocaleString('es-MX')}</TableCell>
              <TableCell>{paid}/{p.installments}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/msi/${p.id}`} className="text-sm underline">Detalle</Link>
                  {p.status === 'active' && (
                    confirming === p.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(p.id)}
                        >
                          Cancelar MSI
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirming(p.id)}
                      >
                        Cancelar
                      </Button>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
