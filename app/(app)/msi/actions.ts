'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { msiPurchaseSchema } from '@/lib/validation/schemas';
import { syncMsiInstallments } from '@/lib/db/msi-installments-action';
import { monthlyAmount, monthsRemaining } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Adjust current_balance on a credit account by +delta (positive = more debt). */
async function adjustCreditBalance(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<void> {
  const { data: acc } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('id', accountId)
    .maybeSingle();
  if (!acc) return;
  await supabase
    .from('accounts')
    .update({ current_balance: acc.current_balance + delta })
    .eq('id', accountId);
}

function revalidateAll() {
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/accounts');
}

export async function createMsiPurchase(formData: FormData) {
  const parsed = msiPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('msi_purchases').insert({
    ...parsed.data,
    user_id: user.id,
    status: 'active',
  });
  if (error) return { error: error.message };

  // Increase credit card balance by full purchase amount
  await adjustCreditBalance(supabase, parsed.data.account_id, parsed.data.total_amount);

  await syncMsiInstallments();
  revalidateAll();
  return { success: true };
}

export async function updateMsiPurchase(id: string, formData: FormData) {
  const parsed = msiPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();

  // Fetch the old purchase to compare amounts and account
  const { data: old } = await supabase
    .from('msi_purchases')
    .select('total_amount, account_id')
    .eq('id', id)
    .maybeSingle();

  if (!old) return { error: 'Compra no encontrada' };

  const { error } = await supabase.from('msi_purchases').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  // Adjust balances if total_amount or account_id changed
  if (old.account_id !== parsed.data.account_id) {
    // Reverse from old account, apply to new account
    await adjustCreditBalance(supabase, old.account_id, -Number(old.total_amount));
    await adjustCreditBalance(supabase, parsed.data.account_id, parsed.data.total_amount);
  } else if (Number(old.total_amount) !== parsed.data.total_amount) {
    // Same account, just adjust the difference
    const diff = parsed.data.total_amount - Number(old.total_amount);
    await adjustCreditBalance(supabase, parsed.data.account_id, diff);
  }

  await syncMsiInstallments();
  revalidateAll();
  return { success: true };
}

export async function cancelMsiPurchase(id: string) {
  const supabase = createClient();

  const { data: purchase } = await supabase
    .from('msi_purchases')
    .select('total_amount, installments, first_payment_month, account_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!purchase) return { error: 'Compra no encontrada' };

  const { error } = await supabase.from('msi_purchases').update({ status: 'cancelled' }).eq('id', id);
  if (error) return { error: error.message };

  // Reduce balance by remaining unpaid amount
  const nowMonth = currentMonthMX();
  const remaining = monthsRemaining(
    {
      id,
      total_amount: Number(purchase.total_amount),
      installments: purchase.installments,
      first_payment_month: purchase.first_payment_month,
      status: 'active', // use active to compute remaining correctly
    },
    nowMonth
  );
  const amountToReverse = monthlyAmount({
    total_amount: Number(purchase.total_amount),
    installments: purchase.installments,
  }) * remaining;

  await adjustCreditBalance(supabase, purchase.account_id, -amountToReverse);

  await syncMsiInstallments();
  revalidateAll();
  return { success: true };
}
