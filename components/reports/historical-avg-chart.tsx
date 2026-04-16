'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HistoricalAvgRow } from '@/lib/db/types';

type Props = { rows: HistoricalAvgRow[] };

export function HistoricalAvgChart({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Promedio histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Sin datos históricos disponibles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const top8 = rows.slice(0, 8);
  const chartData = top8.map((r) => ({
    name: r.name.length > 12 ? r.name.slice(0, 11) + '…' : r.name,
    'Este mes': r.currentMonth,
    'Prom. histórico': r.historicalAvg,
    deltaPct: r.deltaPct,
    color: r.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Promedio histórico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toLocaleString('es-MX')}`}
                width={70}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString('es-MX')}`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Este mes" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar
                dataKey="Prom. histórico"
                fill="hsl(var(--muted-foreground))"
                radius={[3, 3, 0, 0]}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Delta summary */}
        <div className="mt-3 space-y-1">
          {top8.slice(0, 5).map((r) => (
            <div key={r.categoryId} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                {r.name}
              </span>
              <span
                className={
                  r.delta > 0
                    ? 'text-fin-negative font-mono font-semibold'
                    : r.delta < 0
                    ? 'text-fin-positive font-mono font-semibold'
                    : 'text-muted-foreground font-mono'
                }
              >
                {r.delta > 0 ? '+' : ''}
                {r.deltaPct.toFixed(0)}% vs prom.
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
