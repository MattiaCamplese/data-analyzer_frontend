"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { NDataleak } from "@/types/report";

interface DataLeakChartProps {
  nDataleak: NDataleak;
}

const LEAK_META: Record<string, { label: string; color: string }> = {
  domain_stealer:    { label: "Domain stealer",    color: "var(--chart-5)" },
  potential_stealer: { label: "Potential stealer",  color: "var(--chart-2)" },
  other_stealer:     { label: "Other stealer",      color: "var(--chart-4)" },
  vip:               { label: "VIP",                color: "var(--chart-1)" },
  general_leak:      { label: "General leak",       color: "var(--chart-3)" },
};

const chartConfig = Object.fromEntries(
  Object.entries(LEAK_META).map(([k, v]) => [k, { label: v.label, color: v.color }]),
) satisfies ChartConfig;

export function DataLeakChart({ nDataleak }: DataLeakChartProps) {
  const unresolved = nDataleak.unresolved;
  const totalUnresolved = Object.values(unresolved).reduce((s, v) => s + v, 0);

  const data = Object.entries(unresolved)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      name: key,
      label: LEAK_META[key]?.label ?? key,
      value,
      color: LEAK_META[key]?.color ?? "var(--chart-1)",
    }));

  const totalAll = Object.values(nDataleak.total).reduce((s, v) => s + v, 0);

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle className="text-sm">Data Leak</CardTitle>
        <CardDescription>
          {totalAll > 0
            ? `${totalAll.toLocaleString("it-IT")} totali · ${totalUnresolved.toLocaleString("it-IT")} non risolti`
            : "Nessun data leak rilevato"}
          {nDataleak.enumeration > 0 && ` · ${nDataleak.enumeration} enumerazione`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nessun dato</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid horizontal={false} className="stroke-border" />
              <XAxis type="number" axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={110}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
