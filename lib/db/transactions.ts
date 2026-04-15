import { createClient } from '@/lib/supabase/server';
import type { Transaction } from './types';

export type TransactionFilters = {
  from?: string; // YYYY-MM-DD
  to?: string;
  categoryId?: string;
  accountId?: string;
  kind?: 'expense' | 'income';
  search?: string;
  limit?: number;
};

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const supabase = createClient();
  let q = supabase.from('transactions').select('*').order('date', { ascending: false });

  if (filters.from) q = q.gte('date', filters.from);
  if (filters.to) q = q.lte('date', filters.to);
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
  if (filters.accountId) q = q.eq('account_id', filters.accountId);
  if (filters.kind) q = q.eq('kind', filters.kind);
  if (filters.search) q = q.ilike('description', `%${filters.search}%`);
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getMonthSummary(monthStart: string): Promise<{
  expenses: number;
  income: number;
  byCategory: Record<string, number>;
}> {
  const supabase = createClient();
  const nextMonth = addOneMonth(monthStart);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, kind, category_id')
    .gte('date', monthStart)
    .lt('date', nextMonth);

  if (error) throw error;

  let expenses = 0;
  let income = 0;
  const byCategory: Record<string, number> = {};

  for (const t of data ?? []) {
    const amount = Number(t.amount);
    if (t.kind === 'expense') {
      expenses += amount;
      byCategory[t.category_id] = (byCategory[t.category_id] ?? 0) + amount;
    } else {
      income += amount;
    }
  }

  return {
    expenses: Math.round(expenses * 100) / 100,
    income: Math.round(income * 100) / 100,
    byCategory,
  };
}

function addOneMonth(firstOfMonth: string): string {
  const d = new Date(`${firstOfMonth}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}
