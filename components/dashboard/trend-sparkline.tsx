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
