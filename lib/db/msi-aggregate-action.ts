'use server';

import { createClient } from '@/lib/supabase/server';
import { currentMonthMX } from '@/lib/dates/month-mx';
import { calculateAggregateForMonth } from '@/lib/msi/aggregate';
import type { MsiPurchase } from '@/lib/msi/calculations';

/**
 * Ensures the MSI aggregate transaction exists (and is up to date) for the current month.
 * Idempotent: can be called multiple times per month safely.
 * - If no aggregate exists: creates it.
 * - If one exists but amount is stale: updates it.
 * - If calculated total is 0: deletes any existing aggregate (no pending MSI).
 */
export async function ensureCurrentMonthMsiAggregate(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const month = currentMonthMX();

  // Fetch active purchases
  const { data: purchases, error: purchasesError } = await supabase
    .from('msi_purchases')
    .select('id, total_amount, installments, first_payment_month, status')
    .eq('status', 'active');

  if (purchasesError) throw purchasesError;

  const result = calculateAggregateForMonth(
    (purchases ?? []) as MsiPurchase[],
    month
  );

  // Get MSI category
  const { data: msiCat } = await supabase
    .from('categories')
    .select('id')
    .eq('is_msi', true)
    .maybeSingle();

  if (!msiCat) return; // Should exist via trigger

  // Check existing aggregate
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, amount')
    .eq('source', 'msi_aggregate')
    .eq('msi_aggregate_month', month)
    .maybeSingle();

  if (result.total === 0) {
    if (existing) {
      await supabase.from('transactions').delete().eq('id', existing.id);
    }
    return;
  }

  if (existing) {
    if (Number(existing.amount) !== result.total) {
      await supabase
        .from('transactions')
        .update({ amount: result.total })
        .eq('id', existing.id);
    }
  } else {
    await supabase.from('transactions').insert({
      user_id: user.id,
      date: month,
      amount: result.total,
      kind: 'expense',
      category_id: msiCat.id,
      account_id: null,
      description: `Pagos MSI de ${formatMonthLabel(month)}`,
      source: 'msi_aggregate',
      msi_aggregate_month: month,
    });
  }
}

function formatMonthLabel(firstOfMonth: string): string {
  const d = new Date(`${firstOfMonth}T12:00:00Z`);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
}
