-- Allow 'msi_installment' as a valid source value for transactions.
-- If source is a plain text column this is a no-op.
-- If it has a CHECK constraint we need to drop and recreate it.
do $$
begin
  -- Drop the check constraint if it exists (name may vary)
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'transactions'
      and constraint_type = 'CHECK'
      and constraint_name ilike '%source%'
  ) then
    execute (
      select 'alter table public.transactions drop constraint ' || quote_ident(constraint_name)
      from information_schema.table_constraints
      where table_name = 'transactions'
        and constraint_type = 'CHECK'
        and constraint_name ilike '%source%'
      limit 1
    );
  end if;
end $$;

-- Recreate with the three allowed values
alter table public.transactions
  add constraint transactions_source_check
  check (source in ('manual', 'msi_aggregate', 'msi_installment'));
