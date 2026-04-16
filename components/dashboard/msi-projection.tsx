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
        <div className="h-[140px] text-primary">
          <ResponsiveContainer>
            <BarChart data={data} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString('es-MX')}`, 'MSI']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth ?? ''}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Bar dataKey="amount" fill="currentColor" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {narrative && <div className="text-xs text-muted-foreground mt-2">{narrative}</div>}
      </CardContent>
    </Card>
  );
}
