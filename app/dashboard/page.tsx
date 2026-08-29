import { headers } from "next/headers";
import Link from "next/link";
import { AttendanceCard } from "@/components/dashboard/attendance-card";
import {
  RecentActivity,
  RecruitmentOverview,
  UpcomingEvents,
} from "@/components/dashboard/bottom-cards";
import { EmployeeTable } from "@/components/dashboard/employee-table";
import { NextPayroll } from "@/components/dashboard/next-payroll";
import { PayrunTable } from "@/components/dashboard/payrun-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ReportingSection } from "@/components/dashboard/reporting-section";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { reportingRepo } from "@/server/repo/reporting";
import { CreateWorkspacePrompt } from "./_components/create-workspace-prompt";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const h = await headers();
  const session = await getShellSession(h);
  const params = searchParams ? await searchParams : {};

  let from: string | undefined;
  let to: string | undefined;
  if (params.from && dateRegex.test(params.from)) from = params.from;
  if (params.to && dateRegex.test(params.to)) to = params.to;
  const range = from && to && from <= to ? { from, to } : undefined;

  if (session.kind === "noSession") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to view live reporting data.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            You are not signed in. Please sign in to continue.
          </p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (session.kind === "noOrg") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Welcome back. Here is what is happening with your team today.
          </p>
        </div>
        <CreateWorkspacePrompt
          name={session.user.name}
          email={session.user.email}
        />
      </div>
    );
  }

  const tenantId = session.user.tenantId as TenantId;
  const repo = reportingRepo(prisma, tenantId);
  const [overview, series] = await Promise.all([
    repo.overview(range),
    repo.getPayrollSeries(range),
  ]);

  return (
    <div className="space-y-6">
      <ReportingSection
        overview={overview}
        series={series}
        initialFrom={from}
        initialTo={to}
      />

      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="rounded-[20px] border bg-white p-4">
          <p className="text-sm text-muted-foreground">
            Attendance overview is available above via reporting.
          </p>
        </div>
        <AttendanceCard />
      </div>

      <PayrunTable />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <EmployeeTable />

        <div className="space-y-6">
          <QuickActions />
          <NextPayroll />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecruitmentOverview />
        <UpcomingEvents />
        <RecentActivity />
      </div>
    </div>
  );
}
