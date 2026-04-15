import { notFound } from 'next/navigation';
import { getMsiPurchase } from '@/lib/db/msi';
import { MsiCalendar } from '@/components/msi/msi-calendar';
import { monthlyAmount } from '@/lib/msi/calculations';

export default async function MsiDetailPage({ params }: { params: { id: string } }) {
  const purchase = await getMsiPurchase(params.id);
  if (!purchase) notFound();

  const per = monthlyAmount(purchase);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{purchase.description}</h1>
        <p className="text-sm text-muted-foreground">{purchase.merchant}</p>
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
