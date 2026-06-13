import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllReports } from "@/hooks/use-reports";
import { getRiskInfo } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";
import type { SecurityReport } from "@/types/report";

interface DomainDelta {
  domain: string;
  previous: number;
  current: number;
  delta: number;
  latestId: string;
  previousId: string;
}

function computeDeltas(reports: SecurityReport[]): DomainDelta[] {
  const byDomain = new Map<string, SecurityReport[]>();
  for (const r of reports) {
    const arr = byDomain.get(r.domain_name) ?? [];
    arr.push(r);
    byDomain.set(r.domain_name, arr);
  }
  const result: DomainDelta[] = [];
  for (const [domain, scans] of byDomain) {
    if (scans.length < 2) continue;
    const sorted = [...scans].sort((a, b) =>
      (b.creation_date ?? "").localeCompare(a.creation_date ?? "")
    );
    const current = Number(sorted[0].risk_score);
    const previous = Number(sorted[1].risk_score);
    const delta = current - previous;
    if (delta !== 0) result.push({
      domain, previous, current, delta,
      latestId: sorted[0].idsummary,
      previousId: sorted[1].idsummary,
    });
  }
  return result;
}

function ColumnHeader() {
  const t = useT();
  return (
    <div className="flex items-center gap-3 px-3 pb-1 border-b mb-1">
      <span className="w-5 shrink-0" />
      <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t.dash.colDomain}
      </span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-28 text-right">
        {t.dash.topDailyChange}
      </span>
    </div>
  );
}

function DomainRow({ rank, item }: { rank: number; item: DomainDelta }) {
  const navigate = useNavigate();
  const riskCurrent = getRiskInfo(item.current);

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/compare/${encodeURIComponent(item.domain)}?a=${item.latestId}&b=${item.previousId}`)}
    >
      <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{rank}</span>
      <span className="flex-1 truncate text-sm font-medium">{item.domain}</span>
      <div className="shrink-0 flex items-center gap-1.5 w-28 justify-end">
        <span className="text-sm font-bold tabular-nums">{item.previous}</span>
        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
        <span className={cn("text-sm font-bold tabular-nums", riskCurrent.textClass)}>{item.current}</span>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-3 py-4 text-center text-xs text-muted-foreground">{message}</p>
  );
}

export function TopDomainsChange() {
  const t = useT();
  const { data: result } = useAllReports();
  const reports = result?.items ?? [];

  const { worsened, improved } = useMemo(() => {
    const deltas = computeDeltas(reports);
    return {
      worsened: deltas.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 10),
      improved: deltas.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 10),
    };
  }, [reports]);

  const noData = reports.length > 0 && worsened.length === 0 && improved.length === 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Peggiorati */}
      <Card className="shadow-none dark:ring-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="size-3.5 text-destructive" />
            {t.dash.topWorsened}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {worsened.length === 0 ? (
            <EmptyState message={noData ? t.dash.topNoChange : t.dash.topNeedScans} />
          ) : (
            <>
              <ColumnHeader />
              {worsened.map((item, i) => <DomainRow key={item.domain} rank={i + 1} item={item} />)}
            </>
          )}
        </CardContent>
      </Card>

      {/* Migliorati */}
      <Card className="shadow-none dark:ring-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TrendingDown className="size-3.5 text-green-500" />
            {t.dash.topImproved}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {improved.length === 0 ? (
            <EmptyState message={noData ? t.dash.topNoChange : t.dash.topNeedScans} />
          ) : (
            <>
              <ColumnHeader />
              {improved.map((item, i) => <DomainRow key={item.domain} rank={i + 1} item={item} />)}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
