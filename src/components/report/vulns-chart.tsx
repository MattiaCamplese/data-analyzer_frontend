"use client";

import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { NVulns } from "@/types/report";

interface VulnsChartProps {
  nVulns: NVulns;
}

const SEVERITY: Record<string, { label: string; color: string }> = {
  critical: { label: "Critico", color: "#ef4444" },
  high:     { label: "Alto",    color: "#f97316" },
  medium:   { label: "Medio",   color: "#eab308" },
  low:      { label: "Basso",   color: "#22c55e" },
  info:     { label: "Info",    color: "#94a3b8" },
};

const chartConfig = Object.fromEntries(
  Object.entries(SEVERITY).map(([k, v]) => [k, { label: v.label, color: v.color }]),
) satisfies ChartConfig;

function buildData(counts: Record<string, number | undefined>) {
  return Object.entries(SEVERITY)
    .map(([key, { label, color }]) => ({ name: key, label, value: counts[key] ?? 0, fill: color }))
    .filter((d) => d.value > 0);
}

export function VulnsChart({ nVulns }: VulnsChartProps) {
  const activeData = buildData(nVulns.active as Record<string, number>);
  const passiveData = buildData(nVulns.passive as Record<string, number>);
  const activeTotal = activeData.reduce((s, d) => s + d.value, 0);
  const passiveTotal = passiveData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle className="text-sm">Vulnerabilità</CardTitle>
        <CardDescription>Attive e passive per gravità</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around gap-4">
          {/* Attive */}
          <div className="flex flex-col items-center gap-1">
            <ChartContainer config={chartConfig} className="h-36 w-36">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideIndicator={false} />} />
                <Pie data={activeData} dataKey="value" innerRadius={36} outerRadius={58} paddingAngle={2}>
                  {activeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground">Attive <span className="font-semibold text-foreground">{activeTotal}</span></p>
          </div>

          {/* Passive */}
          <div className="flex flex-col items-center gap-1">
            <ChartContainer config={chartConfig} className="h-36 w-36">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" hideIndicator={false} />} />
                <Pie data={passiveData} dataKey="value" innerRadius={36} outerRadius={58} paddingAngle={2}>
                  {passiveData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground">Passive <span className="font-semibold text-foreground">{passiveTotal}</span></p>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {Object.entries(SEVERITY).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
