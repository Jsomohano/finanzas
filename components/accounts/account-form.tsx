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
import { createAccount, updateAccount } from '@/app/(app)/accounts/actions';
import { HelpTip } from '@/components/ui/help-tip';
import type { Account } from '@/lib/db/types';

export function AccountForm({ initial, onDone }: { initial?: Account; onDone?: () => void }) {
  const [type, setType] = useState<Account['type']>(initial?.type ?? 'debit');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = initial
      ? await updateAccount(initial.id, formData)
      : await createAccount(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required defaultValue={initial?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select name="type" value={type} onValueChange={(v) => setType(v as Account['type'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="debit">Débito</SelectItem>
            <SelectItem value="credit">Crédito</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank">Banco (opcional)</Label>
        <Input id="bank" name="bank" defaultValue={initial?.bank ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="last_four">Últimos 4</Label>
          <Input id="last_four" name="last_four" maxLength={4} defaultValue={initial?.last_four ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current_balance">Saldo actual</Label>
          <Input id="current_balance" name="current_balance" type="number" step="0.01" defaultValue={initial?.current_balance ?? 0} />
        </div>
      </div>

      {type === 'credit' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="closing_day" className="flex items-center gap-1">
              Día de corte
              <HelpTip text="Día del mes en que el banco cierra el periodo y genera tu estado de cuenta." />
            </Label>
            <Input id="closing_day" name="closing_day" type="number" min={1} max={31} defaultValue={initial?.closing_day ?? ''} placeholder="Ej. 15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_day" className="flex items-center gap-1">
              Día de pago
              <HelpTip text="Fecha límite para pagar el saldo sin generar intereses." />
            </Label>
            <Input id="payment_day" name="payment_day" type="number" min={1} max={31} defaultValue={initial?.payment_day ?? ''} placeholder="Ej. 10" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
