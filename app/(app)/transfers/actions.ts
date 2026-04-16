'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { transferSchema } from '@/lib/validation/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountType } from '@/lib/db/types';

/**
 * Balance delta when money moves IN or OUT of an account.
 *
 * Debit/Cash:
 *   - Outgoing (from): balance decreases
 *   - Incoming (to):   balance increases
 *
 * Credit:
 *   - Outgoing (from): increases debt (e.g. sending a wire from credit — unusual)
 *   - Incoming (to):   reduces debt (payment to the card)
 */
function transferDelta(direction: 'from' | 'to', accountType: AccountType, amount: number): number {
  if (accountType === 'credit') {
    return direction === 'to' ? -amount : amount;
  }
  return direction === 'from' ? -amount : amount;
}

async function adjustAccountBalance(
  supabase: SupabaseClient,
  accountId: string,
  direction: 'from' | 'to',
  amount: number,
  reverse = false
): Promise<void> {
  const { data: acc } = await supabase
    .from('accounts')
    .select('current_balance, type')
    .eq('id', accountId)
    .maybeSingle();
  if (!acc) return;

  const delta = transferDelta(direction, acc.type as AccountType, amount);
  await supabase
    .from('accounts')
    .update({ current_balance: acc.current_balance + (reverse ? -delta : delta) })
    .eq('id', accountId);
}

function revalidateAll() {
  revalidatePath('/transfers');
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
}

export async function createTransfer(formData: FormData) {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.from_account_id === parsed.data.to_account_id) {
    return { error: 'Las cuentas de origen y destino deben ser diferentes' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data, error } = await supabase.from('transfers').insert({
    ...parsed.data,
    user_id: user.id,
  }).select('id').single();
  if (error) return { error: error.message };

  await Promise.all([
    adjustAccountBalance(supabase, parsed.data.from_account_id, 'from', parsed.data.amount),
    adjustAccountBalance(supabase, parsed.data.to_account_id, 'to', parsed.data.amount),
  ]);

  revalidateAll();
  return { success: true, id: data.id };
}

export async function deleteTransfer(id: string) {
  const supabase = createClient();

  const { data: transfer } = await supabase
    .from('transfers')
    .select('amount, from_account_id, to_account_id')
    .eq('id', id)
    .maybeSingle();

  if (!transfer) return { error: 'Transferencia no encontrada' };

  const { error } = await supabase.from('transfers').delete().eq('id', id);
  if (error) return { error: error.message };

  // Reverse balance effects
  await Promise.all([
    adjustAccountBalance(supabase, transfer.from_account_id, 'from', Number(transfer.amount), true),
    adjustAccountBalance(supabase, transfer.to_account_id, 'to', Number(transfer.amount), true),
  ]);

  revalidateAll();
  return { success: true };
}
