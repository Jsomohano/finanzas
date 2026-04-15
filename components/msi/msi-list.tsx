import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MsiPurchaseRow } from '@/lib/db/types';
import { monthlyAmount, monthsRemaining } from '@/lib/msi/calculations';
import { currentMonthMX } from '@/lib/dates/month-mx';

export function MsiList({ purchases }: { purchases: MsiPurchaseRow[] }) {
  const nowMonth = currentMonthMX();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Comercio</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Mensualidad</TableHead>
          <TableHead>Progreso</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((p) => {
          const per = monthlyAmount(p);
          const remaining = monthsRemaining(
            { id: p.id, total_amount: p.total_amount, installments: p.installments, first_payment_month: p.first_payment_month, status: p.status },
            nowMonth
          );
          const paid = p.installments - remaining;
          return (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.merchant ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">${p.total_amount.toLocaleString('es-MX')}</TableCell>
              <TableCell className="text-right font-mono">${per.toLocaleString('es-MX')}</TableCell>
              <TableCell>{paid}/{p.installments}</TableCell>
              <TableCell><Link href={`/msi/${p.id}`} className="text-sm underline">Detalle</Link></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
