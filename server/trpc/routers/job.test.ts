import { TRPCError } from "@trpc/server";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { jobRouter } from "@/server/trpc/routers/job";

type MockJobPrisma = {
  job: {
    create: Mock;
    findMany: Mock;
    findFirst: Mock;
    updateMany: Mock;
    deleteMany: Mock;
  };
  candidate: {
    findMany: Mock;
    findFirst: Mock;
    create: Mock;
    updateMany: Mock;
  };
  employee: {
    findMany: Mock;
    findFirst: Mock;
    create: Mock;
  };
};

function jobCaller(
  roles: string[],
  prismaOverrides: Record<string, unknown> = {},
) {
  const prisma = {
    job: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "job1",
        ...data,
        status: (data as Record<string, unknown>).status ?? "open",
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        updatedAt: new Date("2026-08-28T00:00:00.000Z"),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      ...((prismaOverrides.job as Record<string, unknown>) ?? {}),
    },
    candidate: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "cand1",
        ...data,
        stage: "applied",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
      ...((prismaOverrides.candidate as Record<string, unknown>) ?? {}),
    },
    employee: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "emp1",
        ...data,
        createdAt: new Date(),
      })),
      ...((prismaOverrides.employee as Record<string, unknown>) ?? {}),
    },
    ...prismaOverrides,
  } as unknown as MockJobPrisma;

  const ctx = {
    session: { id: "u1", tenantId: "t1" as never, roles: roles as never },
    prisma: prisma as never,
  } as unknown as never;
  return { caller: jobRouter.createCaller(ctx), prisma };
}

describe("job router RBAC", () => {
  it("rejects employee on create", async () => {
    const { caller } = jobCaller(["employee"]);
    await expect(caller.create({ title: "FE Eng" })).rejects.toThrow(TRPCError);
    await expect(caller.create({ title: "FE Eng" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects employee on update", async () => {
    const { caller } = jobCaller(["employee"]);
    await expect(
      caller.update({ id: "job1", title: "New Title" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects employee on close and remove", async () => {
    const { caller } = jobCaller(["employee"]);
    await expect(caller.close({ id: "job1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.remove({ id: "job1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows hr on create", async () => {
    const { caller, prisma } = jobCaller(["hr"]);
    const res = await caller.create({ title: "FE Eng", department: "Eng" });
    expect(res.title).toBe("FE Eng");
    expect(prisma.job.create).toHaveBeenCalled();
  });

  it("allows admin and owner on create", async () => {
    for (const role of ["admin", "owner"] as const) {
      const { caller } = jobCaller([role]);
      const res = await caller.create({ title: "BE Eng" });
      expect(res.title).toBe("BE Eng");
    }
  });

  it("allows any authed on list and byId", async () => {
    const { caller } = jobCaller(["employee"], {
      job: {
        findMany: vi.fn(async () => [
          {
            id: "job1",
            tenantId: "t1",
            title: "FE Eng",
            department: null,
            description: null,
            status: "open",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        findFirst: vi.fn(async () => ({
          id: "job1",
          tenantId: "t1",
          title: "FE Eng",
          department: null,
          description: null,
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    });
    const list = await caller.list();
    expect(Array.isArray(list)).toBe(true);
    const byId = await caller.byId({ id: "job1" });
    expect(byId?.id).toBe("job1");
  });

  it("tenancy: repo is called with tenantId from ctx", async () => {
    const findMany = vi.fn(async () => []);
    const { caller } = jobCaller(["hr"], {
      job: { findMany },
    });
    await caller.list();
    expect(findMany).toHaveBeenCalledWith({ where: { tenantId: "t1" } });
  });
});
