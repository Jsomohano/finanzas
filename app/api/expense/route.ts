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
// Body: { amount: number, description: string, account?: string, date?: string (YYYY-MM-DD) }
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const userId = process.env.SHORTCUT_USER_ID;
  if (!userId) return NextResponse.json({ error: 'SHORTCUT_USER_ID no configurado' }, { status: 500 });

  let body: { amount?: unknown; description?: unknown; account?: unknown; date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const amount = Number(body.amount);
  const description = String(body.description ?? '').trim();
  const date = String(body.date ?? new Date().toISOString().slice(0, 10));
  const accountName = String(body.account ?? '').trim();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 });
  }

  const supabase = adminClient();

  // Buscar o crear la categoría "Salidas"
  let categoryId: string | null = null;
  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .ilike('name', 'salidas')
    .maybeSingle();

  if (catData) {
    categoryId = catData.id;
  } else {
    // Crear la nueva categoría "Salidas"
    const { data: newCat, error: catError } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: 'Salidas', type: 'expense' })
      .select('id')
      .single();
    
    if (newCat) {
      categoryId = newCat.id;
    } else {
      return NextResponse.json({ error: catError?.message || 'Error al crear la categoría Salidas' }, { status: 500 });
    }
  }

  // Buscar la cuenta
  let accountId: string | null = null;
  if (accountName) {
    const { data: accData } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', accountName)
      .maybeSingle();
      
    if (accData) {
      accountId = accData.id;
    } else {
      return NextResponse.json({ error: `La cuenta "${accountName}" no existe en la base de datos` }, { status: 400 });
    }
  } else {
    // Cuenta por defecto si no se especifica
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    accountId = account?.id ?? null;
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    amount,
    description,
    category_id: categoryId,
    account_id: accountId,
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
