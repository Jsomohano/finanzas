-- New table for recurring expense templates
create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('subscription', 'fixed')),
  amount numeric(12,2) not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'quincenal', 'monthly', 'bimonthly')),
  due_day int check (due_day >= 1 and due_day <= 31),
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.recurring_items enable row level security;

create policy "Users see own recurring items"
  on public.recurring_items for select using (user_id = auth.uid());
create policy "Users insert own recurring items"
  on public.recurring_items for insert with check (user_id = auth.uid());
create policy "Users update own recurring items"
  on public.recurring_items for update using (user_id = auth.uid());
create policy "Users delete own recurring items"
  on public.recurring_items for delete using (user_id = auth.uid());

-- Add 'recurring' as valid source for transactions
alter table public.transactions
  drop constraint if exists account_required_for_manual;

alter table public.transactions
  add constraint account_required_for_manual
  check (
    (source in ('manual', 'recurring') and account_id is not null) or
    source in ('msi_aggregate', 'msi_installment')
  );

-- Add recurring_item_id FK on transactions for linking payments back
alter table public.transactions
  add column recurring_item_id uuid references public.recurring_items(id) on delete set null;
