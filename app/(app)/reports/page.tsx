import {
  getCategoryTrend,
  getMonthComparison,
  getMicroSpending,
  getHistoricalAverage,
} from '@/lib/db/reports';
import { currentMonthMX, addMonthsMX } from '@/lib/dates/month-mx';
import { CategoryTrendChart } from '@/components/reports/category-trend-chart';
import { MonthComparison } from '@/components/reports/month-comparison';
import { MicroSpendingTable } from '@/components/reports/micro-spending-table';
import { HistoricalAvgChart } from '@/components/reports/historical-avg-chart';

export default async function ReportsPage() {
  const month = currentMonthMX();
  const prevMonth = addMonthsMX(month, -1);

  const [trendData, comparison, microSpending, historicalAvg] = await Promise.all([
    getCategoryTrend(6),
    getMonthComparison(month, prevMonth),
    getMicroSpending(month),
    getHistoricalAverage(6),
  ]);

  const monthLabel = new Date(`${month}T12:00:00Z`).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });

  const prevMonthLabel = new Date(`${prevMonth}T12:00:00Z`).toLocaleDateString('es-MX', {
    month: 'short',
    timeZone: 'America/Mexico_City',
  });

  const currentMonthLabel = new Date(`${month}T12:00:00Z`).toLocaleDateString('es-MX', {
    month: 'short',
    timeZone: 'America/Mexico_City',
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold capitalize">Reportes</h1>
        <p className="text-sm text-muted-foreground capitalize">Análisis de {monthLabel}</p>
      </div>

      <CategoryTrendChart data={trendData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MonthComparison
          rows={comparison}
          labelA={currentMonthLabel}
          labelB={prevMonthLabel}
        />
        <HistoricalAvgChart rows={historicalAvg} />
      </div>

      <MicroSpendingTable rows={microSpending} />
    </div>
  );
}
