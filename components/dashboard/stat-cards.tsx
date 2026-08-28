import { Briefcase, Clock3, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { moneyToMajor } from "@/lib/money";
import type { ReportingOverview } from "@/lib/reporting/types";
import { cn } from "@/lib/utils";

type StatDef = {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: "users" | "wallet" | "clock" | "briefcase";
  accent: string;
};

const ICONS = {
  users: Users,
  wallet: Wallet,
  clock: Clock3,
  briefcase: Briefcase,
} as const;

function toStats(overview: ReportingOverview): StatDef[] {
  return [
    {
      id: "employees",
      label: "Total employees",
      value: String(overview.headcount.total),
      sub: `${overview.headcount.active} active · ${overview.headcount.onLeave} on leave`,
      icon: "users",
      accent: "bg-[#eef2ff]",
    },
    {
      id: "payroll",
      label: "Payroll gross",
      value: `$${moneyToMajor(overview.payroll.gross)}`,
      sub: `${overview.payroll.payRunCount} pay runs · ${overview.payroll.payslipCount} payslips`,
      icon: "wallet",
      accent: "bg-[#e6fbff]",
    },
    {
      id: "attendance",
      label: "Approved hours",
      value: `${overview.attendance.approvedHours}h`,
      sub: `${overview.attendance.approved} approved · ${overview.attendance.pending} pending`,
      icon: "clock",
      accent: "bg-[#e6fff0]",
    },
    {
      id: "pipeline",
      label: "Candidates",
      value: String(overview.pipeline.totalCandidates),
      sub: `${overview.pipeline.openJobs} open jobs`,
      icon: "briefcase",
      accent: "bg-[#fff6e6]",
    },
  ];
}

export function StatCards({ overview }: { overview: ReportingOverview }) {
  const stats = toStats(overview);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <Card
            key={s.id}
            className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    s.accent,
                  )}
                >
                  <Icon className="size-5 text-[#2b2b46]" />
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-widest text-muted-foreground">
                {s.label.toUpperCase()}
              </p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#2b2b46]">
                {s.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
