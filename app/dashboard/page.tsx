import { AttendanceCard } from "@/components/dashboard/attendance-card";
import {
  RecentActivity,
  RecruitmentOverview,
  UpcomingEvents,
} from "@/components/dashboard/bottom-cards";
import { EmployeeTable } from "@/components/dashboard/employee-table";
import { NextPayroll } from "@/components/dashboard/next-payroll";
import { PayrollChart } from "@/components/dashboard/payroll-chart";
import { PayrunTable } from "@/components/dashboard/payrun-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCards } from "@/components/dashboard/stat-cards";

export default function DashboardPage() {
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
      <StatCards />

      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <PayrollChart />
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
