import { headers } from "next/headers";

import {
  PayrollClient,
  type PayrollRecord,
} from "@/components/dashboard/payroll/payroll-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { payRunRepo } from "@/server/repo/payrun";

export default async function PayrollPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Payroll Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage, process, and analyze comprehensive payroll data.
          </p>
        </div>
        <PayrollClient initialRecords={[]} />
      </div>
    );
  }
  const tenantId = session.user.tenantId as TenantId;
  let initialRecords: PayrollRecord[] = [];
  try {
    const repo = payRunRepo(prisma, tenantId);
    const payslips = await repo.listPayslips();
    if (payslips.length > 0) {
      initialRecords = payslips.map((ps) => {
        const s = ps.status.toLowerCase();
        const payrollStatus: PayrollRecord["status"] =
          s === "locked"
            ? "Paid"
            : s === "draft"
              ? "Pending Approval"
              : "Processing";
        const period = (() => {
          if (!ps.periodStart) return "Oct 2026";
          const d = new Date(`${ps.periodStart}T00:00:00Z`);
          if (Number.isNaN(d.getTime())) return ps.periodStart;
          return d.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });
        })();
        return {
          id: ps.id,
          employee: { name: ps.employeeName, email: ps.employeeId, avatar: "" },
          employmentType: "Salaried" as const,
          period,
          baseSalary: Math.round((ps.gross as number) / 100),
          allowances: 0,
          deductions: Math.round(
            ((ps.deductions as number) + (ps.tax as number)) / 100,
          ),
          netPay: Math.round((ps.net as number) / 100),
          status: payrollStatus,
        };
      });
    } else {
      const runs = await repo.listWithTotals();
      initialRecords = runs.map((r) => {
        const s = r.status.toLowerCase();
        const payrollStatus: PayrollRecord["status"] =
          s === "locked"
            ? "Paid"
            : s === "draft"
              ? "Pending Approval"
              : "Processing";
        const period = (() => {
          if (!r.periodStart) return "Oct 2026";
          const d = new Date(`${r.periodStart}T00:00:00Z`);
          if (Number.isNaN(d.getTime())) return r.periodStart;
          return d.toLocaleString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });
        })();
        return {
          id: r.id,
          employee: {
            name: r.entityId || "Pay Run",
            email: r.idempotencyKey,
            avatar: "",
          },
          employmentType: "Salaried" as const,
          period,
          baseSalary: Math.round((r.gross as number) / 100),
          allowances: 0,
          deductions: Math.round(
            ((r.gross as number) - (r.net as number)) / 100,
          ),
          netPay: Math.round((r.net as number) / 100),
          status: payrollStatus,
        };
      });
    }
  } catch {
    initialRecords = [];
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Payroll Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage, process, and analyze comprehensive payroll data.
        </p>
      </div>
      <PayrollClient initialRecords={initialRecords} />
    </div>
  );
}
