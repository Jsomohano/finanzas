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
import type { Account, Category } from '@/lib/db/types';

export function MsiDialog({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success('Compra MSI registrada');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva compra MSI</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva compra a MSI</DialogTitle>
        </DialogHeader>
        <MsiForm accounts={accounts} categories={categories} onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}
