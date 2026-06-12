import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { EmailSecurity } from "@/types/report";
import { useT } from "@/hooks/use-t";

interface EmailSecurityCardProps {
  emailSecurity: EmailSecurity;
}

function StatusRow({ label, ok, value, okLabel, riskLabel }: {
  label: string; ok: boolean; value?: string; okLabel: string; riskLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <div className="flex items-center gap-1">
          {ok ? (
            <CheckCircle2 className="size-3.5 text-green-500" />
          ) : (
            <XCircle className="size-3.5 text-destructive" />
          )}
          <span className={ok ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
            {ok ? okLabel : riskLabel}
          </span>
        </div>
        {value && (
          <span className="max-w-44 truncate font-mono text-xs text-muted-foreground">{value}</span>
        )}
      </div>
    </div>
  );
}

export function EmailSecurityCard({ emailSecurity }: EmailSecurityCardProps) {
  const t = useT();
  const isSpoofable = !!emailSecurity.spoofable && !/not possible/i.test(emailSecurity.spoofable);
  const dmarcOk = emailSecurity.dmarc_policy !== "none" && !!emailSecurity.dmarc_policy;
  const blacklistOk = emailSecurity.blacklist_detections === 0;

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">{t.emailSec.title}</CardTitle>
          {isSpoofable && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-3" />
              {t.emailSec.spoofing}
            </span>
          )}
        </div>
        <CardDescription>{t.emailSec.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusRow
          label={t.emailSec.dmarc}
          ok={dmarcOk}
          value={dmarcOk ? `policy: ${emailSecurity.dmarc_policy}` : undefined}
          okLabel={t.emailSec.ok}
          riskLabel={t.emailSec.risk}
        />
        <StatusRow
          label={t.emailSec.spoofing}
          ok={!isSpoofable}
          value={isSpoofable ? emailSecurity.spoofable : undefined}
          okLabel={t.emailSec.ok}
          riskLabel={t.emailSec.risk}
        />
        <StatusRow
          label={t.emailSec.blacklist}
          ok={blacklistOk}
          value={`${emailSecurity.blacklist_detections} / ${emailSecurity.blacklist_total_list}`}
          okLabel={t.emailSec.ok}
          riskLabel={t.emailSec.risk}
        />
      </CardContent>
    </Card>
  );
}
