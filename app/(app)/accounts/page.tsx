import { listAccounts } from '@/lib/db/accounts';
import { AccountCard } from '@/components/accounts/account-card';
import { AccountForm } from '@/components/accounts/account-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default async function AccountsPage() {
  const accounts = await listAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas y tarjetas</h1>
          <p className="text-sm text-muted-foreground">Administra tus cuentas, tarjetas y efectivo.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva cuenta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva cuenta</DialogTitle>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>
    </div>
  );
}
