import { describe, expect, it, vi } from "vitest";
import { leaveRepo } from "@/server/repo/leave";

function mockPrisma(foundEmployee: boolean = true) {
  return {
    employee: {
      findFirst: vi.fn(async () =>
        foundEmployee ? { id: "emp1", tenantId: "tenantA" } : null,
      ),
    },
    leave: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "lv1",
        ...data,
        status: data.status ?? "pending",
        reason: data.reason ?? null,
        approvedBy: null,
        createdAt: new Date("2026-08-01T00:00:00Z"),
        updatedAt: new Date("2026-08-01T00:00:00Z"),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "lv1",
        tenantId: "tenantA",
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: data.status ?? "approved",
        reason: null,
        approvedBy: data.approvedBy ?? "approver",
        createdAt: new Date("2026-08-01T00:00:00Z"),
        updatedAt: new Date("2026-08-02T00:00:00Z"),
      })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
  } as unknown as never;
}

describe("leaveRepo tenancy", () => {
  it("create scopes to factory tenantId", async () => {
    const prisma = mockPrisma(true) as never as Parameters<typeof leaveRepo>[0];
    const repo = leaveRepo(prisma, "tenantA" as never);
    await repo.create({
      employeeId: "emp1",
      type: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
    });
    expect(prisma.leave.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("list filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof leaveRepo>[0];
    const repo = leaveRepo(prisma, "tenantA" as never);
    await repo.list();
    expect(prisma.leave.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("getById filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof leaveRepo>[0];
    const repo = leaveRepo(prisma, "tenantA" as never);
    await repo.getById("lv1" as never);
    expect(prisma.leave.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("rejects startDate > endDate", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof leaveRepo>[0];
    const repo = leaveRepo(prisma, "tenantA" as never);
    await expect(
      repo.create({
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-12",
        endDate: "2026-08-10",
      }),
    ).rejects.toThrow("startDate must be <=");
  });
});
