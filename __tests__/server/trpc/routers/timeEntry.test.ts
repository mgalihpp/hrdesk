import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { leaveRouter, timeEntryRouter } from "@/server/trpc/routers/timeEntry";

function teCaller(roles: string[], prismaOverrides: unknown = {}) {
  const prisma = {
    employee: {
      findFirst: vi.fn(async () => ({ id: "emp1", tenantId: "t1" })),
    },
    timeEntry: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "te1",
        ...data,
        status: "pending",
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => ({
        id: "te1",
        tenantId: "t1",
        employeeId: "emp1",
        type: "clock",
        startAt: new Date("2026-08-01T09:00:00Z"),
        endAt: new Date("2026-08-01T17:00:00Z"),
        status: "pending",
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "te1",
        tenantId: "t1",
        employeeId: "emp1",
        type: "clock",
        startAt: new Date("2026-08-01T09:00:00Z"),
        endAt: new Date("2026-08-01T17:00:00Z"),
        status: data.status ?? "approved",
        approvedBy: data.approvedBy ?? "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    ...(prismaOverrides as Record<string, unknown>),
  } as unknown as never;
  const ctx = {
    session: { id: "u1", tenantId: "t1" as never, roles: roles as never },
    prisma,
  } as unknown as never;
  return timeEntryRouter.createCaller(ctx);
}

function lvCaller(roles: string[], prismaOverrides: unknown = {}) {
  const prisma = {
    employee: {
      findFirst: vi.fn(async () => ({ id: "emp1", tenantId: "t1" })),
    },
    leave: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "lv1",
        ...data,
        status: "pending",
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => ({
        id: "lv1",
        tenantId: "t1",
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: "pending",
        reason: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "lv1",
        tenantId: "t1",
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: data.status ?? "approved",
        reason: null,
        approvedBy: data.approvedBy ?? "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    ...(prismaOverrides as Record<string, unknown>),
  } as unknown as never;
  const ctx = {
    session: { id: "u1", tenantId: "t1" as never, roles: roles as never },
    prisma,
  } as unknown as never;
  return leaveRouter.createCaller(ctx);
}

describe("timeEntry router RBAC", () => {
  it("rejects employee on create", async () => {
    const c = teCaller(["employee"]);
    await expect(
      c.create({
        employeeId: "emp1",
        type: "clock",
        startAt: "2026-08-01T09:00:00Z",
        endAt: "2026-08-01T17:00:00Z",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows hr on create", async () => {
    const c = teCaller(["hr"]);
    const res = await c.create({
      employeeId: "emp1",
      type: "clock",
      startAt: "2026-08-01T09:00:00Z",
      endAt: "2026-08-01T17:00:00Z",
    });
    expect(res.id).toBe("te1");
  });

  it("list allowed for any authenticated", async () => {
    const c = teCaller(["employee"]);
    const res = await c.list();
    expect(Array.isArray(res)).toBe(true);
  });

  it("approve requires manager+ role", async () => {
    const c = teCaller(["employee"]);
    await expect(c.approve({ id: "te1" })).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("leave router RBAC", () => {
  it("rejects employee on create", async () => {
    const c = lvCaller(["employee"]);
    await expect(
      c.create({
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows manager on create", async () => {
    const c = lvCaller(["manager"]);
    const res = await c.create({
      employeeId: "emp1",
      type: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
    });
    expect(res.id).toBe("lv1");
  });

  it("validates startDate <= endDate", async () => {
    const c = lvCaller(["hr"]);
    await expect(
      c.create({
        employeeId: "emp1",
        type: "vacation",
        startDate: "2026-08-12",
        endDate: "2026-08-10",
      }),
    ).rejects.toThrow();
  });
});
