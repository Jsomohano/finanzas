import { listMsiPurchases } from '@/lib/db/msi';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { MsiList } from '@/components/msi/msi-list';
import { MsiDialog } from '@/components/msi/msi-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function MsiPage() {
  const [active, completed, cancelled, accounts, categories] = await Promise.all([
    listMsiPurchases('active'),
    listMsiPurchases('completed'),
    listMsiPurchases('cancelled'),
    listAccounts(),
    listCategories('expense'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meses sin intereses</h1>
          <p className="text-sm text-muted-foreground">
            {active.length > 0
              ? `${active.length} ${active.length === 1 ? 'compra activa' : 'compras activas'}`
              : 'Sin compromisos activos'}
          </p>
        </div>
        <MsiDialog accounts={accounts} categories={categories} />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Activas ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Terminadas ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas ({cancelled.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active"><MsiList purchases={active} /></TabsContent>
        <TabsContent value="completed"><MsiList purchases={completed} /></TabsContent>
        <TabsContent value="cancelled"><MsiList purchases={cancelled} /></TabsContent>
      </Tabs>
    </div>
  );
}
