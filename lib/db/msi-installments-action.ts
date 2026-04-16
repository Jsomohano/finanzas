'use server';

import { createClient } from '@/lib/supabase/server';
import { currentMonthMX } from '@/lib/dates/month-mx';
import { amountDueInMonth, monthlyAmount } from '@/lib/msi/calculations';
import type { MsiPurchase } from '@/lib/msi/calculations';

/**
 * Creates or updates individual MSI installment transactions for the current month.
 * One transaction per active MSI purchase (not a single aggregate).
 * These transactions have source='msi_installment' and do NOT affect account balance.
 *
 * Transaction date = closing_day of the account in the current month.
 * If account has no closing_day, defaults to last day of month.
 */
export async function syncMsiInstallments(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const month = currentMonthMX(); // YYYY-MM-01

  // Fetch all active purchases with their account's closing_day
  const { data: purchases, error: purchasesError } = await supabase
    .from('msi_purchases')
    .select('id, total_amount, installments, first_payment_month, status, account_id, description, category_id, accounts(closing_day)')
    .eq('status', 'active');

  if (purchasesError) throw purchasesError;

  // Get existing msi_installment transactions for this month
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, msi_purchase_id, amount')
    .eq('source', 'msi_installment')
    .gte('date', month)
    .lt('date', nextMonthStart(month));

  const existingByPurchaseId = new Map(
    (existing ?? []).map((t) => [t.msi_purchase_id, t])
  );
  const seenPurchaseIds = new Set<string>();

  for (const p of purchases ?? []) {
    const purchase: MsiPurchase = {
      id: p.id,
      total_amount: Number(p.total_amount),
      installments: p.installments,
      first_payment_month: p.first_payment_month,
      status: p.status,
    };

    const amountDue = amountDueInMonth(purchase, month);
    if (amountDue === 0) continue;

    seenPurchaseIds.add(p.id);

    const accountData = Array.isArray(p.accounts) ? p.accounts[0] : p.accounts as { closing_day: number | null } | null;
    const closingDay = accountData?.closing_day ?? lastDayOfMonth(month);
    const txDate = dateForDay(month, closingDay);

    // Payment index for description
    const paymentIndex = computePaymentIndex(p.first_payment_month, month);
    const description = `MSI ${paymentIndex}/${p.installments} · ${p.description}`;

    const existingTx = existingByPurchaseId.get(p.id);
    if (existingTx) {
      // Update if amount or description changed
      if (Number(existingTx.amount) !== amountDue) {
        await supabase.from('transactions').update({ amount: amountDue, description, date: txDate }).eq('id', existingTx.id);
      }
    } else {
      // Create new installment transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        date: txDate,
        amount: amountDue,
        kind: 'expense',
        category_id: p.category_id,
        account_id: p.account_id,
        description,
        source: 'msi_installment',
        msi_aggregate_month: month,
        msi_purchase_id: p.id,
      });
    }
  }

  // Delete installment transactions for purchases no longer active this month
  for (const [purchaseId, tx] of Array.from(existingByPurchaseId.entries())) {
    if (!seenPurchaseIds.has(purchaseId)) {
      await supabase.from('transactions').delete().eq('id', tx.id);
    }
  }
}

function nextMonthStart(month: string): string {
  const d = new Date(`${month}T12:00:00Z`);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function lastDayOfMonth(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m, 0).getDate();
}

function dateForDay(month: string, day: number): string {
  const [year, m] = month.split('-').map(Number);
  const maxDay = new Date(year, m, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${year}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

function computePaymentIndex(firstPaymentMonth: string, currentMonth: string): number {
  const [fy, fm] = firstPaymentMonth.split('-').map(Number);
  const [cy, cm] = currentMonth.split('-').map(Number);
  return (cy - fy) * 12 + (cm - fm) + 1;
}
