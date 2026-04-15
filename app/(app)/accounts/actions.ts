'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { accountSchema } from '@/lib/validation/schemas';

export async function createAccount(formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('accounts').insert({
    ...parsed.data,
    user_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}

export async function updateAccount(id: string, formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('accounts').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}

export async function deleteAccount(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('accounts').update({ is_active: false }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}
