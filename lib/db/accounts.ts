import { createClient } from '@/lib/supabase/server';
import type { Account } from './types';

export async function listAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function getAccount(id: string): Promise<Account | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Account | null;
}
