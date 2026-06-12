import { ShieldCheck, ShieldOff, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { WAF, CDN } from "@/types/report";
import { useT } from "@/hooks/use-t";

interface WafCdnCardProps {
  waf: WAF;
  cdn: CDN;
}

function Service({ label, count, assets, icon: Icon, notDetectedLabel, assetLabel }: {
  label: string; count: number; assets: string[]; icon: React.ElementType;
  notDetectedLabel: string; assetLabel: string;
}) {
  const active = count > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-3.5" />
          <span className="font-medium uppercase tracking-wide text-xs">{label}</span>
        </div>
        {active ? (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
            {count} {assetLabel}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{notDetectedLabel}</span>
        )}
      </div>
      {active && assets.length > 0 && (
        <div className="rounded-md border bg-muted/40">
          {assets.map((a, i) => (
            <div key={a} className="flex items-center gap-2 border-b last:border-0 px-2 py-1 print:break-inside-avoid">
              <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground w-5 text-right">{i + 1}</span>
              <span className="font-mono text-[11px] text-muted-foreground break-all">{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WafCdnCard({ waf, cdn }: WafCdnCardProps) {
  const t = useT();
  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle className="text-sm">{t.wafCdn.title}</CardTitle>
        <CardDescription>{t.wafCdn.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Service
          label={t.wafCdn.waf}
          count={waf.count}
          assets={waf.assets}
          icon={waf.count > 0 ? ShieldCheck : ShieldOff}
          notDetectedLabel={t.wafCdn.notDetected}
          assetLabel={t.wafCdn.asset}
        />
        <div className="border-t" />
        <Service
          label={t.wafCdn.cdn}
          count={cdn.count}
          assets={cdn.assets}
          icon={Wifi}
          notDetectedLabel={t.wafCdn.notDetected}
          assetLabel={t.wafCdn.asset}
        />
      </CardContent>
    </Card>
  );
}
