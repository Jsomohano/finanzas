import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const key = process.env.SHORTCUT_API_KEY;
  if (!key) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${key}`;
}

// GET /api/expense — returns categories list for the Shortcut picker
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const userId = process.env.SHORTCUT_USER_ID;
  if (!userId) return NextResponse.json({ error: 'SHORTCUT_USER_ID no configurado' }, { status: 500 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ categories: data ?? [] });
}

// POST /api/expense — registers an expense
// Body: { amount: number, description: string, category_id?: string, date?: string (YYYY-MM-DD) }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const userId = process.env.SHORTCUT_USER_ID;
  if (!userId) return NextResponse.json({ error: 'SHORTCUT_USER_ID no configurado' }, { status: 500 });

  let body: { amount?: unknown; description?: unknown; category_id?: unknown; date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const amount = Number(body.amount);
  const description = String(body.description ?? '').trim();
  const date = String(body.date ?? new Date().toISOString().slice(0, 10));

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 });
  }

  const supabase = adminClient();

  // Resolve category — use provided id, else fall back to first expense category
  let categoryId = String(body.category_id ?? '').trim() || null;
  if (!categoryId) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .order('name')
      .limit(1)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  if (!categoryId) {
    return NextResponse.json({ error: 'No hay categorías de gasto configuradas' }, { status: 400 });
  }

  // Use first account as default
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    amount,
    description,
    category_id: categoryId,
    account_id: account?.id ?? null,
    kind: 'expense',
    date,
    source: 'manual',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    message: `$${amount.toLocaleString('es-MX')} — ${description}`,
  });
}
