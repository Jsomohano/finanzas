import type { MsiPurchaseRow } from '@/lib/db/types';
import { paymentSchedule } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';

export function MsiCalendar({
  purchase,
  closingDay,
}: {
  purchase: MsiPurchaseRow;
  closingDay?: number | null;
}) {
  const schedule = paymentSchedule({
    id: purchase.id,
    total_amount: purchase.total_amount,
    installments: purchase.installments,
    first_payment_month: purchase.first_payment_month,
    status: purchase.status,
  });
  const nowMonth = currentMonthMX();
  const todayDay = new Date().getDate();
  // Current month counts as paid if the closing day has already passed
  const currentMonthIsPaid = closingDay != null && todayDay >= closingDay;

  return (
    <div className="space-y-1">
      {schedule.map((entry) => {
        const isPast = entry.month < nowMonth;
        const isCurrent = entry.month === nowMonth;
        const status =
          isPast || (isCurrent && currentMonthIsPaid) ? 'pagado' :
          isCurrent ? 'este mes' : 'pendiente';
        return (
          <div
            key={entry.month}
            className={`flex justify-between text-sm px-3 py-2 rounded ${
              status === 'pagado' ? 'bg-muted text-muted-foreground' :
              status === 'este mes' ? 'bg-primary/[0.12] ring-1 ring-primary/30 font-semibold' : ''
            }`}
          >
            <span>Pago {entry.index} · {entry.month}</span>
            <span>${entry.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs uppercase ${status === 'este mes' ? 'text-primary' : ''}`}>{status}</span>
          </div>
        );
      })}
    </div>
  );
}
