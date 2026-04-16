'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransfer } from '@/app/(app)/transfers/actions';
import type { Account } from '@/lib/db/types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
};

function accountLabel(a: Account): string {
  const suffix = a.last_four ? ` ···${a.last_four}` : '';
  return `${a.name}${suffix} (${ACCOUNT_TYPE_LABELS[a.type] ?? a.type})`;
}

export function TransferForm({
  accounts,
  onDone,
}: {
  accounts: Account[];
  onDone?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const today = new Date().toISOString().slice(0, 10);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createTransfer(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  const availableDestinations = accounts.filter((a) => a.id !== fromAccountId);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="from_account_id">Cuenta origen</Label>
        <Select
          name="from_account_id"
          required
          onValueChange={setFromAccountId}
        >
          <SelectTrigger><SelectValue placeholder="¿De dónde sale el dinero?" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{accountLabel(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_account_id">Cuenta destino</Label>
        <Select name="to_account_id" required>
          <SelectTrigger><SelectValue placeholder="¿A dónde va el dinero?" /></SelectTrigger>
          <SelectContent>
            {availableDestinations.map((a) => (
              <SelectItem key={a.id} value={a.id}>{accountLabel(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required placeholder="Pago tarjeta BBVA" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
        <Input id="notes" name="notes" placeholder="Información adicional…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar movimiento'}
      </Button>
    </form>
  );
}
