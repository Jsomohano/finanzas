import { listTransfers } from '@/lib/db/transfers';
import { listAccounts } from '@/lib/db/accounts';
import { TransferDialog } from '@/components/transfers/transfer-dialog';
import { TransferList } from '@/components/transfers/transfer-list';

export default async function TransfersPage() {
  const [transfers, accounts] = await Promise.all([
    listTransfers(),
    listAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimientos entre cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Transferencias, pagos de tarjeta y otros movimientos
          </p>
        </div>
        <TransferDialog accounts={accounts} />
      </div>

      <TransferList transfers={transfers} />
    </div>
  );
}
