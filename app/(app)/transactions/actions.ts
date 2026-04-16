'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { transactionSchema } from '@/lib/validation/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountType, TxKind } from '@/lib/db/types';

/** Delta to apply to account current_balance for one transaction.
 *  Debit/Cash: expense reduces available funds, income adds to them.
 *  Credit:     expense increases debt, income (payment) reduces debt.
 */
function balanceDelta(kind: TxKind, accountType: AccountType, amount: number): number {
  if (accountType === 'credit') {
    return kind === 'expense' ? amount : -amount;
  }
  return kind === 'expense' ? -amount : amount;
}

async function adjustBalance(
  supabase: SupabaseClient,
  accountId: string | null,
  kind: TxKind,
  amount: number,
  direction: 'apply' | 'reverse'
): Promise<void> {
  if (!accountId) return;

  const { data: acc } = await supabase
    .from('accounts')
    .select('current_balance, type')
    .eq('id', accountId)
    .maybeSingle();

  if (!acc) return;

  const delta = balanceDelta(kind, acc.type as AccountType, amount);
  const newBalance = acc.current_balance + (direction === 'apply' ? delta : -delta);

  await supabase
    .from('accounts')
    .update({ current_balance: newBalance })
    .eq('id', accountId);
}

export async function createTransaction(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('transactions').insert({
    ...parsed.data,
    user_id: user.id,
    source: 'manual',
  });
  if (error) return { error: error.message };

  await adjustBalance(supabase, parsed.data.account_id, parsed.data.kind, parsed.data.amount, 'apply');

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: old } = await supabase
    .from('transactions')
    .select('source, account_id, kind, amount')
    .eq('id', id)
    .maybeSingle();

  if (old?.source === 'msi_aggregate' || old?.source === 'msi_installment') {
    return { error: 'Los pagos MSI se editan desde la compra MSI original' };
  }

  // Reverse old balance effect, then apply new one
  if (old) {
    await adjustBalance(supabase, old.account_id, old.kind as TxKind, Number(old.amount), 'reverse');
  }

  const { error } = await supabase.from('transactions').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  await adjustBalance(supabase, parsed.data.account_id, parsed.data.kind, parsed.data.amount, 'apply');

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('transactions')
    .select('source, account_id, kind, amount')
    .eq('id', id)
    .maybeSingle();

  if (existing?.source === 'msi_aggregate' || existing?.source === 'msi_installment') {
    return { error: 'No se puede borrar un pago MSI directamente' };
  }

  if (existing) {
    await adjustBalance(supabase, existing.account_id, existing.kind as TxKind, Number(existing.amount), 'reverse');
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
  return { success: true };
}
