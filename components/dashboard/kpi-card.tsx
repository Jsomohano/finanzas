import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HelpTip } from '@/components/ui/help-tip';

export function KpiCard({
  label,
  tooltip,
  value,
  sub,
  subTone,
  progressPct,
}: {
  label: string;
  tooltip?: string;
  value: string;
  sub?: string;
  subTone?: 'positive' | 'negative' | 'neutral';
  progressPct?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
          {tooltip && <HelpTip text={tooltip} />}
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
              'text-xs mt-2 flex items-center gap-0.5 ' +
              (subTone === 'positive'
                ? 'text-positive'
                : subTone === 'negative'
                ? 'text-negative'
                : 'text-muted-foreground')
            }
          >
            {subTone === 'positive' && <span aria-hidden="true">↑</span>}
            {subTone === 'negative' && <span aria-hidden="true">↓</span>}
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
