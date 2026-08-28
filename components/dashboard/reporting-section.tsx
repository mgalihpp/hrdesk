"use client";

import { useMemo, useState } from "react";
import { PayrollChart } from "@/components/dashboard/payroll-chart";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  PayrollSeriesPoint,
  ReportingOverview,
} from "@/lib/reporting/types";

export function ReportingSection({
  overview,
  series,
  initialFrom,
  initialTo,
  title = "Overview",
  description = "Welcome back. Here is what is happening with your team today.",
}: {
  overview: ReportingOverview;
  series: PayrollSeriesPoint[];
  initialFrom?: string;
  initialTo?: string;
  title?: string;
  description?: string;
}) {
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");

  const filteredSeries = useMemo(() => {
    if (!from && !to) return series;
    return series.filter((p) => {
      if (from && p.periodStart < from) return false;
      if (to && p.periodEnd > to) return false;
      return true;
    });
  }, [series, from, to]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return qs ? `/api/reporting/export?${qs}` : "/api/reporting/export";
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="report-from"
              className="text-xs font-medium text-muted-foreground"
            >
              From
            </label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="report-to"
              className="text-xs font-medium text-muted-foreground"
            >
              To
            </label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <a href={exportHref} download>
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <StatCards overview={overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PayrollChart series={filteredSeries} />
        <PipelineChart pipeline={overview.pipeline} />
      </div>
    </div>
  );
}
