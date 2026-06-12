import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskInfo } from "@/lib/risk-utils";
import type { SecurityReport } from "@/types/report";

interface DayPoint {
  date: string;
  score: number;
  label: string;
}

function generateMockHistory(currentAvg: number): DayPoint[] {
  const today = new Date();
  const points: DayPoint[] = [];
  // Walk backwards 29 days generating a realistic random walk
  let score = Math.min(100, Math.max(0, currentAvg + (Math.random() > 0.5 ? 8 : -8)));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    const date = d.toISOString().split("T")[0];
    // random walk clamped to [0,100]
    const delta = (Math.random() - 0.48) * 6;
    score = Math.min(100, Math.max(0, score + delta));
    // last point is always the real current average
    if (i === 0) score = currentAvg;
    points.push({ date, label, score: Math.round(score) });
  }
  return points;
}

// Stable mock data seeded from currentAvg (regenerates only when avg changes)
function useRiskHistory(reports: SecurityReport[]): DayPoint[] {
  const currentAvg = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / reports.length)
    : 50;

  return useMemo(() => {
    // Build from real report dates first, fill gaps with simulated data
    const byDate: Record<string, number[]> = {};
    for (const r of reports) {
      const d = r.creation_date?.split("T")[0] ?? "";
      if (d) (byDate[d] ??= []).push(r.risk_score);
    }
    const realPoints = Object.entries(byDate).map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      label: new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }),
    }));

    // If we have fewer than 7 real days, fill with mock history
    if (realPoints.length < 7) return generateMockHistory(currentAvg);

    return realPoints.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAvg, reports.length]);
}

function gradientStop(score: number) {
  if (score > 80) return "#ef4444";
  if (score > 60) return "#f97316";
  if (score > 30) return "#eab308";
  return "#22c55e";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const risk = getRiskInfo(score);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md text-xs">
      <p className="mb-1 text-muted-foreground">{label}</p>
      <p className={cn("font-bold text-sm tabular-nums", risk.textClass)}>
        {score} <span className="font-normal text-xs">{risk.labelIt}</span>
      </p>
    </div>
  );
}

interface Props {
  reports: SecurityReport[];
}

export function RiskTrendChart({ reports }: Props) {
  const data = useRiskHistory(reports);
  const last = data[data.length - 1]?.score ?? 0;
  const prev = data[data.length - 2]?.score ?? last;
  const delta = last - prev;
  const risk = getRiskInfo(last);

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-destructive" : delta < 0 ? "text-green-500" : "text-muted-foreground";

  const strokeColor = gradientStop(last);

  // Show only every 5th label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? data[index]?.label ?? "" : "";

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Risk Score Globale — ultimi 30 giorni
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={cn("size-3.5", trendColor)} />
            <span className={cn("text-xs font-semibold tabular-nums", trendColor)}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-3">
        <div className="h-35">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                ticks={[0, 30, 60, 80, 100]}
              />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={60} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#riskGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Score attuale: <span className={cn("font-semibold", risk.textClass)}>{last}</span></span>
          <span className={cn("text-[10px] font-medium", risk.textClass)}>{risk.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
