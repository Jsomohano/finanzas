import { listTransactions } from '@/lib/db/transactions';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ensureCurrentMonthMsiAggregate } from '@/lib/db/msi-aggregate-action';

export default async function TransactionsPage() {
  await ensureCurrentMonthMsiAggregate();
  const [transactions, accounts, expenseCats, incomeCats] = await Promise.all([
    listTransactions({ limit: 100 }),
    listAccounts(),
    listCategories('expense'),
    listCategories('income'),
  ]);
  const categories = [...expenseCats, ...incomeCats];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Todos tus ingresos y gastos.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva transacción</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva transacción</DialogTitle>
            </DialogHeader>
            <TransactionForm accounts={accounts} expenseCategories={expenseCats} incomeCategories={incomeCats} />
          </DialogContent>
        </Dialog>
      </div>

      <TransactionTable transactions={transactions} categories={categories} accounts={accounts} />
    </div>
  );
}
