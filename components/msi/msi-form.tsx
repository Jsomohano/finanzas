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
import { createMsiPurchase } from '@/app/(app)/msi/actions';
import type { Account, Category } from '@/lib/db/types';

const INSTALLMENT_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

export function MsiForm({
  accounts,
  categories,
  onDone,
}: {
  accounts: Account[];
  categories: Category[];
  onDone?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthFirst = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createMsiPurchase(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required placeholder="Laptop Dell XPS" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchant">Comercio</Label>
        <Input id="merchant" name="merchant" placeholder="Amazon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_amount">Monto total</Label>
          <Input id="total_amount" name="total_amount" type="number" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installments">Mensualidades</Label>
          <Select name="installments" defaultValue="12">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INSTALLMENT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} meses</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Fecha de compra</Label>
          <Input id="purchase_date" name="purchase_date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_payment_month">Primer pago</Label>
          <Input id="first_payment_month" name="first_payment_month" type="date" defaultValue={nextMonthFirst} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Tarjeta</Label>
        <Select name="account_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona tarjeta…" /></SelectTrigger>
          <SelectContent>
            {accounts.filter((a) => a.type === 'credit').map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" required>
          <SelectTrigger><SelectValue placeholder="Categoría del gasto…" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar compra'}</Button>
    </form>
  );
}
