'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Pause, Play, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RegisterPaymentDialog } from './register-payment-dialog';
import { RecurringItemDialog } from './recurring-item-dialog';
import { updateRecurringItemStatus } from '@/app/(app)/recurring/actions';
import type { Account, Category, RecurringItemWithRelations } from '@/lib/db/types';

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Cada 2 sem',
  quincenal: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
};

function isPaidThisPeriod(
  frequency: string,
  lastPaymentDate: string | undefined
): boolean {
  if (!lastPaymentDate) return false;
  const last = new Date(lastPaymentDate + 'T12:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case 'weekly': return diffDays < 7;
    case 'biweekly': return diffDays < 14;
    case 'quincenal': return diffDays < 16;
    case 'monthly':
      return last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear();
    case 'bimonthly': {
      const monthDiff =
        (now.getFullYear() - last.getFullYear()) * 12 + now.getMonth() - last.getMonth();
      return monthDiff < 2;
    }
    default: return false;
  }
}

type Props = {
  items: RecurringItemWithRelations[];
  lastPayments: Record<string, { date: string; amount: number }>;
  accounts: Account[];
  categories: Category[];
  type: 'subscription' | 'fixed';
};

export function RecurringList({ items, lastPayments, accounts, categories, type }: Props) {
  const router = useRouter();

  const filtered = items.filter(i => i.type === type);
  const active = filtered.filter(i => i.status === 'active');
  const inactive = filtered.filter(i => i.status !== 'active');

  async function handleStatusChange(id: string, status: 'active' | 'paused' | 'cancelled') {
    const result = await updateRecurringItemStatus(id, status);
    if (result.error) toast.error(result.error);
    else {
      router.refresh();
      toast.success('Estado actualizado');
    }
  }

  function renderItem(item: RecurringItemWithRelations) {
    const lastPay = lastPayments[item.id];
    const paid = isPaidThisPeriod(item.frequency, lastPay?.date);

    return (
      <div
        key={item.id}
        className="flex items-center justify-between gap-3 rounded-md border p-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {item.categories && (
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.categories.color }}
              />
            )}
            <span className="font-medium text-sm truncate">{item.name}</span>
            {item.status !== 'active' && (
              <Badge variant="secondary" className="text-[10px]">
                {item.status === 'paused' ? 'Pausado' : 'Cancelado'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span>·</span>
            <span>{FREQ_LABELS[item.frequency]}</span>
            {item.due_day && (
              <>
                <span>·</span>
                <span>Día {item.due_day}</span>
              </>
            )}
            {item.accounts && (
              <>
                <span>·</span>
                <span>{item.accounts.name}</span>
              </>
            )}
          </div>
          {lastPay && (
            <div className="text-[11px] text-muted-foreground mt-1">
              Último pago: {lastPay.date} — ${lastPay.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {paid ? (
            <Badge variant="default" className="bg-green-600 text-[10px]">Pagado</Badge>
          ) : item.status === 'active' ? (
            <RegisterPaymentDialog item={item} accounts={accounts} />
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RecurringItemDialog
                accounts={accounts}
                categories={categories}
                type={type}
                initial={item}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                  </DropdownMenuItem>
                }
              />
              {item.status === 'active' ? (
                <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'paused')}>
                  <Pause className="mr-2 h-3.5 w-3.5" /> Pausar
                </DropdownMenuItem>
              ) : item.status === 'paused' ? (
                <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'active')}>
                  <Play className="mr-2 h-3.5 w-3.5" /> Reactivar
                </DropdownMenuItem>
              ) : null}
              {item.status !== 'cancelled' && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleStatusChange(item.id, 'cancelled')}
                >
                  <X className="mr-2 h-3.5 w-3.5" /> Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {active.length === 0 && inactive.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay {type === 'subscription' ? 'suscripciones' : 'gastos fijos'} registrados
        </p>
      )}
      {active.map(renderItem)}
      {inactive.length > 0 && (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-4 pb-1">
            Inactivos
          </div>
          <div className="opacity-60 space-y-2">
            {inactive.map(renderItem)}
          </div>
        </>
      )}
    </div>
  );
}
