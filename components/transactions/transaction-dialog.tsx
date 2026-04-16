'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from './transaction-form';
import type { Account, Category } from '@/lib/db/types';

export function TransactionDialog({
  accounts,
  expenseCategories,
  incomeCategories,
}: {
  accounts: Account[];
  expenseCategories: Category[];
  incomeCategories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success('Transacción guardada');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva transacción</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva transacción</DialogTitle>
        </DialogHeader>
        <TransactionForm
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onDone={onDone}
        />
      </DialogContent>
    </Dialog>
  );
}
