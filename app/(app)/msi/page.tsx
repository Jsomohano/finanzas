import { listMsiPurchases } from '@/lib/db/msi';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { MsiList } from '@/components/msi/msi-list';
import { MsiForm } from '@/components/msi/msi-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
          <p className="text-sm text-muted-foreground">Tus compras a MSI y sus calendarios de pago.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva compra MSI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva compra a MSI</DialogTitle>
            </DialogHeader>
            <MsiForm accounts={accounts} categories={categories} />
          </DialogContent>
        </Dialog>
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
