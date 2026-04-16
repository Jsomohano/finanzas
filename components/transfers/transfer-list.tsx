'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteTransfer } from '@/app/(app)/transfers/actions';
import type { TransferWithAccounts } from '@/lib/db/transfers';

function accountLabel(acc: { name: string; last_four: string | null } | null): string {
  if (!acc) return '—';
  return acc.last_four ? `${acc.name} ···${acc.last_four}` : acc.name;
}

export function TransferList({ transfers }: { transfers: TransferWithAccounts[] }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    setPending(id);
    const result = await deleteTransfer(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Movimiento eliminado');
      router.refresh();
    }
    setConfirming(null);
    setPending(null);
  }

  if (transfers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">Sin movimientos registrados.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Registra pagos de tarjeta, transferencias entre cuentas y más.
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
          <TableHead>Origen</TableHead>
          <TableHead></TableHead>
          <TableHead>Destino</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{t.date}</TableCell>
            <TableCell className="font-medium">{t.description}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{accountLabel(t.from_account)}</TableCell>
            <TableCell className="text-muted-foreground px-1">
              <ArrowRight className="h-3 w-3" />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{accountLabel(t.to_account)}</TableCell>
            <TableCell className="text-right font-mono">
              ${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </TableCell>
            <TableCell>
              {confirming === t.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending === t.id}
                    onClick={() => handleDelete(t.id)}
                  >
                    {pending === t.id ? '…' : 'Eliminar'}
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
                  Eliminar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
