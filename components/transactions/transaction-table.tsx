import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Category, Account } from '@/lib/db/types';

export function TransactionTable({
  transactions,
  categories,
  accounts,
}: {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Cuenta</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const cat = catMap.get(t.category_id);
          const acc = t.account_id ? accMap.get(t.account_id) : null;
          return (
            <TableRow key={t.id}>
              <TableCell className="text-xs">{t.date}</TableCell>
              <TableCell>
                {t.description}
                {t.source === 'msi_aggregate' && (
                  <Badge variant="secondary" className="ml-2">MSI</Badge>
                )}
              </TableCell>
              <TableCell className="text-xs">{cat?.name ?? '—'}</TableCell>
              <TableCell className="text-xs">{acc?.name ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">
                <span className={t.kind === 'expense' ? 'text-destructive' : 'text-green-600'}>
                  {t.kind === 'expense' ? '−' : '+'}${Number(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
