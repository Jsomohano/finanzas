import { addMonthsMX } from '@/lib/dates/month-mx';

export type MsiPurchase = {
  id: string;
  total_amount: number;
  installments: number;
  first_payment_month: string; // YYYY-MM-01
  status: 'active' | 'completed' | 'cancelled';
};

export type ScheduleEntry = {
  month: string; // YYYY-MM-01
  amount: number;
  index: number; // 1-based payment number
};

export type MonthProjection = {
  month: string;
  amount: number;
};

/** Returns the per-month payment amount, rounded to 2 decimals. */
export function monthlyAmount(p: Pick<MsiPurchase, 'total_amount' | 'installments'>): number {
  return Math.round((p.total_amount / p.installments) * 100) / 100;
}

/** Returns all scheduled payments for a purchase. */
export function paymentSchedule(p: MsiPurchase): ScheduleEntry[] {
  const per = monthlyAmount(p);
  const out: ScheduleEntry[] = [];
  for (let i = 0; i < p.installments; i++) {
    out.push({
      month: addMonthsMX(p.first_payment_month, i),
      amount: per,
      index: i + 1,
    });
  }
  return out;
}

/** Returns the amount due for this purchase in the given month (YYYY-MM-01). */
export function amountDueInMonth(p: MsiPurchase, month: string): number {
  if (p.status !== 'active') return 0;
  if (month < p.first_payment_month) return 0;
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  if (month > lastPayment) return 0;
  return monthlyAmount(p);
}

/** Returns a projection across N months starting from `fromMonth`. */
export function projectionForMonths(
  purchases: MsiPurchase[],
  fromMonth: string,
  months: number
): MonthProjection[] {
  const out: MonthProjection[] = [];
  for (let i = 0; i < months; i++) {
    const month = addMonthsMX(fromMonth, i);
    const amount = purchases.reduce((sum, p) => sum + amountDueInMonth(p, month), 0);
    out.push({ month, amount: Math.round(amount * 100) / 100 });
  }
  return out;
}

/** Returns how many payments are still pending from the given month (inclusive). */
export function monthsRemaining(p: MsiPurchase, asOfMonth: string): number {
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  if (asOfMonth > lastPayment) return 0;
  if (asOfMonth <= p.first_payment_month) return p.installments;
  let count = 0;
  let cursor = asOfMonth;
  while (cursor <= lastPayment) {
    count++;
    cursor = addMonthsMX(cursor, 1);
  }
  return count;
}

/** True if all payments for this purchase are behind the given month. */
export function isCompletedAsOf(p: MsiPurchase, asOfMonth: string): boolean {
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  return asOfMonth > lastPayment;
}
