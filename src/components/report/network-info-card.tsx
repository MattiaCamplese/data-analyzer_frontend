import { Globe, Server, Shield, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SecurityReport } from "@/types/report";

type Props = Pick<SecurityReport, "n_asset" | "unique_ipv4" | "unique_ipv6" | "n_similar_domains" | "n_cert_attivi" | "n_cert_scaduti">;

function Stat({ icon: Icon, label, value, warn }: { icon: React.ElementType; label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span className={`font-semibold tabular-nums ${warn ? "text-destructive" : ""}`}>{value}</span>
    </div>
  );
}

export function NetworkInfoCard({ n_asset, unique_ipv4, unique_ipv6, n_similar_domains, n_cert_attivi, n_cert_scaduti }: Props) {
  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle className="text-sm">Rete & Asset</CardTitle>
        <CardDescription>Infrastruttura rilevata</CardDescription>
      </CardHeader>
      <CardContent>
        <Stat icon={Server} label="Asset rilevati"     value={n_asset} />
        <Stat icon={Globe}  label="IPv4 unici"         value={unique_ipv4} />
        <Stat icon={Globe}  label="IPv6 unici"         value={unique_ipv6} />
        <Stat icon={Copy}   label="Domini simili"      value={n_similar_domains} />
        <Stat icon={Shield} label="Certificati attivi" value={n_cert_attivi} />
        <Stat icon={Shield} label="Certificati scaduti" value={n_cert_scaduti} warn={n_cert_scaduti > 0} />
      </CardContent>
    </Card>
  );
}
