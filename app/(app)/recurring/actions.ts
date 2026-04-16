'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { recurringItemSchema, transactionSchema } from '@/lib/validation/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountType, TxKind } from '@/lib/db/types';

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
  await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', accountId);
}

const revalidate = () => {
  revalidatePath('/recurring');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/accounts');
};

export async function createRecurringItem(formData: FormData) {
  const parsed = recurringItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('recurring_items').insert({
    ...parsed.data,
    user_id: user.id,
  });
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function updateRecurringItem(id: string, formData: FormData) {
  const parsed = recurringItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('recurring_items').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function updateRecurringItemStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
  const supabase = createClient();
  const { error } = await supabase.from('recurring_items').update({ status }).eq('id', id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function deleteRecurringItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('recurring_items').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidate();
  return { success: true };
}

export async function registerPayment(recurringItemId: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('transactions').insert({
    ...parsed.data,
    user_id: user.id,
    source: 'recurring',
    recurring_item_id: recurringItemId,
  });
  if (error) return { error: error.message };

  await adjustBalance(supabase, parsed.data.account_id, parsed.data.kind, parsed.data.amount, 'apply');

  revalidate();
  return { success: true };
}
