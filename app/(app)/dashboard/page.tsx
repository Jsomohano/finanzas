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

  const trend: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = addMonthsMX(month, -i);
    const { expenses } = await getMonthSummary(m);
    trend.push({ month: m.slice(5, 7), total: expenses });
  }

  const projection = projectionForMonths(msiPurchases, month, 12);

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
