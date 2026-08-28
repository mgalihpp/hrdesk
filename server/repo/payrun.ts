import type { PrismaClient } from "@prisma/client";
import type { PayRunStatus, PayrollResult } from "@/lib/payroll/types";
import type { PayRunId, TenantId } from "@/lib/types";

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
