import { describe, expect, it, vi } from "vitest";
import { timeEntryRepo } from "@/server/repo/timeEntry";

function mockPrisma(foundEmployee: boolean = true) {
  return {
    employee: {
      findFirst: vi.fn(async () =>
        foundEmployee ? { id: "emp1", tenantId: "tenantA" } : null,
      ),
    },
    timeEntry: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "te1",
        ...data,
        startAt: data.startAt,
        endAt: data.endAt,
        status: data.status ?? "pending",
        approvedBy: null,
        createdAt: new Date("2026-08-01T00:00:00Z"),
        updatedAt: new Date("2026-08-01T00:00:00Z"),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "te1",
        tenantId: "tenantA",
        employeeId: "emp1",
        type: "clock",
        startAt: new Date("2026-08-01T09:00:00Z"),
        endAt: new Date("2026-08-01T17:00:00Z"),
        status: data.status ?? "approved",
        approvedBy: data.approvedBy ?? "approver",
        createdAt: new Date("2026-08-01T00:00:00Z"),
        updatedAt: new Date("2026-08-02T00:00:00Z"),
      })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
  } as unknown as never;
}

describe("timeEntryRepo tenancy", () => {
  it("create scopes to factory tenantId and validates employee belongs to tenant", async () => {
    const prisma = mockPrisma(true) as never as Parameters<
      typeof timeEntryRepo
    >[0];
    const repo = timeEntryRepo(prisma, "tenantA" as never);
    await repo.create({
      employeeId: "emp1",
      type: "clock",
      startAt: "2026-08-01T09:00:00Z",
      endAt: "2026-08-01T17:00:00Z",
    });
    expect(prisma.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
    expect(prisma.employee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("create rejects if employee not in tenant", async () => {
    const prisma = mockPrisma(false) as never as Parameters<
      typeof timeEntryRepo
    >[0];
    const repo = timeEntryRepo(prisma, "tenantA" as never);
    await expect(
      repo.create({
        employeeId: "empOther",
        type: "clock",
        startAt: "2026-08-01T09:00:00Z",
        endAt: "2026-08-01T17:00:00Z",
      }),
    ).rejects.toThrow("Employee not found");
  });

  it("list filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof timeEntryRepo>[0];
    const repo = timeEntryRepo(prisma, "tenantA" as never);
    await repo.list();
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("getById filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof timeEntryRepo>[0];
    const repo = timeEntryRepo(prisma, "tenantA" as never);
    await repo.getById("te1" as never);
    expect(prisma.timeEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("rejects startAt >= endAt", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof timeEntryRepo>[0];
    const repo = timeEntryRepo(prisma, "tenantA" as never);
    await expect(
      repo.create({
        employeeId: "emp1",
        type: "clock",
        startAt: "2026-08-01T17:00:00Z",
        endAt: "2026-08-01T09:00:00Z",
      }),
    ).rejects.toThrow("startAt must be before endAt");
  });
});
