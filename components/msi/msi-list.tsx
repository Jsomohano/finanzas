'use client';

import { useState } from 'react';
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

export function MsiList({ purchases }: { purchases: MsiPurchaseWithAccount[] }) {
  const nowMonth = currentMonthMX();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel(id: string) {
    setPending(id);
    const result = await cancelMsiPurchase(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Compra MSI cancelada');
      router.refresh();
    }
    setConfirming(null);
    setPending(null);
  }

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
        {purchases.map((p) => {
          const per = monthlyAmount(p);
          const remaining = monthsRemaining(
            { id: p.id, total_amount: p.total_amount, installments: p.installments, first_payment_month: p.first_payment_month, status: p.status },
            nowMonth
          );
          const paid = p.installments - remaining;
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
                          disabled={pending === p.id}
                          onClick={() => handleCancel(p.id)}
                        >
                          {pending === p.id ? '…' : 'Cancelar MSI'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending === p.id}
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
