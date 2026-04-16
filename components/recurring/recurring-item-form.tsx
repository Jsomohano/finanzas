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
import { createRecurringItem, updateRecurringItem } from '@/app/(app)/recurring/actions';
import type { Account, Category, RecurringItem } from '@/lib/db/types';

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Cada 2 semanas',
  quincenal: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
};

type Props = {
  accounts: Account[];
  categories: Category[];
  initial?: RecurringItem;
  type: 'subscription' | 'fixed';
  onDone?: () => void;
};

export function RecurringItemForm({ accounts, categories, initial, type, onDone }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set('type', type);
    const result = initial
      ? await updateRecurringItem(initial.id, formData)
      : await createRecurringItem(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          name="name"
          required
          defaultValue={initial?.name}
          placeholder={type === 'subscription' ? 'Netflix, Spotify...' : 'Renta, Luz, Agua...'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Monto</Label>
          <Input name="amount" type="number" step="0.01" required defaultValue={initial?.amount} />
        </div>
        <div>
          <Label htmlFor="frequency">Frecuencia</Label>
          <Select name="frequency" required defaultValue={initial?.frequency ?? 'monthly'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="due_day">Día de cobro/vencimiento</Label>
          <Input
            name="due_day"
            type="number"
            min={1}
            max={31}
            defaultValue={initial?.due_day ?? ''}
            placeholder="15"
          />
        </div>
        <div>
          <Label htmlFor="account_id">Cuenta</Label>
          <Select name="account_id" defaultValue={initial?.account_id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {accounts.filter(a => a.is_active).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}{a.last_four ? ` ·${a.last_four}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" defaultValue={initial?.category_id ?? ''}>
          <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Input name="notes" defaultValue={initial?.notes ?? ''} placeholder="Opcional" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear'}
      </Button>
    </form>
  );
}
