create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cash_account_id uuid;
  msi_category_id uuid;
begin
  -- Default settings
  insert into public.user_settings (user_id) values (new.id);

  -- Default expense categories
  insert into public.categories (user_id, name, kind, color, icon, is_default, is_msi) values
    (new.id, 'Comida',          'expense', '#ef4444', 'utensils',        true, false),
    (new.id, 'Transporte',      'expense', '#f97316', 'car',             true, false),
    (new.id, 'Entretenimiento', 'expense', '#a855f7', 'gamepad-2',       true, false),
    (new.id, 'Salud',           'expense', '#10b981', 'heart',           true, false),
    (new.id, 'Hogar',           'expense', '#3b82f6', 'home',            true, false),
    (new.id, 'Ropa',            'expense', '#ec4899', 'shirt',           true, false),
    (new.id, 'Suscripciones',   'expense', '#8b5cf6', 'repeat',          true, false),
    (new.id, 'Otros',           'expense', '#64748b', 'more-horizontal', true, false);

  -- MSI category (flagged with is_msi = true for lookup by aggregate logic)
  insert into public.categories (user_id, name, kind, color, icon, is_default, is_msi)
  values (new.id, 'MSI', 'expense', '#0f172a', 'credit-card', true, true)
  returning id into msi_category_id;

  -- Default income categories
  insert into public.categories (user_id, name, kind, color, icon, is_default, is_msi) values
    (new.id, 'Salario',   'income', '#22c55e', 'briefcase',       true, false),
    (new.id, 'Freelance', 'income', '#14b8a6', 'laptop',          true, false),
    (new.id, 'Otros',     'income', '#64748b', 'more-horizontal', true, false);

  -- Default account: Cash
  insert into public.accounts (user_id, name, type, current_balance)
  values (new.id, 'Efectivo', 'cash', 0)
  returning id into cash_account_id;

  -- Default monthly goal for current month (using MX tz approximation)
  insert into public.monthly_goals (user_id, month, target_amount)
  values (new.id, date_trunc('month', timezone('America/Mexico_City', now()))::date, 20000);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
