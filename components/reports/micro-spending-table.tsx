'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MicroSpendingRow } from '@/lib/db/types';

type Props = { rows: MicroSpendingRow[] };

export function MicroSpendingTable({ rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Gastos hormiga</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Sin patrones de gasto repetitivo este mes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left pb-2 font-medium">Categoría</th>
                  <th className="text-right pb-2 font-medium">Txns</th>
                  <th className="text-right pb-2 font-medium">Promedio</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.categoryId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: r.color }}
                        />
                        {r.name}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono text-muted-foreground">{r.count}</td>
                    <td className="py-2 text-right font-mono">
                      ${r.avgAmount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold">
                      ${r.total.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              Categorías con ≥4 transacciones y promedio &lt;$300 este mes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
