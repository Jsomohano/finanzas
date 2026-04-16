import { notFound } from 'next/navigation';
import { getMsiPurchase } from '@/lib/db/msi';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { MsiCalendar } from '@/components/msi/msi-calendar';
import { MsiDialog } from '@/components/msi/msi-dialog';
import { monthlyAmount } from '@/lib/msi/calculations';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function MsiDetailPage({ params }: { params: { id: string } }) {
  const [purchase, accounts, categories] = await Promise.all([
    getMsiPurchase(params.id),
    listAccounts(),
    listCategories('expense'),
  ]);
  if (!purchase) notFound();

  const per = monthlyAmount(purchase);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{purchase.description}</h1>
          <p className="text-sm text-muted-foreground">{purchase.merchant}</p>
          {purchase.accounts && (
            <p className="text-sm text-muted-foreground">
              Tarjeta: {purchase.accounts.name}
              {purchase.accounts.last_four ? ` ···${purchase.accounts.last_four}` : ''}
            </p>
          )}
        </div>
        {purchase.status === 'active' && (
          <MsiDialog
            accounts={accounts}
            categories={categories}
            initialData={purchase}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Total</div>
          <div className="text-xl font-bold">${purchase.total_amount.toLocaleString('es-MX')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Mensualidad</div>
          <div className="text-xl font-bold">${per.toLocaleString('es-MX')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Mensualidades</div>
          <div className="text-xl font-bold">{purchase.installments}</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">Calendario de pagos</h2>
        <MsiCalendar purchase={purchase} />
      </div>
    </div>
  );
}
