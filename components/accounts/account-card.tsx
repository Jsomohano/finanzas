'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteAccount } from '@/app/(app)/accounts/actions';
import { AccountForm } from './account-form';
import type { Account } from '@/lib/db/types';

const TYPE_LABEL: Record<Account['type'], string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
};

export function AccountCard({ account }: { account: Account }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setPending(true);
    const result = await deleteAccount(account.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Cuenta eliminada');
      router.refresh();
    }
    setPending(false);
  }

  function onEditDone() {
    setEditing(false);
    router.refresh();
    toast.success('Cuenta actualizada');
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            {account.bank && <p className="text-xs text-muted-foreground">{account.bank}</p>}
          </div>
          <Badge variant="outline">{TYPE_LABEL[account.type]}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">
            {account.type === 'credit' ? 'Deuda actual' : 'Saldo disponible'}
          </p>
          <div className={`text-2xl font-bold ${account.type === 'credit' && account.current_balance > 0 ? 'text-negative' : ''}`}>
            ${account.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          {account.last_four && (
            <p className="text-xs text-muted-foreground">•••• {account.last_four}</p>
          )}
          {account.type === 'credit' && account.closing_day && (
            <p className="text-xs text-muted-foreground">
              Corte día {account.closing_day} · Pago día {account.payment_day}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              Editar
            </Button>
            {confirming ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={handleDelete}
                >
                  {pending ? 'Eliminando…' : 'Sí, eliminar'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cuenta</DialogTitle>
          </DialogHeader>
          <AccountForm initial={account} onDone={onEditDone} />
        </DialogContent>
      </Dialog>
    </>
  );
}
