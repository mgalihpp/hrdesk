import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { encrypt } from "@/lib/crypto";
import { candidateRouter } from "@/server/trpc/routers/candidate";

type MockCandidatePrisma = {
  job: {
    create: Mock;
    findFirst: Mock;
    findMany: Mock;
    updateMany: Mock;
    deleteMany: Mock;
  };
  candidate: {
    create: Mock;
    findMany: Mock;
    findFirst: Mock;
    updateMany: Mock;
  };
  employee: {
    create: Mock;
    findFirst: Mock;
    findMany: Mock;
  };
};

function candCaller(
  roles: string[],
  prismaOverrides: Record<string, unknown> = {},
) {
  const baseJob = {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "job1",
      ...data,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findFirst: vi.fn(async () => ({
      id: "job1",
      tenantId: "t1",
      title: "FE Eng",
    })),
    findMany: vi.fn(async () => []),
    updateMany: vi.fn(async () => ({ count: 1 })),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };
  const baseCandidate = {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "cand1",
      ...data,
      stage: (data as Record<string, unknown>).stage ?? "applied",
      hiredEmployeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    updateMany: vi.fn(async () => ({ count: 1 })),
  };
  const baseEmployee = {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "emp1",
      ...data,
      createdAt: new Date(),
    })),
    findFirst: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
  };

  const prisma = {
    job: {
      ...baseJob,
      ...((prismaOverrides.job as Record<string, unknown>) ?? {}),
    },
    candidate: {
      ...baseCandidate,
      ...((prismaOverrides.candidate as Record<string, unknown>) ?? {}),
    },
    employee: {
      ...baseEmployee,
      ...((prismaOverrides.employee as Record<string, unknown>) ?? {}),
    },
    ...prismaOverrides,
  } as unknown as MockCandidatePrisma;

  // ensure overrides that were already spread at top level are correctly merged
  if (prismaOverrides.job)
    (prisma as unknown as Record<string, unknown>).job = {
      ...baseJob,
      ...(prismaOverrides.job as Record<string, unknown>),
    } as unknown as MockCandidatePrisma["job"];
  if (prismaOverrides.candidate)
    (prisma as unknown as Record<string, unknown>).candidate = {
      ...baseCandidate,
      ...(prismaOverrides.candidate as Record<string, unknown>),
    } as unknown as MockCandidatePrisma["candidate"];
  if (prismaOverrides.employee)
    (prisma as unknown as Record<string, unknown>).employee = {
      ...baseEmployee,
      ...(prismaOverrides.employee as Record<string, unknown>),
    } as unknown as MockCandidatePrisma["employee"];

  const ctx = {
    session: { id: "u1", tenantId: "t1" as never, roles: roles as never },
    prisma: prisma as never,
  } as unknown as never;
  return { caller: candidateRouter.createCaller(ctx), prisma };
}

describe("candidate router RBAC", () => {
  it("rejects employee on create", async () => {
    const { caller } = candCaller(["employee"]);
    await expect(
      caller.create({
        jobId: "job1",
        firstName: "A",
        lastName: "B",
        email: "a@b.co",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects employee on moveStage and hire", async () => {
    const { caller } = candCaller(["employee"]);
    await expect(
      caller.moveStage({ id: "cand1", to: "screening" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.hire({ id: "cand1", compensation: 1000, hireDate: "2026-08-28" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows hr on create", async () => {
    const { caller, prisma } = candCaller(["hr"]);
    const res = await caller.create({
      jobId: "job1",
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
    });
    expect(res.firstName).toBe("A");
    expect(prisma.candidate.create).toHaveBeenCalled();
  });
});

describe("candidate router pipeline", () => {
  it("moveStage rejects illegal transition", async () => {
    const { caller } = candCaller(["hr"], {
      candidate: {
        findFirst: vi.fn(async () => ({
          id: "cand1",
          tenantId: "t1",
          jobId: "job1",
          firstName: "A",
          lastName: "B",
          emailEnc: encrypt("a@b.co"),
          phoneEnc: null,
          stage: "applied",
          hiredEmployeeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    });
    await expect(
      caller.moveStage({ id: "cand1", to: "hired" }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it("moveStage allows legal transition", async () => {
    const findFirst = vi.fn(async () => ({
      id: "cand1",
      tenantId: "t1",
      jobId: "job1",
      firstName: "A",
      lastName: "B",
      emailEnc: encrypt("a@b.co"),
      phoneEnc: null,
      stage: "applied",
      hiredEmployeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const { caller } = candCaller(["hr"], {
      candidate: { findFirst, updateMany },
    });
    const res = await caller.moveStage({ id: "cand1", to: "screening" });
    expect(res.stage).toBe("screening");
    expect(updateMany).toHaveBeenCalled();
  });

  it("hire requires offer stage, throws otherwise", async () => {
    const { caller } = candCaller(["hr"], {
      candidate: {
        findFirst: vi.fn(async () => ({
          id: "cand1",
          tenantId: "t1",
          jobId: "job1",
          firstName: "A",
          lastName: "B",
          emailEnc: encrypt("a@b.co"),
          phoneEnc: null,
          stage: "screening",
          hiredEmployeeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    });
    await expect(
      caller.hire({
        id: "cand1",
        compensation: 500000,
        hireDate: "2026-08-28",
      }),
    ).rejects.toThrow(/offer stage/);
  });

  it("hire is idempotent on retry", async () => {
    const existingEmp = {
      id: "emp1",
      tenantId: "t1",
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
      ssnEnc: encrypt(""),
      bankEnc: encrypt(""),
      compensation: 500000,
      hireDate: "2026-08-28",
      status: "active",
      createdAt: new Date(),
    };
    const findFirstCandidate = vi.fn(async () => ({
      id: "cand1",
      tenantId: "t1",
      jobId: "job1",
      firstName: "A",
      lastName: "B",
      emailEnc: encrypt("a@b.co"),
      phoneEnc: null,
      stage: "hired",
      hiredEmployeeId: "emp1",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const findFirstEmployee = vi.fn(async () => existingEmp);
    const createEmployee = vi.fn(async () => {
      throw new Error("should not create");
    });

    const { caller } = candCaller(["hr"], {
      candidate: { findFirst: findFirstCandidate },
      employee: { findFirst: findFirstEmployee, create: createEmployee },
    });
    const res1 = await caller.hire({
      id: "cand1",
      compensation: 500000,
      hireDate: "2026-08-28",
    });
    expect(res1.id).toBe("emp1");
    expect(createEmployee).not.toHaveBeenCalled();

    const res2 = await caller.hire({
      id: "cand1",
      compensation: 500000,
      hireDate: "2026-08-28",
    });
    expect(res2.id).toBe("emp1");
  });

  it("hire creates employee when in offer stage", async () => {
    const candidateRow = {
      id: "cand1",
      tenantId: "t1",
      jobId: "job1",
      firstName: "A",
      lastName: "B",
      emailEnc: encrypt("a@b.co"),
      phoneEnc: null,
      stage: "offer",
      hiredEmployeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const createdEmp = {
      id: "emp1",
      tenantId: "t1",
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
      ssnEnc: encrypt(""),
      bankEnc: encrypt(""),
      compensation: 8000000,
      hireDate: "2026-08-28",
      status: "active",
      createdAt: new Date(),
    };
    const { caller, prisma } = candCaller(["hr"], {
      candidate: {
        findFirst: vi.fn(async () => candidateRow),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "emp1",
          ...data,
          createdAt: new Date(),
        })),
      },
    });
    (prisma.employee.create as unknown as Mock).mockResolvedValue(
      createdEmp as unknown as never,
    );
    const res = await caller.hire({
      id: "cand1",
      compensation: 8000000,
      hireDate: "2026-08-28",
    });
    expect(res.compensation).toBe(8000000);
  });

  it("tenant isolation: listByJob empty for other tenant", async () => {
    const findMany = vi.fn(async (args: { where: Record<string, unknown> }) => {
      if (args.where.tenantId === "t1" && args.where.jobId === "job1") {
        return [
          {
            id: "cand1",
            tenantId: "t1",
            jobId: "job1",
            firstName: "A",
            lastName: "B",
            emailEnc: encrypt("a@b.co"),
            phoneEnc: null,
            stage: "applied",
            hiredEmployeeId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }
      return [];
    });
    const { caller: callerT1 } = candCaller(["hr"], {
      candidate: { findMany },
    });
    const resT1 = await callerT1.listByJob({ jobId: "job1" });
    expect(resT1.length).toBe(1);

    const prismaOther = {
      job: {
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({})),
        deleteMany: vi.fn(async () => ({})),
      },
      candidate: {
        findMany,
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({})),
      },
      employee: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
      },
    } as unknown as never;
    const ctxOther = {
      session: { id: "u2", tenantId: "t2" as never, roles: ["hr"] as never },
      prisma: prismaOther,
    } as unknown as never;
    const callerT2 = candidateRouter.createCaller(ctxOther);
    const resT2 = await callerT2.listByJob({ jobId: "job1" });
    expect(resT2.length).toBe(0);
  });

  it("list allowed for any authed role", async () => {
    const { caller } = candCaller(["employee"], {
      candidate: { findMany: vi.fn(async () => []) },
    });
    const res = await caller.list();
    expect(Array.isArray(res)).toBe(true);
  });
});
