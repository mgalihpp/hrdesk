import type { PrismaClient } from "@prisma/client";
import type { Cents } from "@/lib/money";
import { cents } from "@/lib/money";
import type { PayRunStatus, PayrollResult } from "@/lib/payroll/types";
import type { PayRunId, TenantId } from "@/lib/types";

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

type Prisma = PrismaClient;

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

      // v1 sequential writes; native transaction hardening requires replica set
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
  };
}
