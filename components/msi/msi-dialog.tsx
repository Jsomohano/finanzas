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
import { MsiForm } from './msi-form';
import type { Account, Category, MsiPurchaseRow } from '@/lib/db/types';

export function MsiDialog({
  accounts,
  categories,
  initialData,
  trigger,
}: {
  accounts: Account[];
  categories: Category[];
  initialData?: MsiPurchaseRow;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEditing = !!initialData;

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success(isEditing ? 'Compra MSI actualizada' : 'Compra MSI registrada');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>+ Nueva compra MSI</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar compra MSI' : 'Nueva compra a MSI'}</DialogTitle>
        </DialogHeader>
        <MsiForm
          accounts={accounts}
          categories={categories}
          initialData={initialData}
          onDone={onDone}
        />
      </DialogContent>
    </Dialog>
  );
}
