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
import { createTransaction } from '@/app/(app)/transactions/actions';
import type { Account, Category } from '@/lib/db/types';

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  onDone,
}: {
  accounts: Account[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  onDone?: () => void;
}) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const categories = kind === 'expense' ? expenseCategories : incomeCategories;

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createTransaction(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={kind === 'expense' ? 'default' : 'outline'} onClick={() => setKind('expense')}>Gasto</Button>
        <Button type="button" variant={kind === 'income' ? 'default' : 'outline'} onClick={() => setKind('income')}>Ingreso</Button>
      </div>
      <input type="hidden" name="kind" value={kind} />

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Cuenta</Label>
        <Select name="account_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
