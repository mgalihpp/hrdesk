import type { PrismaClient } from "@prisma/client";
import type { Cents } from "@/lib/money";
import { cents } from "@/lib/money";
import type { PayRunStatus, PayrollResult } from "@/lib/payroll/types";
import type { PayRunId, PayslipId, TenantId } from "@/lib/types";

export type NextPayrollData = {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  daysUntil: number;
  estimatedGross: Cents;
  employeeCount: number;
};

export type PayRunWithTotals = {
  id: string;
  tenantId: string;
  entityId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  idempotencyKey: string;
  createdAt: Date;
  payslipCount: number;
  gross: Cents;
  net: Cents;
};

export type PayslipView = {
  id: string;
  tenantId: string;
  payRunId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  gross: Cents;
  deductions: Cents;
  tax: Cents;
  net: Cents;
  periodLabel: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: Date;
};

export type PayslipDetail = PayslipView & {
  payItems: Array<{
    id: string;
    category: string;
    amount: Cents;
    label: string;
  }>;
};

type Prisma = PrismaClient;

function periodLabelFromRun(periodStart: string): string {
  return new Date(`${periodStart}T00:00:00Z`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function matchesStatus(payRunStatus: string, filter: string): boolean {
  const f = filter.toLowerCase();
  const s = payRunStatus.toLowerCase();
  if (f === "paid") return s === "locked";
  if (f === "pending") return s === "draft";
  if (f === "generated") return s === "draft";
  return s === f;
}

export function payRunRepo(prisma: Prisma, tenantId: TenantId) {
  return {
    async create(
      result: PayrollResult,
    ): Promise<{ id: string; idempotencyKey: string; status: string }> {
      const existing = await prisma.payRun.findUnique({
        where: { idempotencyKey: result.idempotencyKey },
      });
      if (existing) {
        if (existing.tenantId !== tenantId) {
          throw new Error("idempotency key collision across tenant");
        }
        return existing as unknown as {
          id: string;
          idempotencyKey: string;
          status: string;
        };
      }

      const payRun = await prisma.payRun.create({
        data: {
          tenantId,
          entityId: result.entityId,
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          status: result.status,
          idempotencyKey: result.idempotencyKey,
        },
      });

      for (const ps of result.payslips) {
        const payslip = await prisma.payslip.create({
          data: {
            tenantId,
            payRunId: payRun.id,
            employeeId: ps.employeeId as string,
            gross: ps.gross as number,
            deductions: ps.deductions as number,
            tax: ps.tax as number,
            net: ps.net as number,
          },
        });
        if (ps.items.length > 0) {
          await prisma.payItem.createMany({
            data: ps.items.map((it) => ({
              tenantId,
              payslipId: payslip.id,
              payRunId: payRun.id,
              category: it.category,
              amount: it.amount as number,
              label: it.label,
            })),
          });
        }
      }

      return payRun as unknown as {
        id: string;
        idempotencyKey: string;
        status: string;
      };
    },

    async findByKey(idempotencyKey: string) {
      const row = await prisma.payRun.findFirst({
        where: { idempotencyKey, tenantId },
      });
      return row;
    },

    async getById(id: PayRunId) {
      const row = await prisma.payRun.findFirst({
        where: { id: id as string, tenantId },
      });
      return row;
    },

    async list() {
      return prisma.payRun.findMany({
        where: { tenantId },
        orderBy: { periodStart: "desc" },
      });
    },

    async listWithTotals(): Promise<PayRunWithTotals[]> {
      const runs = await prisma.payRun.findMany({
        where: { tenantId },
        orderBy: { periodStart: "desc" },
      });
      if (runs.length === 0) return [];
      const runIds = runs.map((r) => r.id);
      const slips = await prisma.payslip.findMany({
        where: { tenantId, payRunId: { in: runIds } },
      });
      const byRun: Record<
        string,
        { count: number; gross: number; net: number }
      > = {};
      for (const s of slips as unknown as Array<{
        payRunId: string;
        gross: number;
        net: number;
      }>) {
        const cur = byRun[s.payRunId] ?? { count: 0, gross: 0, net: 0 };
        cur.count += 1;
        cur.gross += s.gross;
        cur.net += s.net;
        byRun[s.payRunId] = cur;
      }
      return runs.map((r) => {
        const agg = byRun[r.id] ?? { count: 0, gross: 0, net: 0 };
        return {
          id: r.id,
          tenantId: r.tenantId,
          entityId: r.entityId,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          status: r.status,
          idempotencyKey: r.idempotencyKey,
          createdAt: r.createdAt,
          payslipCount: agg.count,
          gross: cents(agg.gross),
          net: cents(agg.net),
        };
      });
    },

    async lock(id: PayRunId) {
      const existing = await prisma.payRun.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!existing) throw new Error("PayRun not found");
      if (existing.status === "locked") return existing;
      const updated = await prisma.payRun.updateMany({
        where: { id: id as string, tenantId },
        data: { status: "locked" as PayRunStatus },
      });
      if (updated.count === 0) throw new Error("PayRun not found");
      return prisma.payRun.findFirst({ where: { id: id as string, tenantId } });
    },

    async getPayslips(payRunId: PayRunId) {
      return prisma.payslip.findMany({
        where: { payRunId: payRunId as string, tenantId },
      });
    },

    async getNextPayroll(now?: Date): Promise<NextPayrollData | null> {
      const run = await prisma.payRun.findFirst({
        where: { tenantId },
        orderBy: { periodEnd: "desc" },
      });
      if (!run) return null;
      const employees = await prisma.employee.findMany({
        where: { tenantId, status: "active" },
      });
      const employeeCount = employees.length;
      const total = employees.reduce(
        (sum: number, e: { compensation: number }) => sum + e.compensation,
        0,
      );
      const estimatedGross = cents(total);
      const periodLabel = new Date(
        `${run.periodStart}T00:00:00Z`,
      ).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      const periodStartDate = new Date(`${run.periodStart}T00:00:00Z`);
      const base = now ?? new Date();
      const daysUntil = Math.max(
        0,
        Math.ceil((periodStartDate.getTime() - base.getTime()) / 86400000),
      );
      return {
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        periodLabel,
        daysUntil,
        estimatedGross,
        employeeCount,
      };
    },

    async listPayslips(opts?: {
      status?: string;
      payRunId?: string;
    }): Promise<PayslipView[]> {
      const where: Record<string, unknown> = { tenantId };
      if (opts?.payRunId) where.payRunId = opts.payRunId;
      const slips = (await prisma.payslip.findMany({
        where: where as never,
      })) as unknown as Array<{
        id: string;
        tenantId: string;
        payRunId: string;
        employeeId: string;
        gross: number;
        deductions: number;
        tax: number;
        net: number;
        createdAt: Date;
      }>;
      if (slips.length === 0) return [];
      const payRunIds = [...new Set(slips.map((s) => s.payRunId))];
      const payRuns = (await prisma.payRun.findMany({
        where: { tenantId, id: { in: payRunIds } },
      })) as unknown as Array<{
        id: string;
        status: string;
        periodStart: string;
        periodEnd: string;
      }>;
      const payRunMap = new Map(payRuns.map((r) => [r.id, r]));
      let filtered = slips;
      if (opts?.status) {
        filtered = slips.filter((s) => {
          const pr = payRunMap.get(s.payRunId);
          if (!pr) return false;
          return matchesStatus(pr.status, opts.status as string);
        });
        if (filtered.length === 0) return [];
      }
      const employeeIds = [...new Set(filtered.map((s) => s.employeeId))];
      const employees = (await prisma.employee.findMany({
        where: { tenantId, id: { in: employeeIds } },
      })) as unknown as Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        department: string | null;
      }>;
      const empMap = new Map(employees.map((e) => [e.id, e]));
      return filtered.map((s) => {
        const pr = payRunMap.get(s.payRunId);
        const emp = empMap.get(s.employeeId);
        const employeeName =
          emp && (emp.firstName || emp.lastName)
            ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()
            : (emp?.email ?? "Unknown");
        const department = (emp?.department as string | null) ?? "Engineering";
        const periodStart = pr?.periodStart ?? "";
        const periodEnd = pr?.periodEnd ?? "";
        const status = pr?.status ?? "draft";
        const periodLabel = periodStart ? periodLabelFromRun(periodStart) : "";
        return {
          id: s.id,
          tenantId: s.tenantId,
          payRunId: s.payRunId,
          employeeId: s.employeeId,
          employeeName,
          department,
          gross: cents(s.gross),
          deductions: cents(s.deductions),
          tax: cents(s.tax),
          net: cents(s.net),
          periodLabel,
          status,
          periodStart,
          periodEnd,
          createdAt: s.createdAt,
        };
      });
    },

    async getPayslipById(id: PayslipId | string): Promise<
      | (PayslipView & {
          payItems: Array<{
            id: string;
            category: string;
            amount: Cents;
            label: string;
          }>;
        })
      | null
    > {
      const slip = (await prisma.payslip.findFirst({
        where: { id: id as string, tenantId },
      })) as unknown as {
        id: string;
        tenantId: string;
        payRunId: string;
        employeeId: string;
        gross: number;
        deductions: number;
        tax: number;
        net: number;
        createdAt: Date;
      } | null;
      if (!slip) return null;
      const payRun = (await prisma.payRun.findFirst({
        where: { id: slip.payRunId, tenantId },
      })) as unknown as {
        id: string;
        status: string;
        periodStart: string;
        periodEnd: string;
      } | null;
      if (!payRun) return null;
      const employee = (await prisma.employee.findFirst({
        where: { id: slip.employeeId, tenantId },
      })) as unknown as {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        department: string | null;
      } | null;
      if (!employee) return null;
      const items = (await prisma.payItem.findMany({
        where: { payslipId: slip.id, tenantId },
      })) as unknown as Array<{
        id: string;
        category: string;
        amount: number;
        label: string;
      }>;
      const employeeName =
        employee.firstName || employee.lastName
          ? `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim()
          : (employee.email ?? "Unknown");
      const department =
        (employee.department as string | null) ?? "Engineering";
      const periodLabel = periodLabelFromRun(payRun.periodStart);
      return {
        id: slip.id,
        tenantId: slip.tenantId,
        payRunId: slip.payRunId,
        employeeId: slip.employeeId,
        employeeName,
        department,
        gross: cents(slip.gross),
        deductions: cents(slip.deductions),
        tax: cents(slip.tax),
        net: cents(slip.net),
        periodLabel,
        status: payRun.status,
        periodStart: payRun.periodStart,
        periodEnd: payRun.periodEnd,
        createdAt: slip.createdAt,
        payItems: items.map((it) => ({
          id: it.id,
          category: it.category,
          amount: cents(it.amount),
          label: it.label,
        })),
      };
    },
  };
}
