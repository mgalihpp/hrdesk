"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PAYROLL_SERIES } from "@/lib/dashboard-data";

const config = {
  gross: { label: "Gross", color: "#2b2b46" },
  net: { label: "Net", color: "#00acca" },
};

export function PayrollChart() {
  return (
    <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Payroll Overview
            </CardTitle>
            <CardDescription className="mt-1">
              Gross vs net — last 6 months (in $k)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#2b2b46] text-white border-0"
            >
              <span className="size-2 rounded-full bg-white" /> Gross
            </Badge>
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full bg-[#e6fbff] text-[#00acca] border-0"
            >
              <span className="size-2 rounded-full bg-[#00acca]" /> Net
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={config} className="h-[240px] w-full">
          <AreaChart
            data={PAYROLL_SERIES}
            margin={{ left: 8, right: 12, top: 8 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgba(43,43,70,0.08)"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6a6a7a" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6a6a7a" }}
              width={32}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="gross"
              stroke="#2b2b46"
              fill="#2b2b46"
              fillOpacity={0.06}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#00acca"
              fill="#00acca"
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Next pay run in 2 days
          </span>
          <span className="text-xs font-semibold text-[#2b2b46]">
            Mar 15 · 3,248 employees · $845,000 gross
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
