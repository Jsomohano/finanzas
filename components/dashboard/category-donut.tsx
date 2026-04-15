'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

export function CategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, x) => s + x.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gasto por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-[140px] h-[140px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {slices.map((s) => (
                    <Cell key={s.categoryId} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1 text-xs">
            {slices.slice(0, 5).map((s) => (
              <div key={s.categoryId} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono font-semibold">
                  ${s.amount.toLocaleString('es-MX')}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t mt-2 font-semibold">
              <span>Total</span>
              <span className="font-mono">${total.toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
