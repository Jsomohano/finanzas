'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { msiPurchaseSchema } from '@/lib/validation/schemas';
import { ensureCurrentMonthMsiAggregate } from '@/lib/db/msi-aggregate-action';

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

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return { success: true };
}

export async function updateMsiPurchase(id: string, formData: FormData) {
  const parsed = msiPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('msi_purchases').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return { success: true };
}

export async function cancelMsiPurchase(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('msi_purchases').update({ status: 'cancelled' }).eq('id', id);
  if (error) return { error: error.message };

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  return { success: true };
}
