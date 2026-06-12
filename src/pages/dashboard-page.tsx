import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, TrendingUp, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useReports, useDeleteReport } from "@/hooks/use-reports";
import { getRiskInfo, formatDate } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/shell/dashboard-skeleton";
import { UploadButton } from "@/components/shell/upload-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: result, isLoading, isError } = useReports();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const reports = result?.items ?? [];
  const filtered = search
    ? reports.filter((r) => r.domain_name.toLowerCase().includes(search.toLowerCase()))
    : reports;

  const avgRisk =
    reports?.length
      ? Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / reports.length)
      : 0;
  const highRisk = (reports ?? []).filter((r) => r.risk_score > 60).length;
  const critical  = (reports ?? []).filter((r) => r.risk_score > 80).length;

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
        Errore nel caricamento dei report.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-none dark:ring-0">
          <CardHeader><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domini analizzati</CardTitle></CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-2xl font-bold tabular-nums">{reports?.length ?? 0}</p>
            <Globe className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="shadow-none dark:ring-0">
          <CardHeader><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk score medio</CardTitle></CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className="text-2xl font-bold tabular-nums">{avgRisk}</p>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className={cn("shadow-none dark:ring-0", highRisk > 0 && "border-orange-500/40")}>
          <CardHeader><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alto rischio</CardTitle></CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className={cn("text-2xl font-bold tabular-nums", highRisk > 0 && "text-orange-500")}>{highRisk}</p>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className={cn("shadow-none dark:ring-0", critical > 0 && "border-destructive/40")}>
          <CardHeader><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Critici</CardTitle></CardHeader>
          <CardContent className="flex items-end justify-between">
            <p className={cn("text-2xl font-bold tabular-nums", critical > 0 && "text-destructive")}>{critical}</p>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Tabella domini */}
      <Card className="shadow-none dark:ring-0 gap-0">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Domini monitorati</CardTitle>
            <div className="flex items-center gap-2">
              <UploadButton />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cerca dominio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30 sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Dominio</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead className="hidden sm:table-cell">Asset</TableHead>
                <TableHead className="hidden md:table-cell">Vulnerabilità</TableHead>
                <TableHead className="hidden md:table-cell">Data Leak</TableHead>
                <TableHead className="hidden lg:table-cell">WAF</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead className="pr-6 text-right w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Nessun dominio trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((report) => {
                  const risk = getRiskInfo(report.risk_score);
                  const totalVulns =
                    Object.values(report.n_vulns.active).reduce((s, v) => s + (v ?? 0), 0) +
                    Object.values(report.n_vulns.passive).reduce((s, v) => s + (v ?? 0), 0);
                  const totalLeaks = Object.values(report.n_dataleak.total).reduce((s, v) => s + v, 0);

                  return (
                    <TableRow
                      key={report.idsummary}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/report/${report.idsummary}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{report.domain_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", risk.bgClass)}
                              style={{ width: `${report.risk_score}%` }}
                            />
                          </div>
                          <span className={cn("text-sm font-semibold tabular-nums", risk.textClass)}>
                            {report.risk_score}
                          </span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold hidden sm:inline", risk.badgeClass)}>
                            {risk.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell tabular-nums">{report.n_asset}</TableCell>
                      <TableCell className="hidden md:table-cell tabular-nums">{totalVulns}</TableCell>
                      <TableCell className="hidden md:table-cell tabular-nums">{totalLeaks.toLocaleString("it-IT")}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {report.waf.count > 0 ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">{report.waf.count} asset</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {formatDate(report.creation_date)}
                      </TableCell>
                      <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
                          disabled={isDeleting}
                          onClick={() => {
                            if (confirm(`Eliminare l'analisi di ${report.domain_name}?`)) {
                              deleteReport(report.idsummary, {
                                onSuccess: () => toast.success(`${report.domain_name} eliminato`),
                                onError: (err: Error) => toast.error(`Errore: ${err.message}`),
                              });
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
