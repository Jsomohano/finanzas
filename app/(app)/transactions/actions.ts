'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { transactionSchema } from '@/lib/validation/schemas';

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

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: existing } = await supabase
    .from('transactions')
    .select('source')
    .eq('id', id)
    .maybeSingle();
  if (existing?.source === 'msi_aggregate') {
    return { error: 'Los pagos MSI se editan desde la compra MSI original' };
  }

  const { error } = await supabase.from('transactions').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('transactions')
    .select('source')
    .eq('id', id)
    .maybeSingle();
  if (existing?.source === 'msi_aggregate') {
    return { error: 'No se puede borrar un agregado MSI directamente' };
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}
