"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface PortsChartProps {
  nPort: Record<string, { n: number }>;
}

const chartConfig = {
  count: { label: "Esposizioni", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PortsChart({ nPort }: PortsChartProps) {
  const data = Object.entries(nPort)
    .sort((a, b) => b[1].n - a[1].n)
    .map(([port, val]) => ({ port: `:${port}`, count: val.n }));

  return (
    <Card className="shadow-none dark:ring-0">
      <CardHeader>
        <CardTitle className="text-sm">Porte Aperte</CardTitle>
        <CardDescription>Numero di esposizioni per porta</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid horizontal={false} className="stroke-border" />
            <XAxis type="number" axisLine={false} tickLine={false} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="port"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={42}
              className="font-mono text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
