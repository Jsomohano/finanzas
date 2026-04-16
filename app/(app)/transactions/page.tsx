import { listTransactions } from '@/lib/db/transactions';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { syncMsiInstallments } from '@/lib/db/msi-installments-action';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  await syncMsiInstallments();
  const [transactions, accounts, expenseCats, incomeCats] = await Promise.all([
    listTransactions({ limit: 100, categoryId: searchParams.category }),
    listAccounts(),
    listCategories('expense'),
    listCategories('income'),
  ]);
  const categories = [...expenseCats, ...incomeCats];
  const activeCategory = searchParams.category
    ? categories.find((c) => c.id === searchParams.category)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transacciones</h1>
          {activeCategory ? (
            <p className="text-sm text-muted-foreground">
              Filtrando por <span className="font-medium text-foreground">{activeCategory.name}</span>
              {' — '}
              <a href="/transactions" className="underline underline-offset-2 hover:text-foreground">
                ver todas
              </a>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Todos tus ingresos y gastos.</p>
          )}
        </div>
        <TransactionDialog accounts={accounts} expenseCategories={expenseCats} incomeCategories={incomeCats} />
      </div>

      <TransactionTable transactions={transactions} categories={categories} accounts={accounts} />
    </div>
  );
}
