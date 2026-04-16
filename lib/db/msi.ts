import { createClient } from '@/lib/supabase/server';
import type { MsiPurchaseRow, MsiPurchaseWithAccount, MsiStatus } from './types';

export async function listMsiPurchases(status?: MsiStatus): Promise<MsiPurchaseWithAccount[]> {
  const supabase = createClient();
  let q = supabase
    .from('msi_purchases')
    .select('*, accounts(name, last_four, closing_day)')
    .order('purchase_date', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MsiPurchaseWithAccount[];
}

export async function getMsiPurchase(id: string): Promise<MsiPurchaseWithAccount | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('msi_purchases')
    .select('*, accounts(name, last_four, closing_day)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as MsiPurchaseWithAccount | null;
}
