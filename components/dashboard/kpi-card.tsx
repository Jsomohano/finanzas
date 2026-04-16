import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function KpiCard({
  label,
  value,
  sub,
  subTone,
  progressPct,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'positive' | 'negative' | 'neutral';
  progressPct?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      </CardHeader>
      <CardContent>
        <div className="kpi-value text-[1.75rem] leading-none">{value}</div>
        {progressPct !== undefined && (
          <div className="h-1 bg-muted rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct > 100 ? 'bg-fin-negative' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        )}
        {sub && (
          <div
            className={
              'text-xs mt-2 ' +
              (subTone === 'positive'
                ? 'text-positive'
                : subTone === 'negative'
                ? 'text-negative'
                : 'text-muted-foreground')
            }
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
