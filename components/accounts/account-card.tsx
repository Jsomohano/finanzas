import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/db/types';

const TYPE_LABEL: Record<Account['type'], string> = {
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Efectivo',
};

export function AccountCard({ account }: { account: Account }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{account.name}</CardTitle>
          {account.bank && <p className="text-xs text-muted-foreground">{account.bank}</p>}
        </div>
        <Badge variant="outline">{TYPE_LABEL[account.type]}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${account.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        {account.last_four && (
          <p className="text-xs text-muted-foreground">•••• {account.last_four}</p>
        )}
        {account.type === 'credit' && account.closing_day && (
          <p className="text-xs text-muted-foreground">
            Corte día {account.closing_day} · Pago día {account.payment_day}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
