import { listAccounts } from '@/lib/db/accounts';
import { AccountCard } from '@/components/accounts/account-card';
import { AccountDialog } from '@/components/accounts/account-dialog';

export default async function AccountsPage() {
  const accounts = await listAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} {accounts.length === 1 ? 'cuenta registrada' : 'cuentas registradas'}</p>
        </div>
        <AccountDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Sin cuentas registradas.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Agrega tu tarjeta de crédito, débito o efectivo para empezar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      )}
    </div>
  );
}
