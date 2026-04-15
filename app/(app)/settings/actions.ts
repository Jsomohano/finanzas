'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  default_monthly_goal: z.coerce.number().nonnegative(),
  theme: z.enum(['light', 'dark', 'system']),
});

export async function updateSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_settings')
    .update(parsed.data)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function updateCurrentMonthGoal(formData: FormData) {
  const amount = Number(formData.get('target_amount'));
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const month = new Date().toISOString().slice(0, 7) + '-01';
  const { error } = await supabase
    .from('monthly_goals')
    .upsert({ user_id: user.id, month, target_amount: amount }, { onConflict: 'user_id,month' });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/settings');
  return { success: true };
}
