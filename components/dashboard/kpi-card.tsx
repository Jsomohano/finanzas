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
      <CardHeader className="pb-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {progressPct !== undefined && (
          <div className="h-1.5 bg-muted rounded mt-2 overflow-hidden">
            <div
              className="h-full bg-foreground"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        )}
        {sub && (
          <div
            className={
              'text-xs mt-1 ' +
              (subTone === 'positive'
                ? 'text-green-600'
                : subTone === 'negative'
                ? 'text-destructive'
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
