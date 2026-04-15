import { amountDueInMonth, monthlyAmount, type MsiPurchase } from './calculations';

export type AggregateResult = {
  month: string;
  total: number;
  contributors: Array<{ purchaseId: string; amount: number }>;
};

/** Pure calculation — no DB side-effects. */
export function calculateAggregateForMonth(
  purchases: MsiPurchase[],
  month: string
): AggregateResult {
  const contributors: Array<{ purchaseId: string; amount: number }> = [];
  let total = 0;
  for (const p of purchases) {
    const amount = amountDueInMonth(p, month);
    if (amount > 0) {
      contributors.push({ purchaseId: p.id, amount: monthlyAmount(p) });
      total += amount;
    }
  }
  return { month, total: Math.round(total * 100) / 100, contributors };
}
