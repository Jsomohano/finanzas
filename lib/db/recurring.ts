import { createClient } from '@/lib/supabase/server';
import type { RecurringItemWithRelations } from './types';

export async function listRecurringItems(): Promise<RecurringItemWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*, accounts(name, last_four), categories(name, color, icon)')
    .order('name');
  if (error) throw error;
  return (data ?? []) as RecurringItemWithRelations[];
}

export async function getRecurringItem(id: string): Promise<RecurringItemWithRelations | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*, accounts(name, last_four), categories(name, color, icon)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as RecurringItemWithRelations | null;
}

/** Get the most recent payment transaction for each recurring item */
export async function getLastPayments(itemIds: string[]): Promise<Record<string, { date: string; amount: number }>> {
  if (itemIds.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('recurring_item_id, date, amount')
    .in('recurring_item_id', itemIds)
    .eq('source', 'recurring')
    .order('date', { ascending: false });
  if (error) throw error;

  const result: Record<string, { date: string; amount: number }> = {};
  for (const tx of data ?? []) {
    if (tx.recurring_item_id && !result[tx.recurring_item_id]) {
      result[tx.recurring_item_id] = { date: tx.date, amount: tx.amount };
    }
  }
  return result;
}
