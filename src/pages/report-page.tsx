import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useRef } from "react";
import Markdown from "react-markdown";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, Globe, Calendar, RefreshCw, Download, History, GitCompare, ChevronDown } from "lucide-react";
import { useReport, useReportHistory } from "@/hooks/use-reports";
import { getRiskInfo, formatDate } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/shell/dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskGauge } from "@/components/report/risk-gauge";
import { ScoreCard } from "@/components/report/score-card";
import { PortsChart } from "@/components/report/ports-chart";
import { VulnsChart } from "@/components/report/vulns-chart";
import { DataLeakChart } from "@/components/report/dataleak-chart";
import { EmailSecurityCard } from "@/components/report/email-security-card";
import { NetworkInfoCard } from "@/components/report/network-info-card";
import { WafCdnCard } from "@/components/report/waf-cdn-card";

const SCORE_CARDS = [
  { key: "servizi_esposti_score",      label: "Servizi Esposti" },
  { key: "dataleak_score",             label: "Data Leak" },
  { key: "rapporto_leak_email_score",  label: "Leak Email" },
  { key: "spoofing_score",             label: "Email Spoofing" },
  { key: "open_ports_score",           label: "Porte Aperte" },
  { key: "blacklist_score",            label: "Blacklist" },
  { key: "vulnerability_score_active",  label: "Vuln. Attive" },
  { key: "vulnerability_score_passive", label: "Vuln. Passive" },
  { key: "certificate_score",          label: "Certificati SSL" },
] as const;

export default function ReportPage() {
  const { id: domain } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get("scan") ?? undefined;

  const { data: report, isLoading, isError } = useReport(domain ?? "", scanId);
  const { data: historyData } = useReportHistory(domain ?? "");

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: report ? `SecureAnalyzer - ${report.domain_name}` : "SecureAnalyzer Report",
    pageStyle: `
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        .no-print { display: none !important; }
        [data-slot="card"] { break-inside: avoid; page-break-inside: avoid; }
        .print-section { break-inside: avoid; page-break-inside: avoid; }
      }
    `,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !report) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">Report non trovato.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Torna alla dashboard
        </Link>
      </div>
    );
  }

  const risk = getRiskInfo(report.risk_score);
  const history = historyData?.items ?? [];
  const hasHistory = history.length > 1;
  const historyLoaded = historyData !== undefined;

  const currentScanId = scanId ?? history[0]?.idsummary ?? report.idsummary;

  function handleVersionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value;
    if (selected === history[0]?.idsummary) {
      setSearchParams({});
    } else {
      setSearchParams({ scan: selected });
    }
  }

  function handleCompare() {
    // Pass current scan as A (attuale, blu), compare page auto-picks the older one as B (base)
    navigate(`/compare/${encodeURIComponent(domain ?? "")}?a=${currentScanId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header — no-print */}
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        {/* Left: breadcrumb */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <span className="font-semibold">{report.domain_name}</span>
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", risk.badgeClass)}>
            {risk.label}
          </span>
        </div>

        {/* Right: version selector + actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Version selector — shown when there are multiple scans */}
          {hasHistory ? (
            <div className="flex items-center gap-1.5">
              <History className="size-3.5 text-muted-foreground" />
              <div className="relative">
                <select
                  value={currentScanId}
                  onChange={handleVersionChange}
                  className="h-8 appearance-none rounded-md border bg-background pl-3 pr-7 text-xs font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring/30 cursor-pointer"
                >
                  {history.map((item, idx) => (
                    <option key={item.idsummary} value={item.idsummary}>
                      {idx === 0 ? "Ultimo: " : ""}{formatDate(item.creation_date)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> {formatDate(report.creation_date)}
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="size-3" /> {formatDate(report.last_edit)}
              </span>
            </div>
          )}

          {/* Compare — always visible; disabled until history is loaded and has ≥2 scans */}
          <button
            onClick={handleCompare}
            disabled={historyLoaded && !hasHistory}
            title={historyLoaded && !hasHistory ? "Carica almeno 2 scansioni per confrontare" : "Confronta scansioni storiche"}
            className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GitCompare className="size-3.5" />
            Confronta
          </button>

          {/* PDF export */}
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Download className="size-3.5" />
            Esporta PDF
          </button>
        </div>
      </div>

      {/* Historical scan banner */}
      {scanId && (
        <div className="no-print flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs">
          <span className="text-amber-700 dark:text-amber-400">
            Stai visualizzando uno snapshot storico del {formatDate(report.creation_date)}
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Vai all'ultimo →
          </button>
        </div>
      )}

      <div ref={printRef} className="flex flex-col gap-6">

        {/* Gauge + Sommario */}
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <RiskGauge score={report.risk_score} domainName={report.domain_name} />
          <Card className="shadow-none dark:ring-0">
            <CardHeader>
              <CardTitle className="text-sm">Sommario</CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown
                components={{
                  p:      ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  ul:     ({ children }) => <ul className="mt-1 mb-2 space-y-0.5 pl-4 text-sm list-disc">{children}</ul>,
                  li:     ({ children }) => <li className="text-muted-foreground leading-relaxed">{children}</li>,
                }}
              >
                {report.summary_text_en}
              </Markdown>
            </CardContent>
          </Card>
        </div>

        {/* Score cards */}
        <div className="print-section">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Punteggi di Rischio
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 print:grid-cols-3">
            {SCORE_CARDS.map(({ key, label }) => (
              <ScoreCard key={key} label={label} score={report[key] as number} />
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="print-section">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Analisi Dettagliata
          </p>
          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-1">
            <PortsChart nPort={report.n_port} />
            <VulnsChart nVulns={report.n_vulns} />
            <DataLeakChart nDataleak={report.n_dataleak} />
          </div>
        </div>

        {/* Technical details */}
        <div className="print-section">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dettagli Tecnici
          </p>
          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-1">
            <EmailSecurityCard emailSecurity={report.email_security} />
            <NetworkInfoCard
              n_asset={report.n_asset}
              unique_ipv4={report.unique_ipv4}
              unique_ipv6={report.unique_ipv6}
              n_similar_domains={report.n_similar_domains}
              n_cert_attivi={report.n_cert_attivi}
              n_cert_scaduti={report.n_cert_scaduti}
            />
            <WafCdnCard waf={report.waf} cdn={report.cdn} />
          </div>
        </div>

      </div>{/* end printRef */}
    </div>
  );
}
