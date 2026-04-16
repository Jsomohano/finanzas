'use client';

import { useState, useRef } from 'react';
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
import { HelpTip } from '@/components/ui/help-tip';
import type { Account } from '@/lib/db/types';

const TYPE_LABEL: Record<Account['type'], string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
};

const UNDO_DELAY_MS = 6000;

export function AccountCard({ account }: { account: Account }) {
  const [confirming, setConfirming] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function handleDelete() {
    setConfirming(false);
    setHidden(true);

    const toastId = toast('Cuenta eliminada', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          if (undoTimer.current) clearTimeout(undoTimer.current);
          undoTimer.current = null;
          setHidden(false);
          toast.dismiss(toastId);
        },
      },
      duration: UNDO_DELAY_MS,
    });

    undoTimer.current = setTimeout(async () => {
      undoTimer.current = null;
      const result = await deleteAccount(account.id);
      if (result.error) {
        setHidden(false);
        toast.error(result.error);
      } else {
        router.refresh();
      }
    }, UNDO_DELAY_MS);
  }

  function onEditDone() {
    setEditing(false);
    router.refresh();
    toast.success('Cuenta actualizada');
  }

  if (hidden) return null;

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
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Corte día {account.closing_day} · Pago día {account.payment_day}
              <HelpTip text="Corte: fecha en que el banco cierra el periodo y genera tu estado de cuenta. Pago: fecha límite para pagar sin intereses." />
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
                  onClick={handleDelete}
                >
                  Sí, eliminar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
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
