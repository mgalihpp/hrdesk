import { describe, expect, it, vi } from "vitest";
import { payRunRepo } from "@/server/repo/payrun";

function mockPrismaWithData() {
  return {
    payRun: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) => {
        if (where.tenantId !== "tenantA") return [];
        return [
          {
            id: "run1",
            tenantId: "tenantA",
            entityId: "default",
            periodStart: "2026-08-01",
            periodEnd: "2026-08-15",
            status: "done",
            idempotencyKey: "tenantA:2026-08-01:2026-08-15:default",
            createdAt: new Date("2026-08-16"),
          },
          {
            id: "run2",
            tenantId: "tenantA",
            entityId: "default",
            periodStart: "2026-08-16",
            periodEnd: "2026-08-31",
            status: "draft",
            idempotencyKey: "tenantA:2026-08-16:2026-08-31:default",
            createdAt: new Date("2026-09-01"),
          },
        ];
      }),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    payslip: {
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: { tenantId: string; payRunId: { in: string[] } };
        }) => {
          expect(where.tenantId).toBe("tenantA");
          expect(where.payRunId.in).toEqual(["run1", "run2"]);
          return [
            { payRunId: "run1", gross: 100000, net: 80000 },
            { payRunId: "run1", gross: 200000, net: 150000 },
            { payRunId: "run2", gross: 50000, net: 40000 },
          ];
        },
      ),
      create: vi.fn(),
    },
    payItem: { createMany: vi.fn() },
  } as unknown as never;
}

describe("payRunRepo listWithTotals tenancy", () => {
  it("aggregates gross/net per run and filters payslips by tenantId", async () => {
    const prisma = mockPrismaWithData() as never as Parameters<
      typeof payRunRepo
    >[0];
    const repo = payRunRepo(prisma, "tenantA" as never);
    const rows = await repo.listWithTotals();
    expect(rows).toHaveLength(2);
    expect(rows[0].payslipCount).toBe(2);
    expect(rows[0].gross).toBe(300000);
    expect(rows[0].net).toBe(230000);
    expect(rows[1].payslipCount).toBe(1);
    expect(rows[1].gross).toBe(50000);
    expect(rows[1].net).toBe(40000);
    expect(prisma.payslip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("returns empty when no runs", async () => {
    const prisma = {
      payRun: { findMany: vi.fn(async () => []) },
      payslip: { findMany: vi.fn(async () => []) },
      payItem: { createMany: vi.fn() },
    } as unknown as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as never);
    const rows = await repo.listWithTotals();
    expect(rows).toEqual([]);
  });

  it("isolates cross-tenant runs", async () => {
    const prisma = {
      payRun: {
        findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) => {
          expect(where.tenantId).toBe("tenantB");
          return [];
        }),
      },
      payslip: { findMany: vi.fn(async () => []) },
      payItem: { createMany: vi.fn() },
    } as unknown as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantB" as never);
    await repo.listWithTotals();
    expect(prisma.payRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenantB" } }),
    );
  });
});
