import { createClient } from '@/lib/supabase/server';
import { currentMonthMX } from '@/lib/dates/month-mx';
import type { MonthlyGoal } from './types';

export async function getCurrentMonthGoal(): Promise<MonthlyGoal | null> {
  const supabase = createClient();
  const month = currentMonthMX();
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  return data as MonthlyGoal | null;
}

export async function ensureCurrentMonthGoal(): Promise<MonthlyGoal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const month = currentMonthMX();
  const existing = await getCurrentMonthGoal();
  if (existing) return existing;

  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_monthly_goal')
    .maybeSingle();

  const target = settings?.default_monthly_goal ?? 20000;
  const { data, error } = await supabase
    .from('monthly_goals')
    .insert({ user_id: user.id, month, target_amount: target })
    .select()
    .single();

  if (error) throw error;
  return data as MonthlyGoal;
}
