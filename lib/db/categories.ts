import { createClient } from '@/lib/supabase/server';
import type { Category, TxKind } from './types';

export async function listCategories(kind?: TxKind): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase.from('categories').select('*').order('name');
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getMsiCategory(): Promise<Category | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_msi', true)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}
