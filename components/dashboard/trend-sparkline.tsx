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
        <div className="h-[90px] text-primary">
          <ResponsiveContainer>
            <BarChart data={points} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Bar dataKey="total" fill="currentColor" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Promedio ${Math.round(avg).toLocaleString('es-MX')} ·{' '}
          <span className={delta >= 0 ? 'text-positive' : 'text-negative'}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(0)}% este mes
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
