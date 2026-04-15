# Finanzas Dashboard — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el MVP del dashboard de finanzas personales — auth multi-usuario, modelo de datos completo con RLS, módulos CRUD para cuentas/categorías/transacciones/MSI, meta mensual suave, dashboard con los widgets aprobados, y tema claro/oscuro.

**Architecture:** Next.js 14 App Router full-stack. Server Actions para mutaciones, Server Components para lecturas. Supabase Postgres como única fuente de verdad con Row Level Security activa en cada tabla. Lógica pura de MSI en `lib/msi/` aislada y testeada con Vitest. Agregado mensual de MSI generado de forma idempotente ("lazy") al primer acceso del mes.

**Tech Stack:** Next.js 14 · TypeScript estricto · Tailwind CSS · shadcn/ui · Recharts · Supabase (Postgres + Auth + RLS) · React Hook Form + Zod · date-fns-tz · Vitest (unit) · Playwright (e2e crítico)

**Spec de referencia:** `docs/superpowers/specs/2026-04-14-finanzas-dashboard-design.md`

**Alcance:** Solo primera ola del MVP. Suscripciones, inversiones y reportes avanzados se planean en documentos posteriores.

---

## Estructura de archivos

```
finanzas/
├── app/
│   ├── (auth)/login/page.tsx            # Login con magic link
│   ├── (auth)/callback/route.ts         # Callback de Supabase auth
│   ├── (app)/layout.tsx                 # Layout con sidebar
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/transactions/page.tsx
│   ├── (app)/msi/page.tsx
│   ├── (app)/msi/[id]/page.tsx
│   ├── (app)/accounts/page.tsx
│   ├── (app)/settings/page.tsx
│   ├── layout.tsx                       # Root layout (theme, fonts)
│   ├── page.tsx                         # Redirect a /dashboard o /login
│   └── globals.css
├── components/
│   ├── ui/                              # shadcn base (button, card, input, etc.)
│   ├── shared/sidebar.tsx
│   ├── shared/theme-toggle.tsx
│   ├── shared/nav-user.tsx
│   ├── dashboard/kpi-card.tsx
│   ├── dashboard/category-donut.tsx
│   ├── dashboard/trend-sparkline.tsx
│   ├── dashboard/msi-projection.tsx
│   ├── transactions/transaction-form.tsx
│   ├── transactions/transaction-table.tsx
│   ├── msi/msi-form.tsx
│   ├── msi/msi-list.tsx
│   ├── msi/msi-calendar.tsx
│   └── accounts/account-form.tsx
├── lib/
│   ├── supabase/server.ts               # Server client
│   ├── supabase/browser.ts              # Browser client
│   ├── supabase/middleware.ts           # Middleware client (refresh)
│   ├── db/types.ts                      # Tipos generados/manuales de DB
│   ├── db/accounts.ts                   # Queries tipadas
│   ├── db/categories.ts
│   ├── db/transactions.ts
│   ├── db/msi.ts
│   ├── db/goals.ts
│   ├── msi/calculations.ts              # ⭐ Lógica pura de MSI
│   ├── msi/aggregate.ts                 # ⭐ Agregado mensual idempotente
│   ├── dates/month-mx.ts                # Helpers timezone MX
│   └── validation/schemas.ts            # Esquemas Zod compartidos
├── lib/msi/__tests__/
│   ├── calculations.test.ts
│   └── aggregate.test.ts
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_new_user_trigger.sql
│   └── seed.sql
├── middleware.ts                         # Session refresh
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── next.config.mjs
├── package.json
└── .env.local.example
```

**Principio de diseño:** Las funciones puras en `lib/msi/` no importan nada de Next.js ni Supabase — solo reciben datos y regresan datos. Toda la lógica con lado (DB, auth, revalidation) vive en Server Actions y `lib/db/*`.

---

## Fase A — Fundación del proyecto

### Task 1: Scaffold inicial de Next.js + TypeScript + Tailwind

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.local.example`

- [ ] **Step 1: Inicializar proyecto Next.js**

Run:
```bash
cd C:/Users/Jaime/Documents/Finanzas
npx create-next-app@14 . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint
```

Responder "Yes" si pregunta si queremos sobreescribir archivos existentes. Preserva el directorio `docs/` y `.git/`.

Expected: Nuevo scaffold de Next.js 14 con Tailwind, TypeScript, App Router. Dependencias instaladas.

- [ ] **Step 2: Verificar que corre**

Run: `npm run dev`
Expected: Servidor arranca en http://localhost:3000 y muestra la página default de Next.js. Matar con Ctrl+C.

- [ ] **Step 3: Añadir `.env.local.example`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

- [ ] **Step 4: Añadir `.env.local` al .gitignore**

Verificar que `.gitignore` ya incluye `.env*.local` (Next.js lo hace por default). Si no, añadirlo.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 14 with TypeScript and Tailwind"
```

---

### Task 2: Instalar dependencias core

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar shadcn, formularios, validación, fechas, charts**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod date-fns date-fns-tz recharts lucide-react clsx class-variance-authority tailwind-merge
```

- [ ] **Step 2: Instalar dependencias de dev**

Run:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 3: Inicializar shadcn/ui**

Run: `npx shadcn@latest init`

Responder:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **Yes**

Esto crea `components.json`, actualiza `app/globals.css` con variables CSS, y actualiza `tailwind.config.ts`.

- [ ] **Step 4: Añadir componentes shadcn que vamos a necesitar**

Run:
```bash
npx shadcn@latest add button card input label select dialog table form dropdown-menu tabs badge separator
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install core deps (supabase, shadcn, recharts, zod)"
```

---

### Task 3: Configurar Vitest para tests unitarios

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts), `tsconfig.json` (types)

- [ ] **Step 1: Crear `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Crear `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Añadir script en `package.json`**

Añadir dentro de `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Añadir `vitest/globals` a `tsconfig.json`**

En `compilerOptions.types`: `["vitest/globals", "@testing-library/jest-dom"]`

- [ ] **Step 5: Sanity test**

Crear `lib/__tests__/sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test:run`
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "test: configure vitest with jsdom and testing-library"
```

---

### Task 4: Helper de fechas con timezone México

**Files:**
- Create: `lib/dates/month-mx.ts`, `lib/dates/__tests__/month-mx.test.ts`

- [ ] **Step 1: Escribir el test fallando**

Crear `lib/dates/__tests__/month-mx.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { firstDayOfMonthMX, currentMonthMX, monthKey, addMonthsMX } from '../month-mx';

describe('month-mx helpers', () => {
  it('firstDayOfMonthMX returns YYYY-MM-01 for a given UTC date', () => {
    const d = new Date('2026-04-14T10:00:00Z');
    expect(firstDayOfMonthMX(d)).toBe('2026-04-01');
  });

  it('currentMonthMX returns first day of current month in MX tz', () => {
    const result = currentMonthMX(new Date('2026-04-14T02:00:00Z'));
    // 2026-04-14T02:00 UTC is 2026-04-13 20:00 in MX (CST -06:00), still April
    expect(result).toBe('2026-04-01');
  });

  it('monthKey formats as YYYY-MM', () => {
    expect(monthKey('2026-04-01')).toBe('2026-04');
  });

  it('addMonthsMX adds N months preserving first-of-month', () => {
    expect(addMonthsMX('2026-04-01', 3)).toBe('2026-07-01');
    expect(addMonthsMX('2026-11-01', 2)).toBe('2027-01-01');
  });
});
```

- [ ] **Step 2: Correr el test — debe fallar**

Run: `npm run test:run -- month-mx`
Expected: FAIL porque el módulo no existe.

- [ ] **Step 3: Implementar**

Crear `lib/dates/month-mx.ts`:

```typescript
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addMonths, startOfMonth } from 'date-fns';

export const MX_TZ = 'America/Mexico_City';

/** Returns the first day of the month (YYYY-MM-01) for a given date, interpreted in MX tz. */
export function firstDayOfMonthMX(d: Date): string {
  return formatInTimeZone(d, MX_TZ, 'yyyy-MM-01');
}

/** Returns the first day of the current month in MX tz as YYYY-MM-01. */
export function currentMonthMX(now: Date = new Date()): string {
  return firstDayOfMonthMX(now);
}

/** Converts a YYYY-MM-DD date string to a YYYY-MM month key. */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Adds N months to a YYYY-MM-01 string, returning a new YYYY-MM-01 string. */
export function addMonthsMX(firstOfMonth: string, n: number): string {
  const base = new Date(`${firstOfMonth}T12:00:00Z`);
  const result = addMonths(base, n);
  return formatInTimeZone(result, MX_TZ, 'yyyy-MM-01');
}
```

- [ ] **Step 4: Correr los tests — deben pasar**

Run: `npm run test:run -- month-mx`
Expected: 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(dates): add month-mx helpers with timezone-aware calculations"
```

---

## Fase B — Base de datos y auth

### Task 5: Crear proyecto Supabase y configurar variables

**Files:**
- Modify: `.env.local` (no commiteado)

- [ ] **Step 1: Crear proyecto Supabase**

Ir a https://supabase.com, crear un nuevo proyecto llamado "finanzas", región "us-east-1" (o la más cercana a México). Guardar la contraseña de la base de datos en un lugar seguro.

- [ ] **Step 2: Copiar credenciales a `.env.local`**

Desde Supabase Dashboard → Settings → API:
- Copiar `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copiar `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copiar `service_role secret key` → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 3: Verificar conexión**

Crear temporalmente `scripts/test-connection.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.auth.getSession();
console.log('Connected:', !error);
console.log('Session:', data.session);
```

Run: `npm install -D dotenv && node --env-file=.env.local scripts/test-connection.mjs`
Expected: `Connected: true`, `Session: null`.

Borrar el archivo después: `rm scripts/test-connection.mjs`.

- [ ] **Step 4: Commit (solo el ejemplo, .env.local NO se commitea)**

```bash
git status  # Confirmar que .env.local NO aparece
git add .
git commit -m "chore: wire supabase credentials (env.local.example)"
```

---

### Task 6: Migración inicial del schema

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Escribir el SQL del schema**

Crear `supabase/migrations/0001_initial_schema.sql`:

```sql
-- ACCOUNTS
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('debit', 'credit', 'cash')),
  bank text,
  last_four text check (last_four ~ '^[0-9]{4}$'),
  closing_day smallint check (closing_day between 1 and 31),
  payment_day smallint check (payment_day between 1 and 31),
  current_balance numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.accounts(user_id);

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  color text not null default '#64748b',
  icon text not null default 'circle',
  is_default boolean not null default false,
  is_msi boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, name, kind)
);
create index on public.categories(user_id);

-- TRANSACTIONS
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null check (amount > 0),
  kind text not null check (kind in ('expense', 'income')),
  category_id uuid not null references public.categories(id) on delete restrict,
  account_id uuid references public.accounts(id) on delete restrict,
  description text not null,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'msi_aggregate')),
  msi_aggregate_month date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- account_id required for manual, nullable for msi_aggregate
  constraint account_required_for_manual check (
    (source = 'manual' and account_id is not null) or
    (source = 'msi_aggregate')
  ),
  -- aggregate uniqueness: one per user per month
  constraint one_aggregate_per_month unique (user_id, msi_aggregate_month, source) deferrable initially deferred
);
create index on public.transactions(user_id, date desc);
create index on public.transactions(user_id, category_id);

-- MSI PURCHASES
create table public.msi_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  merchant text,
  total_amount numeric(12,2) not null check (total_amount > 0),
  installments smallint not null check (installments between 2 and 48),
  purchase_date date not null,
  first_payment_month date not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint first_payment_is_first_of_month check (extract(day from first_payment_month) = 1)
);
create index on public.msi_purchases(user_id, status);

-- MONTHLY GOALS
create table public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  target_amount numeric(12,2) not null check (target_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month),
  constraint month_is_first_of_month check (extract(day from month) = 1)
);
create index on public.monthly_goals(user_id, month);

-- USER SETTINGS
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  default_monthly_goal numeric(12,2) not null default 20000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UPDATED_AT trigger (shared)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_accounts before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at_transactions before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at_msi before update on public.msi_purchases
  for each row execute function public.set_updated_at();
create trigger set_updated_at_goals before update on public.monthly_goals
  for each row execute function public.set_updated_at();
create trigger set_updated_at_settings before update on public.user_settings
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Ejecutar la migración en Supabase**

Copiar el contenido del archivo y pegarlo en Supabase Dashboard → SQL Editor → New query → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verificar en el Table Editor**

Ir a Dashboard → Table Editor. Confirmar que aparecen las 6 tablas: `accounts`, `categories`, `transactions`, `msi_purchases`, `monthly_goals`, `user_settings`.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat(db): initial schema for accounts, categories, transactions, msi, goals, settings"
```

---

### Task 7: Row Level Security policies

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`

- [ ] **Step 1: Escribir las políticas RLS**

```sql
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
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar. Expected: Success.

- [ ] **Step 3: Verificar en Dashboard**

Table Editor → cada tabla debe mostrar el badge "RLS enabled" con 4 políticas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls_policies.sql
git commit -m "feat(db): enable RLS with own-data policies on all user tables"
```

---

### Task 8: Trigger de bootstrap para usuarios nuevos

**Files:**
- Create: `supabase/migrations/0003_new_user_trigger.sql`

- [ ] **Step 1: Escribir el trigger**

```sql
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
    (new.id, 'Comida',          'expense', '#ef4444', 'utensils',   true, false),
    (new.id, 'Transporte',      'expense', '#f97316', 'car',        true, false),
    (new.id, 'Entretenimiento', 'expense', '#a855f7', 'gamepad-2',  true, false),
    (new.id, 'Salud',           'expense', '#10b981', 'heart',      true, false),
    (new.id, 'Hogar',           'expense', '#3b82f6', 'home',       true, false),
    (new.id, 'Ropa',            'expense', '#ec4899', 'shirt',      true, false),
    (new.id, 'Suscripciones',   'expense', '#8b5cf6', 'repeat',     true, false),
    (new.id, 'Otros',           'expense', '#64748b', 'more-horizontal', true, false);

  -- MSI category (flagged with is_msi = true for lookup by aggregate logic)
  insert into public.categories (user_id, name, kind, color, icon, is_default, is_msi)
  values (new.id, 'MSI', 'expense', '#0f172a', 'credit-card', true, true)
  returning id into msi_category_id;

  -- Default income categories
  insert into public.categories (user_id, name, kind, color, icon, is_default, is_msi) values
    (new.id, 'Salario',   'income', '#22c55e', 'briefcase', true, false),
    (new.id, 'Freelance', 'income', '#14b8a6', 'laptop',    true, false),
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
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar. Expected: Success.

- [ ] **Step 3: Probar creando un usuario de prueba**

Dashboard → Authentication → Users → Add user → Create new user → email "test@finanzas.local", password "test1234" (solo dev).

Luego en SQL Editor:
```sql
select count(*) from public.categories where user_id = (select id from auth.users where email = 'test@finanzas.local');
```

Expected: 12 (9 expense + 3 income).

```sql
select * from public.user_settings where user_id = (select id from auth.users where email = 'test@finanzas.local');
```

Expected: 1 row con `default_monthly_goal = 20000`.

- [ ] **Step 4: Borrar el usuario de prueba**

Authentication → Users → borrar test@finanzas.local.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_new_user_trigger.sql
git commit -m "feat(db): bootstrap new users with default categories, account, and goal"
```

---

### Task 9: Clientes de Supabase y middleware

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

- [ ] **Step 1: Crear cliente browser**

`lib/supabase/browser.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Crear cliente server**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Crear middleware helper**

`lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected app routes
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth');
  if (!user && !isAuthRoute && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 4: Crear `middleware.ts` en raíz**

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 5: Verificar que compila**

Run: `npm run build`
Expected: Build exitoso sin errores de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): supabase server/browser clients and session middleware"
```

---

### Task 10: Página de login con magic link

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/login/actions.ts`, `app/(auth)/callback/route.ts`

- [ ] **Step 1: Crear Server Action de login**

`app/(auth)/login/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

export async function signInWithOtp(formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const origin = headers().get('origin');
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Crear página de login**

`app/(auth)/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithOtp } from './actions';

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setError(null);
    const result = await signInWithOtp(formData);
    if (result.error) {
      setError(result.error);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finanzas</CardTitle>
          <CardDescription>Inicia sesión con un link mágico enviado a tu email.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'sent' ? (
            <p className="text-sm">Revisa tu bandeja de entrada — te enviamos un link para iniciar sesión.</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando…' : 'Enviar link mágico'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Crear callback route**

`app/(auth)/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
```

- [ ] **Step 4: Configurar email templates en Supabase**

Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

- [ ] **Step 5: Probar el flujo manual**

Run: `npm run dev` → abrir http://localhost:3000/login → meter email → revisar bandeja → clic en el link → debe redirigir a /dashboard (que todavía 404ea, pero eso confirma que auth funcionó).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): magic link login page with callback route"
```

---

## Fase C — Lógica pura de MSI (el corazón del producto)

### Task 11: Cálculos puros de MSI — tests y lógica

**Files:**
- Create: `lib/msi/calculations.ts`, `lib/msi/__tests__/calculations.test.ts`

- [ ] **Step 1: Escribir los tests**

`lib/msi/__tests__/calculations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  monthlyAmount,
  paymentSchedule,
  amountDueInMonth,
  projectionForMonths,
  monthsRemaining,
  isCompletedAsOf,
  type MsiPurchase,
} from '../calculations';

const laptop: MsiPurchase = {
  id: '1',
  total_amount: 24000,
  installments: 12,
  first_payment_month: '2026-05-01',
  status: 'active',
};

const tv: MsiPurchase = {
  id: '2',
  total_amount: 18000,
  installments: 18,
  first_payment_month: '2025-09-01',
  status: 'active',
};

describe('monthlyAmount', () => {
  it('divides total by installments', () => {
    expect(monthlyAmount(laptop)).toBe(2000);
  });

  it('handles non-divisible totals with 2 decimal precision', () => {
    expect(monthlyAmount({ ...laptop, total_amount: 10000, installments: 3 })).toBeCloseTo(3333.33, 2);
  });
});

describe('paymentSchedule', () => {
  it('returns an array of months with amount', () => {
    const schedule = paymentSchedule(laptop);
    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toEqual({ month: '2026-05-01', amount: 2000, index: 1 });
    expect(schedule[11]).toEqual({ month: '2027-04-01', amount: 2000, index: 12 });
  });
});

describe('amountDueInMonth', () => {
  it('returns the monthly amount if the purchase is being paid that month', () => {
    expect(amountDueInMonth(laptop, '2026-05-01')).toBe(2000);
    expect(amountDueInMonth(laptop, '2027-04-01')).toBe(2000);
  });

  it('returns 0 before first payment and after last', () => {
    expect(amountDueInMonth(laptop, '2026-04-01')).toBe(0);
    expect(amountDueInMonth(laptop, '2027-05-01')).toBe(0);
  });

  it('returns 0 for cancelled purchases', () => {
    expect(amountDueInMonth({ ...laptop, status: 'cancelled' }, '2026-05-01')).toBe(0);
  });
});

describe('projectionForMonths', () => {
  it('sums amounts across multiple purchases per month', () => {
    const result = projectionForMonths([laptop, tv], '2026-05-01', 3);
    // laptop: 2000 every month
    // tv: 1000 every month until 2027-02 (18 months from 2025-09)
    expect(result).toEqual([
      { month: '2026-05-01', amount: 3000 },
      { month: '2026-06-01', amount: 3000 },
      { month: '2026-07-01', amount: 3000 },
    ]);
  });

  it('zero when nothing is due', () => {
    const result = projectionForMonths([laptop], '2028-01-01', 2);
    expect(result).toEqual([
      { month: '2028-01-01', amount: 0 },
      { month: '2028-02-01', amount: 0 },
    ]);
  });
});

describe('monthsRemaining', () => {
  it('counts months from asOf to last payment', () => {
    expect(monthsRemaining(laptop, '2026-05-01')).toBe(12);
    expect(monthsRemaining(laptop, '2027-01-01')).toBe(4);
  });

  it('returns 0 when already completed', () => {
    expect(monthsRemaining(laptop, '2027-05-01')).toBe(0);
  });
});

describe('isCompletedAsOf', () => {
  it('true when the current month is past the last payment', () => {
    expect(isCompletedAsOf(laptop, '2027-05-01')).toBe(true);
    expect(isCompletedAsOf(laptop, '2027-04-01')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr los tests — deben fallar**

Run: `npm run test:run -- calculations`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar la lógica**

`lib/msi/calculations.ts`:

```typescript
import { addMonthsMX } from '@/lib/dates/month-mx';

export type MsiPurchase = {
  id: string;
  total_amount: number;
  installments: number;
  first_payment_month: string; // YYYY-MM-01
  status: 'active' | 'completed' | 'cancelled';
};

export type ScheduleEntry = {
  month: string; // YYYY-MM-01
  amount: number;
  index: number; // 1-based payment number
};

export type MonthProjection = {
  month: string;
  amount: number;
};

/** Returns the per-month payment amount, rounded to 2 decimals. */
export function monthlyAmount(p: Pick<MsiPurchase, 'total_amount' | 'installments'>): number {
  return Math.round((p.total_amount / p.installments) * 100) / 100;
}

/** Returns all scheduled payments for a purchase. */
export function paymentSchedule(p: MsiPurchase): ScheduleEntry[] {
  const per = monthlyAmount(p);
  const out: ScheduleEntry[] = [];
  for (let i = 0; i < p.installments; i++) {
    out.push({
      month: addMonthsMX(p.first_payment_month, i),
      amount: per,
      index: i + 1,
    });
  }
  return out;
}

/** Returns the amount due for this purchase in the given month (YYYY-MM-01). */
export function amountDueInMonth(p: MsiPurchase, month: string): number {
  if (p.status !== 'active') return 0;
  if (month < p.first_payment_month) return 0;
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  if (month > lastPayment) return 0;
  return monthlyAmount(p);
}

/** Returns a projection across N months starting from `fromMonth`. */
export function projectionForMonths(
  purchases: MsiPurchase[],
  fromMonth: string,
  months: number
): MonthProjection[] {
  const out: MonthProjection[] = [];
  for (let i = 0; i < months; i++) {
    const month = addMonthsMX(fromMonth, i);
    const amount = purchases.reduce((sum, p) => sum + amountDueInMonth(p, month), 0);
    out.push({ month, amount: Math.round(amount * 100) / 100 });
  }
  return out;
}

/** Returns how many payments are still pending from the given month (inclusive). */
export function monthsRemaining(p: MsiPurchase, asOfMonth: string): number {
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  if (asOfMonth > lastPayment) return 0;
  if (asOfMonth <= p.first_payment_month) return p.installments;
  // Count from asOf to lastPayment
  let count = 0;
  let cursor = asOfMonth;
  while (cursor <= lastPayment) {
    count++;
    cursor = addMonthsMX(cursor, 1);
  }
  return count;
}

/** True if all payments for this purchase are behind the given month. */
export function isCompletedAsOf(p: MsiPurchase, asOfMonth: string): boolean {
  const lastPayment = addMonthsMX(p.first_payment_month, p.installments - 1);
  return asOfMonth > lastPayment;
}
```

- [ ] **Step 4: Correr los tests — deben pasar**

Run: `npm run test:run -- calculations`
Expected: All tests passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(msi): pure calculation library with full test coverage"
```

---

### Task 12: Agregado mensual de MSI idempotente

**Files:**
- Create: `lib/msi/aggregate.ts`, `lib/msi/__tests__/aggregate.test.ts`

- [ ] **Step 1: Escribir tests para la lógica pura del agregado**

`lib/msi/__tests__/aggregate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAggregateForMonth } from '../aggregate';
import type { MsiPurchase } from '../calculations';

const laptop: MsiPurchase = {
  id: '1',
  total_amount: 24000,
  installments: 12,
  first_payment_month: '2026-05-01',
  status: 'active',
};

const tv: MsiPurchase = {
  id: '2',
  total_amount: 18000,
  installments: 18,
  first_payment_month: '2025-09-01',
  status: 'active',
};

const cancelled: MsiPurchase = {
  id: '3',
  total_amount: 6000,
  installments: 6,
  first_payment_month: '2026-05-01',
  status: 'cancelled',
};

describe('calculateAggregateForMonth', () => {
  it('sums all active purchases paying in the given month', () => {
    const result = calculateAggregateForMonth([laptop, tv, cancelled], '2026-05-01');
    expect(result.total).toBe(3000); // 2000 + 1000 + 0 (cancelled)
    expect(result.contributors).toHaveLength(2);
  });

  it('returns zero when nothing pays that month', () => {
    const result = calculateAggregateForMonth([laptop], '2024-01-01');
    expect(result.total).toBe(0);
    expect(result.contributors).toHaveLength(0);
  });

  it('excludes purchases with status != active', () => {
    const result = calculateAggregateForMonth([cancelled], '2026-05-01');
    expect(result.total).toBe(0);
  });
});
```

- [ ] **Step 2: Correr tests — deben fallar**

Run: `npm run test:run -- aggregate`
Expected: FAIL.

- [ ] **Step 3: Implementar lógica pura**

`lib/msi/aggregate.ts`:

```typescript
import { amountDueInMonth, monthlyAmount, type MsiPurchase } from './calculations';

export type AggregateResult = {
  month: string;
  total: number;
  contributors: Array<{ purchaseId: string; amount: number }>;
};

/** Pure calculation — no DB side-effects. */
export function calculateAggregateForMonth(
  purchases: MsiPurchase[],
  month: string
): AggregateResult {
  const contributors: Array<{ purchaseId: string; amount: number }> = [];
  let total = 0;
  for (const p of purchases) {
    const amount = amountDueInMonth(p, month);
    if (amount > 0) {
      contributors.push({ purchaseId: p.id, amount: monthlyAmount(p) });
      total += amount;
    }
  }
  return { month, total: Math.round(total * 100) / 100, contributors };
}
```

- [ ] **Step 4: Correr tests — deben pasar**

Run: `npm run test:run -- aggregate`
Expected: 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(msi): pure aggregate calculator for monthly totals"
```

---

### Task 13: Server Action idempotente para materializar el agregado

**Files:**
- Create: `lib/db/msi-aggregate-action.ts`

- [ ] **Step 1: Escribir el Server Action**

`lib/db/msi-aggregate-action.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { currentMonthMX } from '@/lib/dates/month-mx';
import { calculateAggregateForMonth } from '@/lib/msi/aggregate';
import type { MsiPurchase } from '@/lib/msi/calculations';

/**
 * Ensures the MSI aggregate transaction exists (and is up to date) for the current month.
 * Idempotent: can be called multiple times per month safely.
 * - If no aggregate exists: creates it.
 * - If one exists but amount is stale: updates it.
 * - If calculated total is 0: deletes any existing aggregate (no pending MSI).
 */
export async function ensureCurrentMonthMsiAggregate(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const month = currentMonthMX();

  // Fetch active purchases
  const { data: purchases, error: purchasesError } = await supabase
    .from('msi_purchases')
    .select('id, total_amount, installments, first_payment_month, status')
    .eq('status', 'active');

  if (purchasesError) throw purchasesError;

  const result = calculateAggregateForMonth(
    (purchases ?? []) as MsiPurchase[],
    month
  );

  // Get MSI category
  const { data: msiCat } = await supabase
    .from('categories')
    .select('id')
    .eq('is_msi', true)
    .maybeSingle();

  if (!msiCat) return; // Should exist via trigger

  // Check existing aggregate
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, amount')
    .eq('source', 'msi_aggregate')
    .eq('msi_aggregate_month', month)
    .maybeSingle();

  if (result.total === 0) {
    if (existing) {
      await supabase.from('transactions').delete().eq('id', existing.id);
    }
    return;
  }

  if (existing) {
    if (Number(existing.amount) !== result.total) {
      await supabase
        .from('transactions')
        .update({ amount: result.total })
        .eq('id', existing.id);
    }
  } else {
    await supabase.from('transactions').insert({
      user_id: user.id,
      date: month,
      amount: result.total,
      kind: 'expense',
      category_id: msiCat.id,
      account_id: null,
      description: `Pagos MSI de ${formatMonthLabel(month)}`,
      source: 'msi_aggregate',
      msi_aggregate_month: month,
    });
  }
}

function formatMonthLabel(firstOfMonth: string): string {
  const d = new Date(`${firstOfMonth}T12:00:00Z`);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(msi): idempotent server action to materialize monthly aggregate"
```

---

## Fase D — Módulos CRUD

### Task 14: Tipos de DB y esquemas Zod compartidos

**Files:**
- Create: `lib/db/types.ts`, `lib/validation/schemas.ts`

- [ ] **Step 1: Tipos de DB**

`lib/db/types.ts`:

```typescript
export type AccountType = 'debit' | 'credit' | 'cash';
export type TxKind = 'expense' | 'income';
export type TxSource = 'manual' | 'msi_aggregate';
export type MsiStatus = 'active' | 'completed' | 'cancelled';

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  bank: string | null;
  last_four: string | null;
  closing_day: number | null;
  payment_day: number | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: TxKind;
  color: string;
  icon: string;
  is_default: boolean;
  is_msi: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  kind: TxKind;
  category_id: string;
  account_id: string | null;
  description: string;
  notes: string | null;
  source: TxSource;
  msi_aggregate_month: string | null;
  created_at: string;
  updated_at: string;
};

export type MsiPurchaseRow = {
  id: string;
  user_id: string;
  description: string;
  merchant: string | null;
  total_amount: number;
  installments: number;
  purchase_date: string;
  first_payment_month: string;
  account_id: string;
  category_id: string;
  status: MsiStatus;
  created_at: string;
  updated_at: string;
};

export type MonthlyGoal = {
  id: string;
  user_id: string;
  month: string;
  target_amount: number;
};

export type UserSettings = {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_monthly_goal: number;
};
```

- [ ] **Step 2: Esquemas Zod**

`lib/validation/schemas.ts`:

```typescript
import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  type: z.enum(['debit', 'credit', 'cash']),
  bank: z.string().max(50).optional().nullable(),
  last_four: z.string().regex(/^\d{4}$/, '4 dígitos').optional().nullable(),
  closing_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  payment_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  current_balance: z.coerce.number(),
});

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD'),
  amount: z.coerce.number().positive('Debe ser positivo'),
  kind: z.enum(['expense', 'income']),
  category_id: z.string().uuid(),
  account_id: z.string().uuid(),
  description: z.string().min(1).max(200),
  notes: z.string().max(500).optional().nullable(),
});

export const msiPurchaseSchema = z.object({
  description: z.string().min(1).max(200),
  merchant: z.string().max(100).optional().nullable(),
  total_amount: z.coerce.number().positive(),
  installments: z.coerce.number().int().min(2).max(48),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  first_payment_month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Debe ser primer día del mes'),
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
});

export const monthlyGoalSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  target_amount: z.coerce.number().nonnegative(),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type MsiPurchaseInput = z.infer<typeof msiPurchaseSchema>;
export type MonthlyGoalInput = z.infer<typeof monthlyGoalSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: typed DB types and Zod validation schemas"
```

---

### Task 15: Queries y Server Actions de cuentas

**Files:**
- Create: `lib/db/accounts.ts`, `app/(app)/accounts/actions.ts`

- [ ] **Step 1: Queries de lectura**

`lib/db/accounts.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Account } from './types';

export async function listAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function getAccount(id: string): Promise<Account | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Account | null;
}
```

- [ ] **Step 2: Server Actions para mutaciones**

`app/(app)/accounts/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { accountSchema } from '@/lib/validation/schemas';

export async function createAccount(formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('accounts').insert({
    ...parsed.data,
    user_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}

export async function updateAccount(id: string, formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('accounts').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}

export async function deleteAccount(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('accounts').update({ is_active: false }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true };
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(accounts): queries and server actions for CRUD"
```

---

### Task 16: UI de cuentas (página + form)

**Files:**
- Create: `app/(app)/accounts/page.tsx`, `components/accounts/account-form.tsx`, `components/accounts/account-card.tsx`

- [ ] **Step 1: Form component**

`components/accounts/account-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAccount } from '@/app/(app)/accounts/actions';
import type { Account } from '@/lib/db/types';

export function AccountForm({ initial, onDone }: { initial?: Account; onDone?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createAccount(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required defaultValue={initial?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select name="type" defaultValue={initial?.type ?? 'debit'}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="debit">Débito</SelectItem>
            <SelectItem value="credit">Crédito</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank">Banco (opcional)</Label>
        <Input id="bank" name="bank" defaultValue={initial?.bank ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="last_four">Últimos 4</Label>
          <Input id="last_four" name="last_four" maxLength={4} defaultValue={initial?.last_four ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current_balance">Saldo actual</Label>
          <Input id="current_balance" name="current_balance" type="number" step="0.01" defaultValue={initial?.current_balance ?? 0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="closing_day">Día de corte</Label>
          <Input id="closing_day" name="closing_day" type="number" min={1} max={31} defaultValue={initial?.closing_day ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_day">Día de pago</Label>
          <Input id="payment_day" name="payment_day" type="number" min={1} max={31} defaultValue={initial?.payment_day ?? ''} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Card component**

`components/accounts/account-card.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/db/types';

const TYPE_LABEL: Record<Account['type'], string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
};

export function AccountCard({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{account.name}</CardTitle>
          {account.bank && <p className="text-xs text-muted-foreground">{account.bank}</p>}
        </div>
        <Badge variant="outline">{TYPE_LABEL[account.type]}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${account.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        {account.last_four && (
          <p className="text-xs text-muted-foreground">•••• {account.last_four}</p>
        )}
        {account.type === 'credit' && account.closing_day && (
          <p className="text-xs text-muted-foreground">
            Corte día {account.closing_day} · Pago día {account.payment_day}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Página de cuentas**

`app/(app)/accounts/page.tsx`:

```typescript
import { listAccounts } from '@/lib/db/accounts';
import { AccountCard } from '@/components/accounts/account-card';
import { AccountForm } from '@/components/accounts/account-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default async function AccountsPage() {
  const accounts = await listAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas y tarjetas</h1>
          <p className="text-sm text-muted-foreground">Administra tus cuentas, tarjetas y efectivo.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva cuenta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva cuenta</DialogTitle>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(accounts): page with card grid and create dialog"
```

---

### Task 17: Queries y Server Actions de categorías

**Files:**
- Create: `lib/db/categories.ts`

- [ ] **Step 1: Queries simples**

`lib/db/categories.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Category, TxKind } from './types';

export async function listCategories(kind?: TxKind): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase.from('categories').select('*').order('name');
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getMsiCategory(): Promise<Category | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_msi', true)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(categories): list and msi-category queries"
```

---

### Task 18: Queries y Server Actions de transacciones

**Files:**
- Create: `lib/db/transactions.ts`, `app/(app)/transactions/actions.ts`

- [ ] **Step 1: Queries**

`lib/db/transactions.ts`:

```typescript
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
```

- [ ] **Step 2: Server Actions**

`app/(app)/transactions/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { transactionSchema } from '@/lib/validation/schemas';

export async function createTransaction(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('transactions').insert({
    ...parsed.data,
    user_id: user.id,
    source: 'manual',
  });
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  // Prevent editing aggregates from this action
  const { data: existing } = await supabase
    .from('transactions')
    .select('source')
    .eq('id', id)
    .maybeSingle();
  if (existing?.source === 'msi_aggregate') {
    return { error: 'Los pagos MSI se editan desde la compra MSI original' };
  }

  const { error } = await supabase.from('transactions').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('transactions')
    .select('source')
    .eq('id', id)
    .maybeSingle();
  if (existing?.source === 'msi_aggregate') {
    return { error: 'No se puede borrar un agregado MSI directamente' };
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(transactions): queries, filters, and server actions"
```

---

### Task 19: UI de transacciones (tabla + form)

**Files:**
- Create: `components/transactions/transaction-form.tsx`, `components/transactions/transaction-table.tsx`, `app/(app)/transactions/page.tsx`

- [ ] **Step 1: Form component**

`components/transactions/transaction-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransaction } from '@/app/(app)/transactions/actions';
import type { Account, Category } from '@/lib/db/types';

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  onDone,
}: {
  accounts: Account[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  onDone?: () => void;
}) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const categories = kind === 'expense' ? expenseCategories : incomeCategories;

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createTransaction(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={kind === 'expense' ? 'default' : 'outline'} onClick={() => setKind('expense')}>Gasto</Button>
        <Button type="button" variant={kind === 'income' ? 'default' : 'outline'} onClick={() => setKind('income')}>Ingreso</Button>
      </div>
      <input type="hidden" name="kind" value={kind} />

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Cuenta</Label>
        <Select name="account_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Table component**

`components/transactions/transaction-table.tsx`:

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Category, Account } from '@/lib/db/types';

export function TransactionTable({
  transactions,
  categories,
  accounts,
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Cuenta</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const cat = catMap.get(t.category_id);
          const acc = t.account_id ? accMap.get(t.account_id) : null;
          return (
            <TableRow key={t.id}>
              <TableCell className="text-xs">{t.date}</TableCell>
              <TableCell>
                {t.description}
                {t.source === 'msi_aggregate' && (
                  <Badge variant="secondary" className="ml-2">MSI</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs">{cat?.name ?? '—'}</TableCell>
              <TableCell className="text-xs">{acc?.name ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">
                <span className={t.kind === 'expense' ? 'text-destructive' : 'text-green-600'}>
                  {t.kind === 'expense' ? '−' : '+'}${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Página de transacciones**

`app/(app)/transactions/page.tsx`:

```typescript
import { listTransactions } from '@/lib/db/transactions';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ensureCurrentMonthMsiAggregate } from '@/lib/db/msi-aggregate-action';

export default async function TransactionsPage() {
  await ensureCurrentMonthMsiAggregate();
  const [transactions, accounts, expenseCats, incomeCats] = await Promise.all([
    listTransactions({ limit: 100 }),
    listAccounts(),
    listCategories('expense'),
    listCategories('income'),
  ]);
  const categories = [...expenseCats, ...incomeCats];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Todos tus ingresos y gastos.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva transacción</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva transacción</DialogTitle>
            </DialogHeader>
            <TransactionForm accounts={accounts} expenseCategories={expenseCats} incomeCategories={incomeCats} />
          </DialogContent>
        </Dialog>
      </div>

      <TransactionTable transactions={transactions} categories={categories} accounts={accounts} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(transactions): page with table and create dialog"
```

---

### Task 20: Queries y Server Actions de MSI

**Files:**
- Create: `lib/db/msi.ts`, `app/(app)/msi/actions.ts`

- [ ] **Step 1: Queries**

`lib/db/msi.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { MsiPurchaseRow, MsiStatus } from './types';

export async function listMsiPurchases(status?: MsiStatus): Promise<MsiPurchaseRow[]> {
  const supabase = createClient();
  let q = supabase.from('msi_purchases').select('*').order('purchase_date', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MsiPurchaseRow[];
}

export async function getMsiPurchase(id: string): Promise<MsiPurchaseRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('msi_purchases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as MsiPurchaseRow | null;
}
```

- [ ] **Step 2: Server Actions con recálculo del agregado**

`app/(app)/msi/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { msiPurchaseSchema } from '@/lib/validation/schemas';
import { ensureCurrentMonthMsiAggregate } from '@/lib/db/msi-aggregate-action';

export async function createMsiPurchase(formData: FormData) {
  const parsed = msiPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('msi_purchases').insert({
    ...parsed.data,
    user_id: user.id,
    status: 'active',
  });
  if (error) return { error: error.message };

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return { success: true };
}

export async function updateMsiPurchase(id: string, formData: FormData) {
  const parsed = msiPurchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('msi_purchases').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return { success: true };
}

export async function cancelMsiPurchase(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('msi_purchases').update({ status: 'cancelled' }).eq('id', id);
  if (error) return { error: error.message };

  await ensureCurrentMonthMsiAggregate();
  revalidatePath('/msi');
  revalidatePath('/dashboard');
  return { success: true };
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(msi): queries and actions with aggregate recalculation on change"
```

---

### Task 21: UI de MSI (form + lista + calendario)

**Files:**
- Create: `components/msi/msi-form.tsx`, `components/msi/msi-list.tsx`, `components/msi/msi-calendar.tsx`, `app/(app)/msi/page.tsx`, `app/(app)/msi/[id]/page.tsx`

- [ ] **Step 1: Form component**

`components/msi/msi-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createMsiPurchase } from '@/app/(app)/msi/actions';
import type { Account, Category } from '@/lib/db/types';

const INSTALLMENT_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

export function MsiForm({
  accounts,
  categories,
  onDone,
}: {
  accounts: Account[];
  categories: Category[];
  onDone?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthFirst = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  async function action(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createMsiPurchase(formData);
    setPending(false);
    if (result.error) setError(result.error);
    else onDone?.();
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" required placeholder="Laptop Dell XPS" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchant">Comercio</Label>
        <Input id="merchant" name="merchant" placeholder="Amazon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_amount">Monto total</Label>
          <Input id="total_amount" name="total_amount" type="number" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installments">Mensualidades</Label>
          <Select name="installments" defaultValue="12">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INSTALLMENT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} meses</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Fecha de compra</Label>
          <Input id="purchase_date" name="purchase_date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_payment_month">Primer pago</Label>
          <Input id="first_payment_month" name="first_payment_month" type="date" defaultValue={nextMonthFirst} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Tarjeta</Label>
        <Select name="account_id" required>
          <SelectTrigger><SelectValue placeholder="Selecciona tarjeta…" /></SelectTrigger>
          <SelectContent>
            {accounts.filter((a) => a.type === 'credit').map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" required>
          <SelectTrigger><SelectValue placeholder="Categoría del gasto…" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar compra'}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Lista component**

`components/msi/msi-list.tsx`:

```typescript
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MsiPurchaseRow } from '@/lib/db/types';
import { monthlyAmount, monthsRemaining } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';

export function MsiList({ purchases }: { purchases: MsiPurchaseRow[] }) {
  const nowMonth = currentMonthMX();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Comercio</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Mensualidad</TableHead>
          <TableHead>Progreso</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((p) => {
          const per = monthlyAmount(p);
          const remaining = monthsRemaining(
            { id: p.id, total_amount: p.total_amount, installments: p.installments, first_payment_month: p.first_payment_month, status: p.status },
            nowMonth
          );
          const paid = p.installments - remaining;
          return (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.merchant ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">${p.total_amount.toLocaleString('es-MX')}</TableCell>
              <TableCell className="text-right font-mono">${per.toLocaleString('es-MX')}</TableCell>
              <TableCell>{paid}/{p.installments}</TableCell>
              <TableCell><Link href={`/msi/${p.id}`} className="text-sm underline">Detalle</Link></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: Calendario component**

`components/msi/msi-calendar.tsx`:

```typescript
import type { MsiPurchaseRow } from '@/lib/db/types';
import { paymentSchedule } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';

export function MsiCalendar({ purchase }: { purchase: MsiPurchaseRow }) {
  const schedule = paymentSchedule({
    id: purchase.id,
    total_amount: purchase.total_amount,
    installments: purchase.installments,
    first_payment_month: purchase.first_payment_month,
    status: purchase.status,
  });
  const nowMonth = currentMonthMX();

  return (
    <div className="space-y-1">
      {schedule.map((entry) => {
        const status =
          entry.month < nowMonth ? 'pagado' :
          entry.month === nowMonth ? 'este mes' : 'pendiente';
        return (
          <div
            key={entry.month}
            className={`flex justify-between text-sm px-3 py-2 rounded ${
              status === 'pagado' ? 'bg-muted text-muted-foreground' :
              status === 'este mes' ? 'bg-primary/10 font-semibold' : ''
            }`}
          >
            <span>Pago {entry.index} · {entry.month}</span>
            <span>${entry.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs uppercase">{status}</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Página principal MSI**

`app/(app)/msi/page.tsx`:

```typescript
import { listMsiPurchases } from '@/lib/db/msi';
import { listAccounts } from '@/lib/db/accounts';
import { listCategories } from '@/lib/db/categories';
import { MsiList } from '@/components/msi/msi-list';
import { MsiForm } from '@/components/msi/msi-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default async function MsiPage() {
  const [active, completed, cancelled, accounts, categories] = await Promise.all([
    listMsiPurchases('active'),
    listMsiPurchases('completed'),
    listMsiPurchases('cancelled'),
    listAccounts(),
    listCategories('expense'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meses sin intereses</h1>
          <p className="text-sm text-muted-foreground">Tus compras a MSI y sus calendarios de pago.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>+ Nueva compra MSI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva compra a MSI</DialogTitle>
            </DialogHeader>
            <MsiForm accounts={accounts} categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Activas ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Terminadas ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas ({cancelled.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active"><MsiList purchases={active} /></TabsContent>
        <TabsContent value="completed"><MsiList purchases={completed} /></TabsContent>
        <TabsContent value="cancelled"><MsiList purchases={cancelled} /></TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 5: Página de detalle**

`app/(app)/msi/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { getMsiPurchase } from '@/lib/db/msi';
import { MsiCalendar } from '@/components/msi/msi-calendar';
import { monthlyAmount } from '@/lib/msi/calculations';

export default async function MsiDetailPage({ params }: { params: { id: string } }) {
  const purchase = await getMsiPurchase(params.id);
  if (!purchase) notFound();

  const per = monthlyAmount(purchase);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{purchase.description}</h1>
        <p className="text-sm text-muted-foreground">{purchase.merchant}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Total</div>
          <div className="text-xl font-bold">${purchase.total_amount.toLocaleString('es-MX')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Mensualidad</div>
          <div className="text-xl font-bold">${per.toLocaleString('es-MX')}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Mensualidades</div>
          <div className="text-xl font-bold">{purchase.installments}</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2">Calendario de pagos</h2>
        <MsiCalendar purchase={purchase} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(msi): full UI with list, form, detail, and payment calendar"
```

---

## Fase E — Dashboard y layout

### Task 22: App layout con sidebar y theme toggle

**Files:**
- Create: `components/shared/sidebar.tsx`, `components/shared/theme-toggle.tsx`, `app/(app)/layout.tsx`

- [ ] **Step 1: Sidebar component**

`components/shared/sidebar.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  List,
  CreditCard,
  Repeat,
  TrendingUp,
  Wallet,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/transactions', label: 'Transacciones', icon: List },
    ],
  },
  {
    label: 'Compromisos',
    items: [
      { href: '/msi', label: 'MSI', icon: CreditCard },
      { href: '/subscriptions', label: 'Suscripciones', icon: Repeat, disabled: true },
    ],
  },
  {
    label: 'Patrimonio',
    items: [
      { href: '/investments', label: 'Inversiones', icon: TrendingUp, disabled: true },
      { href: '/accounts', label: 'Cuentas', icon: Wallet },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { href: '/reports', label: 'Reportes', icon: BarChart3, disabled: true },
      { href: '/settings', label: 'Ajustes', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-card h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-5 border-b">
        <div className="font-bold">◆ Finanzas</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span className="ml-auto text-[9px]">Pronto</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm border-l-2 border-transparent hover:bg-muted',
                    active && 'bg-muted border-foreground font-semibold'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Theme toggle**

Primero instalar next-themes:

```bash
npm install next-themes
```

`components/shared/theme-toggle.tsx`:

```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
```

- [ ] **Step 3: Root layout con ThemeProvider**

Modificar `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finanzas',
  description: 'Dashboard de finanzas personales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: App layout con sidebar**

`app/(app)/layout.tsx`:

```typescript
import { Sidebar } from '@/components/shared/sidebar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Root page redirect**

Reemplazar `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(layout): sidebar, theme toggle, and auth-guarded app shell"
```

---

### Task 23: Meta mensual suave

**Files:**
- Create: `lib/db/goals.ts`, `app/(app)/settings/actions.ts`, `app/(app)/settings/page.tsx`

- [ ] **Step 1: Queries**

`lib/db/goals.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { currentMonthMX } from '@/lib/dates/month-mx';
import type { MonthlyGoal } from './types';

export async function getCurrentMonthGoal(): Promise<MonthlyGoal | null> {
  const supabase = createClient();
  const month = currentMonthMX();
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('*')
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  return data as MonthlyGoal | null;
}

export async function ensureCurrentMonthGoal(): Promise<MonthlyGoal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const month = currentMonthMX();
  const existing = await getCurrentMonthGoal();
  if (existing) return existing;

  // Read default from user_settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('default_monthly_goal')
    .maybeSingle();

  const target = settings?.default_monthly_goal ?? 20000;
  const { data, error } = await supabase
    .from('monthly_goals')
    .insert({ user_id: user.id, month, target_amount: target })
    .select()
    .single();

  if (error) throw error;
  return data as MonthlyGoal;
}
```

- [ ] **Step 2: Server Action para actualizar**

`app/(app)/settings/actions.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  default_monthly_goal: z.coerce.number().nonnegative(),
  theme: z.enum(['light', 'dark', 'system']),
});

export async function updateSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_settings')
    .update(parsed.data)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function updateCurrentMonthGoal(formData: FormData) {
  const amount = Number(formData.get('target_amount'));
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Monto inválido' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const month = new Date().toISOString().slice(0, 7) + '-01';
  const { error } = await supabase
    .from('monthly_goals')
    .upsert({ user_id: user.id, month, target_amount: amount }, { onConflict: 'user_id,month' });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/settings');
  return { success: true };
}
```

- [ ] **Step 3: Página de ajustes**

`app/(app)/settings/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from './actions';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_monthly_goal">Meta mensual de gasto (referencia)</Label>
              <Input
                id="default_monthly_goal"
                name="default_monthly_goal"
                type="number"
                step="100"
                defaultValue={settings?.default_monthly_goal ?? 20000}
              />
            </div>

            <input type="hidden" name="theme" value={settings?.theme ?? 'system'} />

            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(settings): monthly goal and default_monthly_goal preference"
```

---

### Task 24: Dashboard widgets — KPI cards

**Files:**
- Create: `components/dashboard/kpi-card.tsx`

- [ ] **Step 1: Componente KPI reutilizable**

`components/dashboard/kpi-card.tsx`:

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function KpiCard({
  label,
  value,
  sub,
  subTone,
  progressPct,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'positive' | 'negative' | 'neutral';
  progressPct?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {progressPct !== undefined && (
          <div className="h-1.5 bg-muted rounded mt-2 overflow-hidden">
            <div
              className="h-full bg-foreground"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        )}
        {sub && (
          <div
            className={
              'text-xs mt-1 ' +
              (subTone === 'positive'
                ? 'text-green-600'
                : subTone === 'negative'
                ? 'text-destructive'
                : 'text-muted-foreground')
            }
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(dashboard): reusable KPI card component"
```

---

### Task 25: Dashboard widgets — category donut y 6-month trend

**Files:**
- Create: `components/dashboard/category-donut.tsx`, `components/dashboard/trend-sparkline.tsx`

- [ ] **Step 1: Category donut con Recharts**

`components/dashboard/category-donut.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

export function CategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, x) => s + x.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gasto por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[140px] h-[140px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {slices.map((s) => (
                    <Cell key={s.categoryId} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1 text-xs">
            {slices.slice(0, 5).map((s) => (
              <div key={s.categoryId} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono font-semibold">
                  ${s.amount.toLocaleString('es-MX')}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
              <span>Total</span>
              <span className="font-mono">${total.toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Trend sparkline**

`components/dashboard/trend-sparkline.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';

export type TrendPoint = { month: string; total: number };

export function TrendSparkline({ points }: { points: TrendPoint[] }) {
  const avg = points.length ? points.reduce((s, p) => s + p.total, 0) / points.length : 0;
  const latest = points.at(-1)?.total ?? 0;
  const delta = avg ? ((latest - avg) / avg) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tendencia 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[90px]">
          <ResponsiveContainer>
            <BarChart data={points}>
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <Bar dataKey="total" fill="currentColor" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Promedio ${Math.round(avg).toLocaleString('es-MX')} · Este mes {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(dashboard): category donut and 6-month trend widgets"
```

---

### Task 26: Dashboard widget — MSI 12-month projection

**Files:**
- Create: `components/dashboard/msi-projection.tsx`

- [ ] **Step 1: Componente con leyenda narrativa**

`components/dashboard/msi-projection.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthProjection } from '@/lib/msi/calculations';

export function MsiProjection({
  projection,
  narrative,
}: {
  projection: MonthProjection[];
  narrative?: string;
}) {
  const data = projection.map((p) => ({
    month: p.month.slice(5, 7), // MM
    fullMonth: p.month,
    amount: p.amount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Proyección MSI próximos 12 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[140px]">
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number) => `$${v.toLocaleString('es-MX')}`}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth ?? ''}
              />
              <Bar dataKey="amount" fill="currentColor" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {narrative && <div className="text-xs text-muted-foreground mt-2">{narrative}</div>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(dashboard): MSI 12-month projection bar chart"
```

---

### Task 27: Dashboard page — composición de todos los widgets

**Files:**
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Página principal**

```typescript
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { CategoryDonut, type CategorySlice } from '@/components/dashboard/category-donut';
import { TrendSparkline, type TrendPoint } from '@/components/dashboard/trend-sparkline';
import { MsiProjection } from '@/components/dashboard/msi-projection';
import { ensureCurrentMonthMsiAggregate } from '@/lib/db/msi-aggregate-action';
import { ensureCurrentMonthGoal } from '@/lib/db/goals';
import { listMsiPurchases } from '@/lib/db/msi';
import { listCategories } from '@/lib/db/categories';
import { getMonthSummary } from '@/lib/db/transactions';
import { projectionForMonths, monthlyAmount, type MsiPurchase } from '@/lib/msi/calculations';
import { currentMonthMX, addMonthsMX } from '@/lib/dates/month-mx';

export default async function DashboardPage() {
  await ensureCurrentMonthMsiAggregate();
  const goal = await ensureCurrentMonthGoal();
  const supabase = createClient();

  const month = currentMonthMX();
  const prevMonth = addMonthsMX(month, -1);

  const [thisMonth, prevMonthSum, msiRows, categories] = await Promise.all([
    getMonthSummary(month),
    getMonthSummary(prevMonth),
    listMsiPurchases('active'),
    listCategories('expense'),
  ]);

  const balance = thisMonth.income - thisMonth.expenses;
  const prevBalance = prevMonthSum.income - prevMonthSum.expenses;
  const balanceDeltaPct = prevBalance ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100 : 0;

  const goalPct = (thisMonth.expenses / Number(goal.target_amount)) * 100;

  // MSI KPI: current aggregate is already in thisMonth.expenses; but we also want the raw MSI number
  const msiPurchases: MsiPurchase[] = msiRows.map((r) => ({
    id: r.id,
    total_amount: r.total_amount,
    installments: r.installments,
    first_payment_month: r.first_payment_month,
    status: r.status,
  }));
  const msiThisMonthTotal = msiPurchases.reduce(
    (s, p) => s + (p.first_payment_month <= month ? monthlyAmount(p) : 0),
    0
  );

  // Category slices (top 5)
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const slices: CategorySlice[] = Object.entries(thisMonth.byCategory)
    .map(([categoryId, amount]) => {
      const c = catMap.get(categoryId);
      return {
        categoryId,
        name: c?.name ?? '—',
        color: c?.color ?? '#64748b',
        amount: amount as number,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // 6-month trend
  const trend: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = addMonthsMX(month, -i);
    const { expenses } = await getMonthSummary(m);
    trend.push({ month: m.slice(5, 7), total: expenses });
  }

  // MSI projection next 12 months
  const projection = projectionForMonths(msiPurchases, month, 12);

  // Narrative
  const maxMonth = projection.reduce((a, b) => (b.amount > a.amount ? b : a), projection[0]);
  const narrative = maxMonth.amount > 0
    ? `El pago más alto es en ${maxMonth.month.slice(0, 7)} ($${maxMonth.amount.toLocaleString('es-MX')}).`
    : 'No hay compras MSI activas.';

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-MX')}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(`${month}T12:00:00Z`).toLocaleDateString('es-MX', {
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Mexico_City',
          })} · MXN
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Balance del mes"
          value={fmt(balance)}
          sub={`${balanceDeltaPct >= 0 ? '+' : ''}${balanceDeltaPct.toFixed(0)}% vs. mes anterior`}
          subTone={balanceDeltaPct >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Gastado"
          value={fmt(thisMonth.expenses)}
          progressPct={goalPct}
          sub={`${goalPct.toFixed(0)}% de meta ${fmt(Number(goal.target_amount))}`}
        />
        <KpiCard
          label="MSI del mes"
          value={fmt(msiThisMonthTotal)}
          sub={`${msiPurchases.length} compras activas`}
        />
        <KpiCard
          label="Ingresos del mes"
          value={fmt(thisMonth.income)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3"><CategoryDonut slices={slices} /></div>
        <div className="md:col-span-2"><TrendSparkline points={trend} /></div>
      </div>

      <MsiProjection projection={projection} narrative={narrative} />
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila y corre**

Run: `npm run build`
Expected: Build exitoso.

Run: `npm run dev`
Expected: Login → crear un usuario → redirigir a dashboard → ver los widgets (vacíos al principio).

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(dashboard): compose all widgets with real data from db"
```

---

## Fase F — Prueba de integración y QA final

### Task 28: Smoke test manual del flujo completo

- [ ] **Step 1: Crear usuario y datos de prueba via UI**

Run: `npm run dev`

Flujo manual:
1. Login → magic link → entrar
2. Ir a `/accounts` → crear tarjeta de crédito "BBVA Oro" con día de corte 15, día de pago 5
3. Ir a `/msi` → crear compra "Laptop Dell" · $24,000 · 12 meses · primer pago mes siguiente
4. Ir a `/transactions` → crear gasto manual "Comida" · $500 · hoy · cuenta "Efectivo"
5. Ir a `/dashboard` → verificar que:
   - Balance del mes refleja gastos
   - KPI "Gastado" muestra el monto y barra de progreso
   - KPI "MSI del mes" muestra $2,000 (o 0 si el primer pago es el mes siguiente)
   - Donut de categorías muestra las categorías con gastos
   - Proyección MSI 12 meses muestra barras
6. Ir a `/transactions` → verificar que el agregado MSI aparece con badge "MSI" en la tabla
7. Cambiar a tema oscuro desde el toggle → verificar contraste

- [ ] **Step 2: Documentar hallazgos**

Crear `docs/superpowers/test-runs/2026-04-14-mvp-smoke.md` con lo que se observó. Cualquier bug → abrir un issue inline (fix + commit).

- [ ] **Step 3: Commit del reporte**

```bash
git add docs/
git commit -m "docs: MVP smoke test run results"
```

---

### Task 29: Correr todos los tests y linting final

- [ ] **Step 1: Unit tests**

Run: `npm run test:run`
Expected: Todos los tests de `month-mx`, `calculations`, `aggregate` pasan.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Sin errores.

- [ ] **Step 3: Build production**

Run: `npm run build`
Expected: Build exitoso.

- [ ] **Step 4: Commit si hubo fixes**

```bash
git add .
git commit -m "chore: clean up before MVP wrap-up" # solo si hubo cambios
```

---

### Task 30: README con setup y próximos pasos

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escribir README**

```markdown
# Finanzas

Dashboard de finanzas personales: gastos, MSI, suscripciones, inversiones.

## Stack

Next.js 14 · TypeScript · Tailwind · shadcn/ui · Supabase · Vitest

## Setup

1. `npm install`
2. Crear proyecto en Supabase
3. Copiar `.env.local.example` a `.env.local` y llenar credenciales
4. Ejecutar las migraciones de `supabase/migrations/` en el SQL Editor (en orden)
5. `npm run dev`

## Tests

- `npm run test` — watch mode
- `npm run test:run` — single run
- `npx tsc --noEmit` — type check

## Estado actual

MVP de primera ola completo: auth, cuentas, transacciones, MSI con proyección, dashboard con widgets, meta mensual suave, tema claro/oscuro.

Próximas olas (planes separados):
- Suscripciones
- Inversiones
- Reportes avanzados (gastos hormiga, comparativas)

Ver `docs/superpowers/specs/` y `docs/superpowers/plans/` para contexto de diseño.
```

- [ ] **Step 2: Commit final**

```bash
git add README.md
git commit -m "docs: README with setup and MVP status"
```

---

## Resumen de cobertura vs. spec

- **Auth multi-usuario con RLS**: Tasks 5-10
- **Modelo de datos completo**: Tasks 6-8
- **Módulos CRUD (cuentas, categorías, transacciones)**: Tasks 15-19
- **MSI con cálculo puro + agregado idempotente**: Tasks 11-13, 20-21
- **Dashboard con widgets aprobados**: Tasks 24-27
- **Meta mensual suave**: Task 23
- **Tema claro/oscuro**: Task 22
- **Sidebar con 8 secciones**: Task 22 (3 items marcados como "pronto" para olas posteriores)
- **Timezone MX consistente**: Task 4 (usado en todos los lugares que calculan mes)
- **Tests unitarios del core (MSI + dates)**: Tasks 4, 11, 12

## Fuera de alcance (planes posteriores)

- Suscripciones
- Inversiones
- Reportes (tendencias, comparativas, gastos hormiga)
- Simulador MSI (widget "¿y si compro esto?")
- Gráfica stacked por compra
- Importación CSV
- Playwright e2e
- Deploy a Vercel (el plan termina con build local verde)
