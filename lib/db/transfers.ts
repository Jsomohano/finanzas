import { createClient } from '@/lib/supabase/server';
import type { Transfer } from './types';

export type TransferWithAccounts = Transfer & {
  from_account: { name: string; last_four: string | null; type: string } | null;
  to_account: { name: string; last_four: string | null; type: string } | null;
};

export async function listTransfers(limit = 50): Promise<TransferWithAccounts[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      *,
      from_account:accounts!transfers_from_account_id_fkey(name, last_four, type),
      to_account:accounts!transfers_to_account_id_fkey(name, last_four, type)
    `)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TransferWithAccounts[];
}
