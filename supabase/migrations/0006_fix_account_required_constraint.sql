-- Drop the old constraint that only allowed 'manual' and 'msi_aggregate' sources
alter table public.transactions
  drop constraint if exists account_required_for_manual;

-- Also drop the one we created in 0005 if it exists
alter table public.transactions
  drop constraint if exists transactions_source_check;

-- Recreate: manual transactions require account_id; msi sources are always valid
alter table public.transactions
  add constraint account_required_for_manual
  check (
    (source = 'manual' and account_id is not null) or
    source in ('msi_aggregate', 'msi_installment')
  );
