'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { CategoryTrendPoint } from '@/lib/db/types';

type Props = { data: CategoryTrendPoint[] };

export function CategoryTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tendencias por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Sin datos de los últimos 6 meses.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique months and top-5 categories by total spend
  const months = Array.from(new Set(data.map((d) => d.month))).sort();
  const catTotals: Record<string, { name: string; color: string; total: number }> = {};
  for (const d of data) {
    if (!catTotals[d.categoryId]) {
      catTotals[d.categoryId] = { name: d.categoryName, color: d.color, total: 0 };
    }
    catTotals[d.categoryId].total += d.amount;
  }
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  // Build chart data: one row per month
  const chartData = months.map((month) => {
    const row: Record<string, string | number> = {
      month: month.slice(5, 7) + '/' + month.slice(2, 4),
    };
    for (const [catId] of topCats) {
      const point = data.find((d) => d.month === month && d.categoryId === catId);
      row[catId] = point?.amount ?? 0;
    }
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tendencias por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toLocaleString('es-MX')}`}
                width={70}
              />
              <Tooltip
                formatter={(v, name) => {
                  const cat = catTotals[name as string];
                  return [`$${Number(v).toLocaleString('es-MX')}`, cat?.name ?? name];
                }}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend
                formatter={(value) => catTotals[value]?.name ?? value}
                wrapperStyle={{ fontSize: 11 }}
              />
              {topCats.map(([catId, { color }]) => (
                <Line
                  key={catId}
                  type="monotone"
                  dataKey={catId}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
