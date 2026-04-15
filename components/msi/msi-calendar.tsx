import type { MsiPurchaseRow } from '@/lib/db/types';
import { paymentSchedule } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';

export function MsiCalendar({ purchase }: { purchase: MsiPurchaseRow }) {
  const schedule = paymentSchedule({
    id: purchase.id,
    total_amount: purchase.total_amount,
    installments: purchase.installments,
    first_payment_month: purchase.first_payment_month,
    status: purchase.status,
  });
  const nowMonth = currentMonthMX();

  return (
    <div className="space-y-1">
      {schedule.map((entry) => {
        const status =
          entry.month < nowMonth ? 'pagado' :
          entry.month === nowMonth ? 'este mes' : 'pendiente';
        return (
          <div
            key={entry.month}
            className={`flex justify-between text-sm px-3 py-2 rounded ${
              status === 'pagado' ? 'bg-muted text-muted-foreground' :
              status === 'este mes' ? 'bg-primary/10 font-semibold' : ''
            }`}
          >
            <span>Pago {entry.index} · {entry.month}</span>
            <span>${entry.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs uppercase">{status}</span>
          </div>
        );
      })}
    </div>
  );
}
