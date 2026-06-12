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
        <div className="flex flex-wrap gap-1">
          {assets.slice(0, 4).map((a) => (
            <span key={a} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground truncate max-w-30">{a}</span>
          ))}
          {assets.length > 4 && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">+{assets.length - 4}</span>
          )}
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
