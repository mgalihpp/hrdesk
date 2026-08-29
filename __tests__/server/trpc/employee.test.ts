import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { SessionUser, TenantId } from "@/lib/types";
import { appRouter } from "@/server/trpc/routers/_app";

const TID = (s: string) => s as TenantId;

const session = (roles: SessionUser["roles"]): SessionUser => ({
  id: "u1",
  tenantId: TID("org_a"),
  roles,
});

function fakePrisma(): PrismaClient {
  return {
    employee: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "e1",
        createdAt: new Date(),
        ...data,
      }),
      findMany: async () => [],
      findFirst: async () => null,
      updateMany: async () => ({ count: 0 }),
      deleteMany: async () => ({ count: 0 }),
    },
  } as unknown as PrismaClient;
}

const sample = {
  firstName: "J",
  lastName: "D",
  email: "j@x.co",
  ssn: "123",
  bank: "a",
  compensation: 1,
  hireDate: "2026-01-01",
  status: "active" as const,
};

describe("employee RBAC", () => {
  it("rejects create without a write role", async () => {
    const caller = appRouter.createCaller({
      session: session(["employee"]),
      prisma: fakePrisma(),
    });
    await expect(caller.employee.create(sample)).rejects.toThrow(/FORBIDDEN/);
  });

  it("rejects manager and payrollAdmin on create", async () => {
    for (const role of ["manager", "payrollAdmin", "employee"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(caller.employee.create(sample)).rejects.toThrow(/FORBIDDEN/);
    }
  });

  it("allows create with hr, admin, owner", async () => {
    for (const role of ["hr", "admin", "owner"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      const res = await caller.employee.create(sample);
      expect(res.id).toBeDefined();
    }
  });

  it("rejects unauthenticated reads", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(caller.employee.list()).rejects.toThrow(/UNAUTHORIZED/);
  });

  it("rejects unauthenticated byId", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(caller.employee.byId({ id: "e1" })).rejects.toThrow(
      /UNAUTHORIZED/,
    );
  });

  it("list is tenant-scoped at repo level", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "e1",
        tenantId: "org_b",
        firstName: "B",
        lastName: "B",
        email: "b@x.co",
        ssnEnc: "x",
        bankEnc: "x",
        compensation: 1,
        hireDate: "2026-01-01",
        status: "active",
        createdAt: new Date(),
      },
    ];
    const prisma = {
      employee: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: "e1",
          createdAt: new Date(),
          ...data,
        }),
        findMany: async ({ where }: { where: { tenantId: string } }) =>
          store.filter((r) => r.tenantId === where.tenantId),
        findFirst: async ({
          where,
        }: {
          where: { id: string; tenantId: string };
        }) =>
          store.find(
            (r) => r.id === where.id && r.tenantId === where.tenantId,
          ) ?? null,
        updateMany: async () => ({ count: 0 }),
        deleteMany: async () => ({ count: 0 }),
      },
    } as unknown as PrismaClient;
    const caller = appRouter.createCaller({ session: session(["hr"]), prisma });
    const list = await caller.employee.list();
    expect(list).toHaveLength(0);
  });
});
