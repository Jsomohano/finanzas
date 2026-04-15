-- Enable RLS on all user tables
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.msi_purchases enable row level security;
alter table public.monthly_goals enable row level security;
alter table public.user_settings enable row level security;

-- Macro: generate policies for each table
do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'msi_purchases', 'monthly_goals']
  loop
    execute format('create policy "%s_select_own" on public.%I for select using (user_id = auth.uid());', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert with check (user_id = auth.uid());', t, t);
    execute format('create policy "%s_update_own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete using (user_id = auth.uid());', t, t);
  end loop;
end $$;

-- user_settings uses user_id as PK, same pattern
create policy "settings_select_own" on public.user_settings for select using (user_id = auth.uid());
create policy "settings_insert_own" on public.user_settings for insert with check (user_id = auth.uid());
create policy "settings_update_own" on public.user_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings_delete_own" on public.user_settings for delete using (user_id = auth.uid());
