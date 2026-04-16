'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { registerPayment } from '@/app/(app)/recurring/actions';
import type { Account, RecurringItemWithRelations } from '@/lib/db/types';

type Props = {
  item: RecurringItemWithRelations;
  accounts: Account[];
};

export function RegisterPaymentDialog({ item, accounts }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set('kind', 'expense');
    formData.set('description', item.name);
    const result = await registerPayment(item.id, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      router.refresh();
      toast.success(`Pago de ${item.name} registrado`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Registrar pago</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago — {item.name}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input name="date" type="date" required defaultValue={today} />
            </div>
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input name="amount" type="number" step="0.01" required defaultValue={item.amount} />
            </div>
          </div>

          <div>
            <Label htmlFor="account_id">Cuenta</Label>
            <Select name="account_id" required defaultValue={item.account_id ?? ''}>
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

          <input type="hidden" name="category_id" value={item.category_id ?? ''} />

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input name="notes" placeholder="Opcional" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Registrando...' : 'Confirmar pago'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
