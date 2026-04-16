-- Add msi_purchase_id to transactions for per-purchase installment tracking
alter table public.transactions
  add column if not exists msi_purchase_id uuid references public.msi_purchases(id) on delete set null;

-- Create transfers table for account-to-account movements
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date date not null,
  amount numeric not null check (amount > 0),
  from_account_id uuid not null references public.accounts(id),
  to_account_id uuid not null references public.accounts(id),
  description text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_accounts check (from_account_id <> to_account_id)
);

-- Enable RLS on transfers
alter table public.transfers enable row level security;

-- RLS policies for transfers
create policy "transfers_select_own" on public.transfers for select using (user_id = auth.uid());
create policy "transfers_insert_own" on public.transfers for insert with check (user_id = auth.uid());
create policy "transfers_update_own" on public.transfers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transfers_delete_own" on public.transfers for delete using (user_id = auth.uid());

-- Clean up old msi_aggregate transactions (will be replaced by msi_installment)
delete from public.transactions where source = 'msi_aggregate';
