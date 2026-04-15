import { createClient } from '@/lib/supabase/server';
import type { MsiPurchaseRow, MsiStatus } from './types';

export async function listMsiPurchases(status?: MsiStatus): Promise<MsiPurchaseRow[]> {
  const supabase = createClient();
  let q = supabase.from('msi_purchases').select('*').order('purchase_date', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MsiPurchaseRow[];
}

export async function getMsiPurchase(id: string): Promise<MsiPurchaseRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('msi_purchases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as MsiPurchaseRow | null;
}
