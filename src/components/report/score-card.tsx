import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRiskInfo } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  score: number;
}

export function ScoreCard({ label, score }: ScoreCardProps) {
  const risk = getRiskInfo(score);
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <Card className="shadow-none dark:ring-0 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <span className={cn("text-2xl font-bold tabular-nums", risk.textClass)}>
            {clamped}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", risk.badgeClass)}>
            {risk.labelIt}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", risk.bgClass)}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
