"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PipelineSummary } from "@/lib/reporting/types";

const config = {
  count: { label: "Candidates", color: "#2b2b46" },
};

export function PipelineChart({ pipeline }: { pipeline: PipelineSummary }) {
  const data = Object.entries(pipeline.byStage).map(([stage, count]) => ({
    stage,
    count,
  }));

  if (data.length === 0) {
    return (
      <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            Recruitment Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pipeline data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">
          Recruitment Pipeline
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {pipeline.totalCandidates} candidates · {pipeline.openJobs} open jobs
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={data} margin={{ left: 8, right: 12, top: 8 }}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgba(43,43,70,0.08)"
            />
            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6a6a7a" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6a6a7a" }}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="#2b2b46" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
