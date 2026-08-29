import { TRPCError } from "@trpc/server";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { interviewRouter } from "@/server/trpc/routers/interview";

type MockInterviewPrisma = {
  interview: {
    create: Mock;
    findMany: Mock;
    findFirst: Mock;
    updateMany: Mock;
    deleteMany: Mock;
  };
};

function interviewCaller(
  roles: string[],
  prismaOverrides: Record<string, unknown> = {},
) {
  const prisma = {
    interview: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "int1",
        ...data,
        status: (data as Record<string, unknown>).status ?? "scheduled",
        feedback: (data as Record<string, unknown>).feedback ?? null,
        rating: (data as Record<string, unknown>).rating ?? null,
        source: (data as Record<string, unknown>).source ?? null,
        recruiter: (data as Record<string, unknown>).recruiter ?? null,
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        updatedAt: new Date("2026-08-28T00:00:00.000Z"),
      })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      ...((prismaOverrides.interview as Record<string, unknown>) ?? {}),
    },
    ...prismaOverrides,
  } as unknown as MockInterviewPrisma;

  const ctx = {
    session: { id: "u1", tenantId: "t1" as never, roles: roles as never },
    prisma: prisma as never,
  } as unknown as never;
  return { caller: interviewRouter.createCaller(ctx), prisma };
}

describe("interview router RBAC", () => {
  it("rejects employee on create", async () => {
    const { caller } = interviewCaller(["employee"]);
    await expect(
      caller.create({
        candidateId: "cccccccccccccccccccccccc",
        candidateName: "Ada",
        position: "Eng",
        time: "2026-08-29T10:00",
        interviewType: "technical",
        interviewer: "John",
      }),
    ).rejects.toThrow(TRPCError);
    await expect(
      caller.create({
        candidateId: "cccccccccccccccccccccccc",
        candidateName: "Ada",
        position: "Eng",
        time: "2026-08-29T10:00",
        interviewType: "technical",
        interviewer: "John",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects employee on updateStatus and remove", async () => {
    const { caller } = interviewCaller(["employee"]);
    await expect(
      caller.updateStatus({ id: "int1", status: "in_progress" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.remove({ id: "int1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows hr on create", async () => {
    const { caller, prisma } = interviewCaller(["hr"]);
    const res = await caller.create({
      candidateId: "cccccccccccccccccccccccc",
      candidateName: "Ada",
      position: "Eng",
      time: "2026-08-29T10:00",
      interviewType: "technical",
      interviewer: "John",
    });
    expect(res.candidateName).toBe("Ada");
    expect(prisma.interview.create).toHaveBeenCalled();
  });

  it("allows admin and owner on create", async () => {
    for (const role of ["admin", "owner"]) {
      const { caller, prisma } = interviewCaller([role]);
      const res = await caller.create({
        candidateId: "cccccccccccccccccccccccc",
        candidateName: "Ada",
        position: "Eng",
        time: "2026-08-29T10:00",
        interviewType: "technical",
        interviewer: "John",
      });
      expect(res.candidateName).toBe("Ada");
      expect(prisma.interview.create).toHaveBeenCalled();
    }
  });

  it("allows any authed on list and byId", async () => {
    const { caller: empCaller } = interviewCaller(["employee"], {
      interview: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
    });
    await expect(empCaller.list()).resolves.toBeDefined();
    await expect(empCaller.byId({ id: "int1" })).resolves.toBeNull();
    const { caller: hrCaller } = interviewCaller(["hr"], {
      interview: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
    });
    await expect(hrCaller.list()).resolves.toBeDefined();
  });

  it("tenancy: repo is called with tenantId from ctx", async () => {
    const findMany = vi.fn(async () => []);
    const { caller } = interviewCaller(["hr"], {
      interview: { findMany },
    });
    await caller.list();
    expect(findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: "t1" }),
    });
  });
});

describe("interview router pipeline", () => {
  it("updateStatus rejects illegal transition with BAD_REQUEST", async () => {
    const { caller } = interviewCaller(["hr"], {
      interview: {
        findFirst: vi.fn(async () => ({
          id: "int1",
          tenantId: "t1",
          candidateId: "cccccccccccccccccccccccc",
          candidateName: "Ada",
          position: "Eng",
          time: "2026-08-29T10:00",
          interviewType: "technical",
          interviewer: "John",
          source: null,
          recruiter: null,
          status: "scheduled",
          feedback: null,
          rating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    });
    await expect(
      caller.updateStatus({ id: "int1", status: "completed" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      caller.updateStatus({ id: "int1", status: "completed" }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it("updateStatus allows legal transition", async () => {
    const findFirst = vi.fn(async () => ({
      id: "int1",
      tenantId: "t1",
      candidateId: "cccccccccccccccccccccccc",
      candidateName: "Ada",
      position: "Eng",
      time: "2026-08-29T10:00",
      interviewType: "technical",
      interviewer: "John",
      source: null,
      recruiter: null,
      status: "scheduled",
      feedback: null,
      rating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const { caller } = interviewCaller(["hr"], {
      interview: { findFirst, updateMany },
    });
    const res = await caller.updateStatus({
      id: "int1",
      status: "in_progress",
    });
    expect(res.status).toBe("in_progress");
    expect(updateMany).toHaveBeenCalled();
  });

  it("completed accepts feedback and rating", async () => {
    const findFirst = vi.fn(async () => ({
      id: "int1",
      tenantId: "t1",
      candidateId: "cccccccccccccccccccccccc",
      candidateName: "Ada",
      position: "Eng",
      time: "2026-08-29T10:00",
      interviewType: "technical",
      interviewer: "John",
      source: null,
      recruiter: null,
      status: "feedback_needed",
      feedback: null,
      rating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const { caller } = interviewCaller(["hr"], {
      interview: { findFirst, updateMany },
    });
    const res = await caller.updateStatus({
      id: "int1",
      status: "completed",
      feedback: "great",
      rating: "5/5",
    });
    expect(res.status).toBe("completed");
    expect(res.feedback).toBe("great");
    expect(res.rating).toBe("5/5");
  });
});
