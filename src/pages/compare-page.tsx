import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Globe, ChevronDown, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { useReport, useReportHistory } from "@/hooks/use-reports";
import { getRiskInfo, formatDate } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SecurityReport } from "@/types/report";
import type { EmailSecurity } from "@/types/report";
import { useT } from "@/hooks/use-t";

// ── palette ────────────────────────────────────────────────────────────────
const CLR_A = "#3b82f6"; // blue   — A = attuale (corrente)
const CLR_B = "#a855f7"; // purple — B = precedente (base)

// ── helpers ────────────────────────────────────────────────────────────────
function totalVulns(r: SecurityReport) {
  return (
    Object.values(r.n_vulns.active).reduce((s, v) => s + (v ?? 0), 0) +
    Object.values(r.n_vulns.passive).reduce((s, v) => s + (v ?? 0), 0)
  );
}
function totalLeaks(r: SecurityReport) {
  return Object.values(r.n_dataleak.total).reduce((s, v) => s + v, 0);
}

// ── delta badge ────────────────────────────────────────────────────────────
function DeltaChip({ a, b, higherIsBad = true }: { a: number; b: number; higherIsBad?: boolean }) {
  const t = useT();
  const diff = a - b;
  if (diff === 0) return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="size-3" /> {t.cmp.unchanged}</span>;
  const improved = higherIsBad ? diff < 0 : diff > 0;
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-semibold", improved ? "text-green-500" : "text-red-500")}>
      <Icon className="size-3" />
      {diff > 0 ? "+" : ""}{diff}
      <span className="font-normal">{improved ? t.cmp.improved : t.cmp.worsened}</span>
    </span>
  );
}

// ── compare bar card ───────────────────────────────────────────────────────
interface CmpCardProps {
  label: string;
  a: number;
  b: number;
  higherIsBad?: boolean;
  suffix?: string;
}
function CmpCard({ label, a, b, higherIsBad = true, suffix = "" }: CmpCardProps) {
  const max = Math.max(a, b, 1);
  return (
    <Card className="shadow-none dark:ring-0">
      <CardContent className="pt-4 pb-4 px-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
        <div className="space-y-2.5">
          {[{ val: a, color: CLR_A, lbl: "A" }, { val: b, color: CLR_B, lbl: "B" }].map(({ val, color, lbl }) => (
            <div key={lbl}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium" style={{ color }}>{lbl}</span>
                <span className="tabular-nums font-semibold">{val.toLocaleString("it-IT")}{suffix}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${(val / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <DeltaChip a={a} b={b} higherIsBad={higherIsBad} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── email security compare ─────────────────────────────────────────────────
function dmarcLevel(policy: string) {
  return policy === "reject" ? 3 : policy === "quarantine" ? 2 : 1;
}
function dmarcColor(policy: string) {
  return policy === "reject" ? "#22c55e" : policy === "quarantine" ? "#eab308" : "#ef4444";
}
function dmarcBadgeClass(policy: string) {
  return policy === "reject"
    ? "bg-green-500/10 text-green-600 dark:text-green-400"
    : policy === "quarantine"
    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    : "bg-red-500/10 text-red-600 dark:text-red-400";
}

function DmarcBar({ policy }: { policy: string }) {
  const t = useT();
  const pct = (dmarcLevel(policy) / 3) * 100;
  const color = dmarcColor(policy);
  const label = policy === "reject" ? t.cmp.dmarcMax : policy === "quarantine" ? t.cmp.dmarcPartial : t.cmp.dmarcNone;
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs font-semibold", dmarcBadgeClass(policy))}>
        {policy || "none"}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SpoofBadge({ value }: { value: string }) {
  const t = useT();
  const bad = !!value && !/not possible/i.test(value);
  const Icon = bad ? ShieldX : ShieldCheck;
  return (
    <span className={cn("inline-flex items-center gap-1 w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
      bad ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400"
    )}>
      <Icon className="size-3" />
      {bad ? t.cmp.spoofPossible : t.cmp.spoofProtected}
    </span>
  );
}

function BlacklistBar({ detections, total }: { detections: number; total: number }) {
  const pct = total > 0 ? (detections / total) * 100 : 0;
  const color = detections === 0 ? "#22c55e" : detections <= 3 ? "#eab308" : "#ef4444";
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {detections} <span className="text-xs font-normal text-muted-foreground">/ {total}</span>
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

interface EmailCmpProps {
  a: EmailSecurity; b: EmailSecurity;
  dateA: string;   dateB: string;
}

function EmailSecurityCompare({ a, b, dateA, dateB }: EmailCmpProps) {
  const t = useT();
  const spoofA = !!a.spoofable && !/not possible/i.test(a.spoofable);
  const spoofB = !!b.spoofable && !/not possible/i.test(b.spoofable);

  const lvlA = dmarcLevel(a.dmarc_policy);
  const lvlB = dmarcLevel(b.dmarc_policy);
  const dmarcDiff = lvlA - lvlB;

  const blDiff = a.blacklist_detections - b.blacklist_detections;

  const listA = new Set(a.blacklist_detected_list);
  const listB = new Set(b.blacklist_detected_list);
  const newDetections  = [...listA].filter((x) => !listB.has(x));
  const resolved       = [...listB].filter((x) => !listA.has(x));
  const persistent     = [...listA].filter((x) => listB.has(x));

  const ROW = "border-b last:border-0";
  const CELL = "py-3 align-top";

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t.cmp.emailTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2 pl-4 text-left text-muted-foreground w-28">{t.cmp.metrica}</th>
                <th className="py-2 text-left" style={{ color: CLR_A }}>A · {formatDate(dateA)}</th>
                <th className="py-2 text-left" style={{ color: CLR_B }}>B · {formatDate(dateB)}</th>
                <th className="py-2 pr-4 text-right text-muted-foreground">{t.cmp.variazione}</th>
              </tr>
            </thead>
            <tbody>
              {/* Spoofing */}
              <tr className={ROW}>
                <td className={cn(CELL, "pl-4 text-xs font-medium text-muted-foreground")}>{t.cmp.spoofing}</td>
                <td className={CELL}><SpoofBadge value={a.spoofable} /></td>
                <td className={CELL}><SpoofBadge value={b.spoofable} /></td>
                <td className={cn(CELL, "pr-4 text-right")}>
                  {spoofA === spoofB ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Minus className="size-3" /> {t.cmp.unchanged}</span>
                  ) : !spoofA && spoofB ? (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-green-500"><ShieldCheck className="size-3" /> {t.cmp.resolved}</span>
                  ) : (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-red-500"><ShieldAlert className="size-3" /> {t.cmp.worsened}</span>
                  )}
                </td>
              </tr>

              {/* DMARC */}
              <tr className={ROW}>
                <td className={cn(CELL, "pl-4 text-xs font-medium text-muted-foreground")}>{t.cmp.dmarc}</td>
                <td className={cn(CELL, "pr-6")}><DmarcBar policy={a.dmarc_policy} /></td>
                <td className={cn(CELL, "pr-6")}><DmarcBar policy={b.dmarc_policy} /></td>
                <td className={cn(CELL, "pr-4 text-right")}>
                  {dmarcDiff === 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Minus className="size-3" /> {t.cmp.unchanged}</span>
                  ) : dmarcDiff > 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-green-500"><TrendingDown className="size-3" /> {t.cmp.improved}</span>
                  ) : (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-red-500"><TrendingUp className="size-3" /> {t.cmp.worsened}</span>
                  )}
                </td>
              </tr>

              {/* Blacklist count */}
              <tr className={ROW}>
                <td className={cn(CELL, "pl-4 text-xs font-medium text-muted-foreground")}>{t.cmp.blacklist}</td>
                <td className={cn(CELL, "pr-6")}><BlacklistBar detections={a.blacklist_detections} total={a.blacklist_total_list} /></td>
                <td className={cn(CELL, "pr-6")}><BlacklistBar detections={b.blacklist_detections} total={b.blacklist_total_list} /></td>
                <td className={cn(CELL, "pr-4 text-right")}>
                  {blDiff === 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Minus className="size-3" /> {t.cmp.unchanged}</span>
                  ) : blDiff < 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-green-500"><TrendingDown className="size-3" /> {blDiff}</span>
                  ) : (
                    <span className="flex items-center justify-end gap-1 text-xs font-semibold text-red-500"><TrendingUp className="size-3" /> +{blDiff}</span>
                  )}
                </td>
              </tr>

              {/* Blacklist list diff */}
              {(newDetections.length > 0 || resolved.length > 0 || persistent.length > 0) && (
                <tr>
                  <td className={cn(CELL, "pl-4 text-xs font-medium text-muted-foreground")}>{t.cmp.lists}</td>
                  <td colSpan={3} className={cn(CELL, "pr-4")}>
                    <div className="flex flex-wrap gap-1.5">
                      {newDetections.map((l) => (
                        <span key={l} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                          +{l}
                        </span>
                      ))}
                      {persistent.map((l) => (
                        <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {l}
                        </span>
                      ))}
                      {resolved.map((l) => (
                        <span key={l} className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400 line-through opacity-60">
                          {l}
                        </span>
                      ))}
                    </div>
                    {newDetections.length === 0 && resolved.length === 0 && persistent.length === 0 && (
                      <span className="text-xs text-muted-foreground">{t.cmp.noBlacklist}</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── version selector ───────────────────────────────────────────────────────
interface VSelProps { items: SecurityReport[]; value: string; onChange: (id: string) => void; label: string; color: string; exclude?: string }
function VersionSelect({ items, value, onChange, label, color, exclude }: VSelProps) {
  const t = useT();
  const available = items.filter((i) => i.idsummary !== exclude);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-md border bg-background pl-3 pr-8 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring/30 cursor-pointer"
          style={{ borderColor: value ? color : undefined }}
        >
          <option value="" disabled>{t.cmp.selectScan}</option>
          {available.map((item) => (
            <option key={item.idsummary} value={item.idsummary}>
              {formatDate(item.creation_date)} — {t.cmp.scoreLabel} {item.risk_score}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

// ── radar tooltip ──────────────────────────────────────────────────────────
interface RTProps { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }
function RadarTooltip({ active, payload, label }: RTProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs text-popover-foreground">
      <p className="mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-bold tabular-nums">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── bar tooltip ────────────────────────────────────────────────────────────
interface BTProps { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }
function BarTooltip({ active, payload, label }: BTProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs text-popover-foreground">
      <p className="mb-1.5 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-bold tabular-nums">{p.value.toLocaleString("it-IT")}</span>
        </p>
      ))}
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const t = useT();
  const { domain } = useParams<{ domain: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const decodedDomain = decodeURIComponent(domain ?? "");

  const { data: historyData, isLoading: historyLoading } = useReportHistory(decodedDomain);
  const history = historyData?.items ?? [];

  const paramA = searchParams.get("a") ?? "";
  const paramB = searchParams.get("b") ?? "";
  const resolvedA = paramA || history[0]?.idsummary || "";
  const resolvedB = paramB || history.find((h) => h.idsummary !== resolvedA)?.idsummary || "";

  const { data: reportA, isLoading: loadingA } = useReport(decodedDomain, resolvedA || undefined);
  const { data: reportB, isLoading: loadingB } = useReport(decodedDomain, resolvedB || undefined);

  function setA(id: string) { setSearchParams({ a: id, b: resolvedB }); }
  function setB(id: string) { setSearchParams({ a: resolvedA, b: id }); }

  const isLoading = historyLoading || loadingA || loadingB;

  // ── not enough history ──────────────────────────────────────────────────
  if (!historyLoading && history.length < 2) {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumb domain={decodedDomain} />
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t.cmp.needScans(decodedDomain)}
        </div>
      </div>
    );
  }

  // ── chart data ──────────────────────────────────────────────────────────
  const radarData = (reportA && reportB) ? [
    { subject: "Servizi",     A: reportA.servizi_esposti_score,      B: reportB.servizi_esposti_score },
    { subject: "Data Leak",   A: reportA.dataleak_score,             B: reportB.dataleak_score },
    { subject: "Leak Email",  A: reportA.rapporto_leak_email_score,  B: reportB.rapporto_leak_email_score },
    { subject: "Spoofing",    A: reportA.spoofing_score,             B: reportB.spoofing_score },
    { subject: "Porte",       A: reportA.open_ports_score,           B: reportB.open_ports_score },
    { subject: "Blacklist",   A: reportA.blacklist_score,            B: reportB.blacklist_score },
    { subject: "Vuln. Att.",  A: reportA.vulnerability_score_active, B: reportB.vulnerability_score_active },
    { subject: "Vuln. Pass.", A: reportA.vulnerability_score_passive,B: reportB.vulnerability_score_passive },
    { subject: "SSL/Cert",    A: reportA.certificate_score,          B: reportB.certificate_score },
  ] : [];

  const vulnBarData = (reportA && reportB) ? [
    { name: t.cmp.vulnCritAct, A: reportA.n_vulns.active.critical ?? 0, B: reportB.n_vulns.active.critical ?? 0 },
    { name: t.cmp.vulnHighAct, A: reportA.n_vulns.active.high ?? 0,     B: reportB.n_vulns.active.high ?? 0 },
    { name: t.cmp.vulnMedAct,  A: reportA.n_vulns.active.medium ?? 0,   B: reportB.n_vulns.active.medium ?? 0 },
    { name: t.cmp.vulnHighPass,A: reportA.n_vulns.passive.high ?? 0,    B: reportB.n_vulns.passive.high ?? 0 },
    { name: t.cmp.vulnMedPass, A: reportA.n_vulns.passive.medium ?? 0,  B: reportB.n_vulns.passive.medium ?? 0 },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb domain={decodedDomain} />

      {/* Scan selectors */}
      <Card className="shadow-none dark:ring-0">
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <VersionSelect items={history} value={resolvedA} onChange={setA} label={t.cmp.labelA} color={CLR_A} exclude={resolvedB} />
            <div className="flex items-end justify-center pb-1.5 text-lg font-light text-muted-foreground">{t.cmp.vs}</div>
            <VersionSelect items={history} value={resolvedB} onChange={setB} label={t.cmp.labelB} color={CLR_B} exclude={resolvedA} />
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground animate-pulse">
          {t.cmp.loading}
        </div>
      )}

      {!isLoading && reportA && reportB && (() => {
        const riskA = getRiskInfo(reportA.risk_score);
        const riskB = getRiskInfo(reportB.risk_score);
        const scoreDiff = reportA.risk_score - reportB.risk_score;
        const scoreImproved = scoreDiff < 0;

        return (
          <>
            {/* ── Hero: risk scores (full width) ── */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <Card className="shadow-none dark:ring-0" style={{ borderColor: CLR_A + "66" }}>
                <CardContent className="flex flex-col items-center gap-1 py-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CLR_A }}>{t.cmp.tagA} · {formatDate(reportA.creation_date)}</span>
                  <span className={cn("text-6xl font-black tabular-nums", riskA.textClass)}>{reportA.risk_score}</span>
                  <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", riskA.badgeClass)}>{riskA.label}</span>
                </CardContent>
              </Card>
              <div className="flex flex-col items-center gap-1">
                {scoreImproved ? <TrendingDown className="size-8 text-green-500" /> : scoreDiff > 0 ? <TrendingUp className="size-8 text-red-500" /> : <Minus className="size-8 text-muted-foreground" />}
                <span className={cn("text-xl font-bold tabular-nums", scoreImproved ? "text-green-500" : scoreDiff !== 0 ? "text-red-500" : "text-muted-foreground")}>
                  {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                </span>
                <span className="text-[10px] text-muted-foreground text-center">
                  {scoreImproved ? t.cmp.improved : scoreDiff > 0 ? t.cmp.worsened : t.cmp.unchanged}
                </span>
              </div>
              <Card className="shadow-none dark:ring-0" style={{ borderColor: CLR_B + "66" }}>
                <CardContent className="flex flex-col items-center gap-1 py-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CLR_B }}>{t.cmp.tagB} · {formatDate(reportB.creation_date)}</span>
                  <span className={cn("text-6xl font-black tabular-nums", riskB.textClass)}>{reportB.risk_score}</span>
                  <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", riskB.badgeClass)}>{riskB.label}</span>
                </CardContent>
              </Card>
            </div>

            {/* ── Radar + Email security side by side ── */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="shadow-none dark:ring-0">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.cmp.radarTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                        <Radar name={`A — ${formatDate(reportA.creation_date)}`} dataKey="A" stroke={CLR_A} fill={CLR_A} fillOpacity={0.2} strokeWidth={2} />
                        <Radar name={`B — ${formatDate(reportB.creation_date)}`} dataKey="B" stroke={CLR_B} fill={CLR_B} fillOpacity={0.2} strokeWidth={2} />
                        <Tooltip content={<RadarTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <EmailSecurityCompare
                a={reportA.email_security}
                b={reportB.email_security}
                dateA={reportA.creation_date}
                dateB={reportB.creation_date}
              />
            </div>

            {/* ── Vulnerability bar chart ── */}
            <Card className="shadow-none dark:ring-0">
              <CardHeader className="pb-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.cmp.vulnTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vulnBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar name={`A — ${formatDate(reportA.creation_date)}`} dataKey="A" fill={CLR_A} radius={[3, 3, 0, 0]}>
                        {vulnBarData.map((_, i) => <Cell key={i} fill={CLR_A} fillOpacity={0.85} />)}
                      </Bar>
                      <Bar name={`B — ${formatDate(reportB.creation_date)}`} dataKey="B" fill={CLR_B} radius={[3, 3, 0, 0]}>
                        {vulnBarData.map((_, i) => <Cell key={i} fill={CLR_B} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ── Metric compare cards ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.cmp.metricsTitle}</p>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                <CmpCard label={t.cmp.mVulnTotal}   a={totalVulns(reportA)}   b={totalVulns(reportB)}   higherIsBad />
                <CmpCard label={t.cmp.mLeakTotal}    a={totalLeaks(reportA)}   b={totalLeaks(reportB)}   higherIsBad />
                <CmpCard label={t.cmp.mPotStealer}   a={reportA.n_dataleak.total.potential_stealer} b={reportB.n_dataleak.total.potential_stealer} higherIsBad />
                <CmpCard label={t.cmp.mCertExp}      a={reportA.n_cert_scaduti} b={reportB.n_cert_scaduti} higherIsBad />
                <CmpCard label={t.cmp.mCertAct}      a={reportA.n_cert_attivi}  b={reportB.n_cert_attivi}  higherIsBad={false} />
                <CmpCard label={t.cmp.mAsset}         a={reportA.n_asset}        b={reportB.n_asset}        higherIsBad={false} />
                <CmpCard label={t.cmp.mIpv4}          a={reportA.unique_ipv4}   b={reportB.unique_ipv4}   higherIsBad={false} />
              </div>
            </div>

          </>
        );
      })()}
    </div>
  );
}

// ── breadcrumb ─────────────────────────────────────────────────────────────
function Breadcrumb({ domain }: { domain: string }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to={`/report/${encodeURIComponent(domain)}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Report
      </Link>
      <span className="text-muted-foreground">/</span>
      <Globe className="size-4 text-muted-foreground" />
      <span className="font-semibold">{domain}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-sm font-medium">{t.cmp.title}</span>
    </div>
  );
}
