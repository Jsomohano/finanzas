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
import { AccountForm } from './account-form';

export function AccountDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success('Cuenta creada');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva cuenta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>
        <AccountForm onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}
