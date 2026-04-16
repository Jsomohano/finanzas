'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

export function CategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, x) => s + x.amount, 0);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gasto por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Sin gastos este mes.</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-[140px] h-[140px] flex-shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    strokeWidth={0}
                    onClick={(_, index) => {
                      const slice = slices[index];
                      if (slice) router.push(`/transactions?category=${slice.categoryId}`);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {slices.map((s) => (
                      <Cell key={s.categoryId} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toLocaleString('es-MX')}`, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1 text-xs min-w-0">
              {slices.slice(0, 5).map((s) => (
                <button
                  key={s.categoryId}
                  className="flex justify-between w-full hover:bg-muted rounded px-1 py-0.5 transition-colors group"
                  onClick={() => router.push(`/transactions?category=${s.categoryId}`)}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="truncate group-hover:text-foreground text-muted-foreground">{s.name}</span>
                  </span>
                  <span className="font-mono font-semibold ml-2 flex-shrink-0">
                    ${s.amount.toLocaleString('es-MX')}
                  </span>
                </button>
              ))}
              <div className="flex justify-between pt-2 border-t mt-2 font-semibold px-1">
                <span>Total</span>
                <span className="font-mono">${total.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
