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
    department: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "dept_1",
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        updatedAt: new Date("2026-08-28T00:00:00.000Z"),
        ...data,
      }),
      findMany: async () => [],
      findFirst: async () => null,
      updateMany: async () => ({ count: 1 }),
      deleteMany: async () => ({ count: 1 }),
    },
  } as unknown as PrismaClient;
}

const validInput = {
  name: "Engineering",
  iconKey: "engineering" as const,
  headName: "Alice",
  headEmail: "alice@example.com",
  location: "HQ" as const,
  budgetUtil: 50,
};

describe("department RBAC", () => {
  it("rejects create without write role", async () => {
    for (const role of ["employee", "manager", "payrollAdmin"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(caller.department.create(validInput)).rejects.toThrow(
        /FORBIDDEN/,
      );
    }
  });

  it("rejects manager and payrollAdmin on create explicitly", async () => {
    for (const role of ["manager", "payrollAdmin"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(caller.department.create(validInput)).rejects.toThrow(
        /FORBIDDEN/,
      );
    }
  });

  it("allows create with hr, admin, owner", async () => {
    for (const role of ["hr", "admin", "owner"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      const res = await caller.department.create(validInput);
      expect(res.id).toBeDefined();
    }
  });

  it("rejects unauthenticated list and byId", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(caller.department.list()).rejects.toThrow(/UNAUTHORIZED/);
    await expect(caller.department.byId({ id: "dept_1" })).rejects.toThrow(
      /UNAUTHORIZED/,
    );
  });

  it("rejects unauthenticated create", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(caller.department.create(validInput)).rejects.toThrow(
      /UNAUTHORIZED/,
    );
  });

  it("validates zod: invalid iconKey rejects", async () => {
    const caller = appRouter.createCaller({
      session: session(["hr"]),
      prisma: fakePrisma(),
    });
    await expect(
      caller.department.create({ ...validInput, iconKey: "bad" as never }),
    ).rejects.toThrow();
  });

  it("validates zod: budgetUtil 101 rejects", async () => {
    const caller = appRouter.createCaller({
      session: session(["hr"]),
      prisma: fakePrisma(),
    });
    await expect(
      caller.department.create({ ...validInput, budgetUtil: 101 }),
    ).rejects.toThrow();
  });

  it("validates zod: bad email rejects", async () => {
    const caller = appRouter.createCaller({
      session: session(["hr"]),
      prisma: fakePrisma(),
    });
    await expect(
      caller.department.create({ ...validInput, headEmail: "not-an-email" }),
    ).rejects.toThrow();
  });

  it("list is tenant-scoped", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "dept_1",
        tenantId: "org_b",
        name: "Other",
        iconKey: "engineering",
        headName: "B",
        headEmail: "b@x.co",
        headAvatarUrl: null,
        location: "HQ",
        activeEmployees: 1,
        budgetUtil: 10,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = {
      department: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: "dept_1",
          createdAt: new Date(),
          updatedAt: new Date(),
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
    const list = await caller.department.list();
    expect(list).toHaveLength(0);
  });

  it("rejects update without write role", async () => {
    for (const role of ["employee", "manager", "payrollAdmin"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(
        caller.department.update({ id: "dept_1", patch: { name: "New" } }),
      ).rejects.toThrow(/FORBIDDEN/);
    }
  });

  it("allows update with hr, admin, owner", async () => {
    for (const role of ["hr", "admin", "owner"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(
        caller.department.update({ id: "dept_1", patch: { name: "New" } }),
      ).resolves.toBeUndefined();
    }
  });

  it("rejects unauthenticated update and remove", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(
      caller.department.update({ id: "dept_1", patch: { name: "New" } }),
    ).rejects.toThrow(/UNAUTHORIZED/);
    await expect(caller.department.remove({ id: "dept_1" })).rejects.toThrow(
      /UNAUTHORIZED/,
    );
  });

  it("rejects remove without write role", async () => {
    for (const role of ["employee", "manager", "payrollAdmin"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(caller.department.remove({ id: "dept_1" })).rejects.toThrow(
        /FORBIDDEN/,
      );
    }
  });

  it("allows remove with hr, admin, owner", async () => {
    for (const role of ["hr", "admin", "owner"] as const) {
      const caller = appRouter.createCaller({
        session: session([role]),
        prisma: fakePrisma(),
      });
      await expect(
        caller.department.remove({ id: "dept_1" }),
      ).resolves.toBeUndefined();
    }
  });

  it("update validates zod budgetUtil 101", async () => {
    const caller = appRouter.createCaller({
      session: session(["hr"]),
      prisma: fakePrisma(),
    });
    await expect(
      caller.department.update({ id: "dept_1", patch: { budgetUtil: 101 } }),
    ).rejects.toThrow();
  });
});
