import { cn } from "@/lib/utils";
import { getRiskInfo } from "@/lib/risk-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/hooks/use-t";

interface RiskGaugeProps {
  score: number;
  domainName: string;
  className?: string;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function RiskGauge({ score, domainName, className }: RiskGaugeProps) {
  const t = useT();
  const cx = 120, cy = 120, r = 95, strokeW = 14;
  const clamped = Math.max(0, Math.min(100, score));
  const risk = getRiskInfo(clamped);

  const startDeg = 270;
  const totalSweep = 180;
  const startPt = polar(cx, cy, r, startDeg);
  const midPt = polar(cx, cy, r, 0);
  const endPt = polar(cx, cy, r, startDeg + totalSweep);

  const trackPath =
    `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 0 1 ${midPt.x} ${midPt.y} A ${r} ${r} 0 0 1 ${endPt.x} ${endPt.y}`;

  let valuePath: string | null = null;
  if (clamped > 0 && clamped < 100) {
    const valueDeg = startDeg + (clamped / 100) * totalSweep;
    const valuePt = polar(cx, cy, r, valueDeg);
    if (clamped <= 50) {
      valuePath = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 0 1 ${valuePt.x} ${valuePt.y}`;
    } else {
      valuePath = `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 0 1 ${midPt.x} ${midPt.y} A ${r} ${r} 0 0 1 ${valuePt.x} ${valuePt.y}`;
    }
  } else if (clamped === 100) {
    valuePath = trackPath;
  }

  return (
    <Card className={cn("shadow-none dark:ring-0", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-sm break-all">{domainName}</CardTitle>
        <CardDescription>{t.report.gaugeSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <svg viewBox="10 10 220 138" className="w-full max-w-64">
          <path d={trackPath} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={strokeW} strokeLinecap="round" />
          {valuePath && (
            <path d={valuePath} fill="none" stroke={risk.hex} strokeWidth={strokeW} strokeLinecap="round" />
          )}
          <text x={cx} y={cy - 20} textAnchor="middle" dominantBaseline="middle" fontSize="40" fontWeight="700" fill="currentColor">
            {clamped}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="hanging" fontSize="11" fontWeight="600" fill={risk.hex} letterSpacing="2">
            {risk.label}
          </text>
        </svg>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", risk.badgeClass)}>
          {risk.labelIt}
        </span>
      </CardContent>
    </Card>
  );
}
