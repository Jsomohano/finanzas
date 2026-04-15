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
                formatter={(v) => `$${Number(v).toLocaleString('es-MX')}`}
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
