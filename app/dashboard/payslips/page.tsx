import { headers } from "next/headers";
import {
  type PayslipRecord,
  PayslipsClient,
} from "@/components/dashboard/payslips/payslips-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { payRunRepo } from "@/server/repo/payrun";

export default async function PayslipsPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage all employee payslips
          </p>
        </div>
        <PayslipsClient initialPayslips={[]} />
      </div>
    );
  }
  const tenantId = session.user.tenantId as TenantId;
  let initialPayslips: PayslipRecord[] = [];
  try {
    const repo = payRunRepo(prisma, tenantId);
    const payslips = await repo.listPayslips();
    initialPayslips = payslips.map((ps) => {
      const s = ps.status.toLowerCase();
      const status: PayslipRecord["status"] =
        s === "locked" || s === "paid"
          ? "Paid"
          : s === "draft"
            ? "Pending"
            : "Generated";
      return {
        id: ps.id,
        employee: { name: ps.employeeName, email: ps.employeeId, avatar: "" },
        employeeId: ps.employeeId,
        department: ps.department,
        lastPayrunDate: ps.periodStart,
        totalNetPay: Math.round((ps.net as number) / 100),
        status,
        type: "Monthly" as const,
      };
    });
  } catch {
    initialPayslips = [];
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Payslips
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage all employee payslips
        </p>
      </div>
      <PayslipsClient initialPayslips={initialPayslips} />
    </div>
  );
}
