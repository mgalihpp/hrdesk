import { describe, expect, it, vi } from "vitest";
import { cents } from "@/lib/money";
import { payRunRepo } from "@/server/repo/payrun";

function result(over: Record<string, unknown> = {}) {
  return {
    payRunId: "k1" as unknown as never,
    tenantId: "tenantA" as unknown as never,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    entityId: "default",
    idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
    status: "draft" as const,
    payslips: [
      {
        id: "ps1" as unknown as never,
        payRunId: "k1" as unknown as never,
        employeeId: "e1" as unknown as never,
        tenantId: "tenantA" as unknown as never,
        gross: cents(10000),
        deductions: cents(0),
        tax: cents(1000),
        net: cents(9000),
        items: [],
      },
    ],
    totals: {
      gross: cents(10000),
      deductions: cents(0),
      tax: cents(1000),
      net: cents(9000),
    },
    ...over,
  };
}

function mockPrisma() {
  return {
    payRun: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "newId",
        ...data,
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    payslip: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ps1",
        ...data,
      })),
      createMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
    },
    payItem: { createMany: vi.fn(async () => ({ count: 1 })) },
  } as unknown as never;
}

describe("payRunRepo tenancy", () => {
  it("create always scopes writes to the factory tenantId even if result has different tenant", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.create(
      result({ tenantId: "evil" as unknown as never }) as never,
    );
    expect(prisma.payRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("list filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.list();
    expect(prisma.payRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("getById filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.getById("someId" as unknown as never);
    expect(prisma.payRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });
});

describe("payRunRepo idempotency", () => {
  it("returns existing run when idempotencyKey already exists instead of creating duplicate", async () => {
    const existing = {
      id: "existingId",
      idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
      tenantId: "tenantA",
    };
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payRun.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(existing);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.create(result() as never);
    expect(res.id).toBe("existingId");
    expect(prisma.payRun.create).not.toHaveBeenCalled();
  });

  it("lock rejects cross-tenant id", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payRun.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await expect(
      repo.lock("otherTenantId" as unknown as never),
    ).rejects.toThrow(/not found/i);
  });
});
