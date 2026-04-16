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
import { TransferForm } from './transfer-form';
import type { Account } from '@/lib/db/types';
import { ArrowRightLeft } from 'lucide-react';

export function TransferDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onDone() {
    setOpen(false);
    router.refresh();
    toast.success('Movimiento registrado');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Nuevo movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimiento entre cuentas</DialogTitle>
        </DialogHeader>
        <TransferForm accounts={accounts} onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}
