import { createClient } from '@/lib/supabase/server';
import { getMonthSummary } from './transactions';
import { listCategories } from './categories';
import { currentMonthMX, addMonthsMX } from '@/lib/dates/month-mx';
import type {
  CategoryTrendPoint,
  MonthComparisonRow,
  MicroSpendingRow,
  HistoricalAvgRow,
} from './types';

export type { CategoryTrendPoint, MonthComparisonRow, MicroSpendingRow, HistoricalAvgRow };

/** Gastos por categoría en los últimos N meses. */
export async function getCategoryTrend(months: number = 6): Promise<CategoryTrendPoint[]> {
  const supabase = createClient();
  const now = currentMonthMX();
  const startMonth = addMonthsMX(now, -(months - 1));
  const nextMonth = addMonthsMX(now, 1);

  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, category_id')
    .eq('kind', 'expense')
    .gte('date', startMonth)
    .lt('date', nextMonth);

  if (error) throw error;

  const categories = await listCategories('expense');
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Group by (month, categoryId)
  const grouped: Record<string, Record<string, number>> = {};
  for (const t of data ?? []) {
    const month = t.date.slice(0, 7) + '-01';
    if (!grouped[month]) grouped[month] = {};
    grouped[month][t.category_id] = (grouped[month][t.category_id] ?? 0) + Number(t.amount);
  }

  const result: CategoryTrendPoint[] = [];
  for (const month of Object.keys(grouped).sort()) {
    for (const [categoryId, amount] of Object.entries(grouped[month])) {
      const cat = catMap.get(categoryId);
      result.push({
        month,
        categoryId,
        categoryName: cat?.name ?? '—',
        color: cat?.color ?? '#64748b',
        amount: Math.round(amount * 100) / 100,
      });
    }
  }

  return result;
}

/** Comparativa de dos meses por categoría. */
export async function getMonthComparison(
  monthA: string,
  monthB: string
): Promise<MonthComparisonRow[]> {
  const [summaryA, summaryB, categories] = await Promise.all([
    getMonthSummary(monthA),
    getMonthSummary(monthB),
    listCategories('expense'),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const allIds = new Set([
    ...Object.keys(summaryA.byCategory),
    ...Object.keys(summaryB.byCategory),
  ]);

  const rows: MonthComparisonRow[] = [];
  for (const categoryId of allIds) {
    const cat = catMap.get(categoryId);
    const amountA = summaryA.byCategory[categoryId] ?? 0;
    const amountB = summaryB.byCategory[categoryId] ?? 0;
    const delta = amountA - amountB;
    const deltaPct = amountB ? (delta / amountB) * 100 : 0;
    rows.push({
      categoryId,
      name: cat?.name ?? '—',
      color: cat?.color ?? '#64748b',
      amountA,
      amountB,
      delta,
      deltaPct,
    });
  }

  return rows.sort((a, b) => b.amountA - a.amountA);
}

/** Gastos hormiga: categorías con alta frecuencia y bajo monto promedio. */
export async function getMicroSpending(
  month: string,
  minCount: number = 4
): Promise<MicroSpendingRow[]> {
  const supabase = createClient();
  const nextMonth = addMonthsMX(month, 1);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('kind', 'expense')
    .gte('date', month)
    .lt('date', nextMonth);

  if (error) throw error;

  const categories = await listCategories('expense');
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Group by categoryId
  const grouped: Record<string, { count: number; total: number }> = {};
  for (const t of data ?? []) {
    const entry = grouped[t.category_id] ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(t.amount);
    grouped[t.category_id] = entry;
  }

  const AVG_THRESHOLD = 300; // MXN
  const rows: MicroSpendingRow[] = [];
  for (const [categoryId, { count, total }] of Object.entries(grouped)) {
    const avgAmount = total / count;
    if (count >= minCount && avgAmount < AVG_THRESHOLD) {
      const cat = catMap.get(categoryId);
      rows.push({
        categoryId,
        name: cat?.name ?? '—',
        color: cat?.color ?? '#64748b',
        count,
        avgAmount: Math.round(avgAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      });
    }
  }

  return rows.sort((a, b) => b.count - a.count);
}

/** Promedio histórico por categoría vs mes actual. */
export async function getHistoricalAverage(monthsBack: number = 6): Promise<HistoricalAvgRow[]> {
  const now = currentMonthMX();
  const historicalMonths = Array.from({ length: monthsBack }, (_, i) =>
    addMonthsMX(now, -(monthsBack - i))
  );

  const [currentSummary, ...historicalSummaries] = await Promise.all([
    getMonthSummary(now),
    ...historicalMonths.map((m) => getMonthSummary(m)),
  ]);

  const categories = await listCategories('expense');
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Compute per-category average across historical months
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const summary of historicalSummaries) {
    for (const [catId, amount] of Object.entries(summary.byCategory)) {
      totals[catId] = (totals[catId] ?? 0) + amount;
      counts[catId] = (counts[catId] ?? 0) + 1;
    }
  }

  const allIds = new Set([
    ...Object.keys(totals),
    ...Object.keys(currentSummary.byCategory),
  ]);

  const rows: HistoricalAvgRow[] = [];
  for (const categoryId of allIds) {
    const cat = catMap.get(categoryId);
    const historicalAvg = counts[categoryId]
      ? Math.round(((totals[categoryId] ?? 0) / counts[categoryId]) * 100) / 100
      : 0;
    const currentMonth = currentSummary.byCategory[categoryId] ?? 0;
    const delta = currentMonth - historicalAvg;
    const deltaPct = historicalAvg ? (delta / historicalAvg) * 100 : 0;
    rows.push({
      categoryId,
      name: cat?.name ?? '—',
      color: cat?.color ?? '#64748b',
      historicalAvg,
      currentMonth,
      delta,
      deltaPct,
    });
  }

  return rows.sort((a, b) => b.currentMonth - a.currentMonth);
}
