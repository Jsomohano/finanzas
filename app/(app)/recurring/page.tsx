import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listRecurringItems, getLastPayments } from '@/lib/db/recurring';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { RecurringItemDialog } from '@/components/recurring/recurring-item-dialog';
import { RecurringList } from '@/components/recurring/recurring-list';

export default async function RecurringPage() {
  const [items, accounts, categories] = await Promise.all([
    listRecurringItems(),
    listAccounts(),
    listCategories('expense'),
  ]);

  const itemIds = items.map(i => i.id);
  const lastPayments = await getLastPayments(itemIds);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Gastos Recurrentes</h1>

      <Tabs defaultValue="subscriptions">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="fixed">Gastos Fijos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <RecurringItemDialog accounts={accounts} categories={categories} type="subscription" />
          </div>
          <RecurringList
            items={items}
            lastPayments={lastPayments}
            accounts={accounts}
            categories={categories}
            type="subscription"
          />
        </TabsContent>

        <TabsContent value="fixed" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <RecurringItemDialog accounts={accounts} categories={categories} type="fixed" />
          </div>
          <RecurringList
            items={items}
            lastPayments={lastPayments}
            accounts={accounts}
            categories={categories}
            type="fixed"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
