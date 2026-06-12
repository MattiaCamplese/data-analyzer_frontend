import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, TrendingUp, AlertTriangle, ShieldCheck, Trash2, SlidersHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { useReports, useDeleteReport } from "@/hooks/use-reports";
import { getRiskInfo, formatDate } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/shell/dashboard-skeleton";
import { UploadButton } from "@/components/shell/upload-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";

const RISK_LEVELS = [
  { key: "critical", label: "Critico",  test: (s: number) => s > 80 },
  { key: "high",     label: "Alto",     test: (s: number) => s > 60 && s <= 80 },
  { key: "medium",   label: "Medio",    test: (s: number) => s > 30 && s <= 60 },
  { key: "low",      label: "Basso",    test: (s: number) => s <= 30 },
] as const;

export default function DashboardPage() {
  const PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [riskFilters, setRiskFilters] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: result, isLoading, isError } = useReports();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const toggleRisk = (key: string) => {
    setRiskFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setPage(1);
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronsUpDown className="size-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  };

  const activeFilterCount = riskFilters.length;

  const reports = result?.items ?? [];
  let filtered = search
    ? reports.filter((r) => r.domain_name.toLowerCase().includes(search.toLowerCase()))
    : reports;

  if (riskFilters.length > 0) {
    filtered = filtered.filter((r) =>
      riskFilters.some((key) => RISK_LEVELS.find((l) => l.key === key)?.test(r.risk_score))
    );
  }

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortCol) {
        case "domain": va = a.domain_name; vb = b.domain_name; break;
        case "risk":   va = a.risk_score;  vb = b.risk_score;  break;
        case "asset":  va = a.n_asset;     vb = b.n_asset;     break;
        case "vulns":
          va = Object.values(a.n_vulns.active).reduce((s, v) => s + (v ?? 0), 0) + Object.values(a.n_vulns.passive).reduce((s, v) => s + (v ?? 0), 0);
          vb = Object.values(b.n_vulns.active).reduce((s, v) => s + (v ?? 0), 0) + Object.values(b.n_vulns.passive).reduce((s, v) => s + (v ?? 0), 0);
          break;
        case "leak":
          va = Object.values(a.n_dataleak.total).reduce((s, v) => s + v, 0);
          vb = Object.values(b.n_dataleak.total).reduce((s, v) => s + v, 0);
          break;
        case "waf":  va = a.waf.count; vb = b.waf.count; break;
        case "date": va = new Date(a.creation_date).getTime(); vb = new Date(b.creation_date).getTime(); break;
        default: return 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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
            <p className={cn("text-2xl font-bold tabular-nums", getRiskInfo(avgRisk).textClass)}>{avgRisk}</p>
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

      {/* Risk trend chart */}
      {reports.length > 0 && <RiskTrendChart reports={reports} />}

      {/* Tabella domini */}
      <Card className="shadow-none dark:ring-0 gap-0">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Domini monitorati</CardTitle>
            <div className="flex items-center gap-2">
              <UploadButton />

              {/* Filter dropdown */}
              <div className="relative" ref={filterRef}>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-8 gap-1.5", activeFilterCount > 0 && "border-primary text-primary")}
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span className="hidden sm:inline">Filtra</span>
                  {activeFilterCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {filterOpen && (
                  <div className="absolute right-0 top-9 z-50 w-56 rounded-lg border bg-popover p-3 shadow-lg text-popover-foreground">
                    {/* Risk score */}
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Risk Score
                    </p>
                    <div className="flex flex-col gap-1">
                      {RISK_LEVELS.map(({ key, label }) => (
                        <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={riskFilters.includes(key)}
                            onChange={() => toggleRisk(key)}
                            className="accent-primary"
                          />
                          {label}
                        </label>
                      ))}
                    </div>

                    {activeFilterCount > 0 && (
                      <>
                        <div className="my-2.5 border-t" />
                        <button
                          className="w-full rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => { setRiskFilters([]); setDateSort(null); setPage(1); }}
                        >
                          Rimuovi tutti i filtri
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cerca dominio..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                <TableHead className="pl-6">
                  <button onClick={() => handleSort("domain")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Dominio <SortIcon col="domain" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("risk")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Risk Score <SortIcon col="risk" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button onClick={() => handleSort("asset")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Asset <SortIcon col="asset" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button onClick={() => handleSort("vulns")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Vulnerabilità <SortIcon col="vulns" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button onClick={() => handleSort("leak")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Data Leak <SortIcon col="leak" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button onClick={() => handleSort("waf")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    WAF <SortIcon col="waf" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Data <SortIcon col="date" />
                  </button>
                </TableHead>
                <TableHead className="pr-6 text-right w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Nessun dominio trovato.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((report) => {
                  const risk = getRiskInfo(report.risk_score);
                  const totalVulns =
                    Object.values(report.n_vulns.active).reduce((s, v) => s + (v ?? 0), 0) +
                    Object.values(report.n_vulns.passive).reduce((s, v) => s + (v ?? 0), 0);
                  const totalLeaks = Object.values(report.n_dataleak.total).reduce((s, v) => s + v, 0);

                  return (
                    <TableRow
                      key={report.idsummary}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/report/${report.domain_name}`)}
                    >
                      <TableCell className="pl-6 min-w-0 max-w-35 sm:max-w-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium truncate">{report.domain_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="hidden sm:block h-1.5 w-16 overflow-hidden rounded-full bg-muted">
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            title="Confronta scansioni"
                            className="text-muted-foreground hover:text-primary hover:border-primary/50"
                            onClick={() => navigate(`/compare/${encodeURIComponent(report.domain_name)}`)}
                          >
                            <GitCompare className="size-3.5" />
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 1 && (
          <div className="border-t px-4 py-3 sm:px-6">
            {/* Mobile: prev / page info / next */}
            <div className="flex items-center justify-between sm:hidden">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Prec
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Succ →
              </Button>
            </div>

            {/* Desktop: full pagination */}
            <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} domini · pagina {currentPage} di {totalPages}</span>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={p === currentPage} onClick={() => setPage(p as number)}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
