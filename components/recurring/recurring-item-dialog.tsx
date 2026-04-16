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
import { RecurringItemForm } from './recurring-item-form';
import type { Account, Category, RecurringItem } from '@/lib/db/types';

type Props = {
  accounts: Account[];
  categories: Category[];
  type: 'subscription' | 'fixed';
  initial?: RecurringItem;
  trigger?: React.ReactNode;
};

export function RecurringItemDialog({ accounts, categories, type, initial, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success(initial ? 'Actualizado' : 'Creado');
  }

  const label = type === 'subscription' ? 'suscripción' : 'gasto fijo';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>+ {initial ? 'Editar' : `Nueva ${label}`}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${label}` : `Nueva ${label}`}</DialogTitle>
        </DialogHeader>
        <RecurringItemForm
          accounts={accounts}
          categories={categories}
          type={type}
          initial={initial}
          onDone={onDone}
        />
      </DialogContent>
    </Dialog>
  );
}
