import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { InterviewId, TenantId } from "@/lib/types";
import { interviewRepo } from "@/server/repo/interview";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function makeInterviewRow(over: Record<string, unknown> = {}) {
  return {
    id: "int_1",
    tenantId: tenantA as string,
    candidateId: "cccccccccccccccccccccccc",
    candidateName: "Ada Lovelace",
    position: "Engineer",
    time: "2026-08-29T10:00:00.000Z",
    interviewType: "technical",
    interviewer: "John Doe",
    source: "referral",
    recruiter: "Jane Doe",
    status: "scheduled",
    feedback: null,
    rating: null,
    createdAt: new Date("2026-08-28T00:00:00.000Z"),
    updatedAt: new Date("2026-08-28T00:00:00.000Z"),
    ...over,
  };
}

function mockPrisma(opts: { interviews?: Record<string, unknown>[] } = {}) {
  const interviews = opts.interviews ?? [];
  return {
    interview: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `int_${interviews.length + 1}`,
          createdAt: new Date("2026-08-28T00:00:00.000Z"),
          updatedAt: new Date("2026-08-28T00:00:00.000Z"),
          status: "scheduled",
          source: null,
          recruiter: null,
          feedback: null,
          rating: null,
          ...data,
        };
        interviews.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return interviews.filter((r) => {
          if (where.tenantId && r.tenantId !== where.tenantId) return false;
          if (where.status && r.status !== where.status) return false;
          if (where.candidateId && r.candidateId !== where.candidateId)
            return false;
          return true;
        });
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            interviews.find((r) => {
              if (where.id && r.id !== where.id) return false;
              if (where.tenantId && r.tenantId !== where.tenantId) return false;
              return true;
            }) ?? null
          );
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          let count = 0;
          for (const r of interviews) {
            if (r.id === where.id && r.tenantId === where.tenantId) {
              Object.assign(r, data);
              count++;
            }
          }
          return { count };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          const before = interviews.length;
          for (let i = interviews.length - 1; i >= 0; i--) {
            if (
              interviews[i]?.id === where.id &&
              interviews[i]?.tenantId === where.tenantId
            ) {
              interviews.splice(i, 1);
            }
          }
          return { count: before - interviews.length };
        },
      ),
    },
    _stores: { interviews },
  } as unknown as PrismaClient & {
    _stores: { interviews: Record<string, unknown>[] };
  };
}

describe("interviewRepo", () => {
  it("create stores tenantId", async () => {
    const prisma = mockPrisma();
    const repo = interviewRepo(prisma, tenantA);
    const view = await repo.create({
      candidateId: "cccccccccccccccccccccccc",
      candidateName: "Ada Lovelace",
      position: "Engineer",
      time: "2026-08-29T10:00:00.000Z",
      interviewType: "technical",
      interviewer: "John Doe",
    });
    expect(view.tenantId).toBe(tenantA);
    expect(view.candidateName).toBe("Ada Lovelace");
    expect(prisma.interview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: tenantA }),
      }),
    );
    const listB = await interviewRepo(prisma, tenantB).list();
    expect(listB).toHaveLength(0);
  });

  it("tenant isolation: interview in A invisible to B", async () => {
    const prisma = mockPrisma();
    const repoA = interviewRepo(prisma, tenantA);
    const created = await repoA.create({
      candidateId: "cccccccccccccccccccccccc",
      candidateName: "Ada Lovelace",
      position: "Engineer",
      time: "2026-08-29T10:00:00.000Z",
      interviewType: "technical",
      interviewer: "John Doe",
    });
    const repoB = interviewRepo(prisma, tenantB);
    const fetched = await repoB.getById(created.id);
    expect(fetched).toBeNull();
    const listB = await repoB.list();
    expect(listB).toHaveLength(0);
  });

  it("list filters by tenantId", async () => {
    const rowA = makeInterviewRow({ id: "int_a", tenantId: tenantA as string });
    const rowB = makeInterviewRow({ id: "int_b", tenantId: tenantB as string });
    const prisma = mockPrisma({ interviews: [rowA, rowB] });
    const repoA = interviewRepo(prisma, tenantA);
    const list = await repoA.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("int_a");
    expect(prisma.interview.findMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA },
    });
  });

  it("list filters by status and candidateId", async () => {
    const row1 = makeInterviewRow({
      id: "int_1",
      status: "scheduled",
      candidateId: "cccccccccccccccccccccccc",
    });
    const row2 = makeInterviewRow({
      id: "int_2",
      status: "completed",
      candidateId: "cccccccccccccccccccccccc",
    });
    const row3 = makeInterviewRow({
      id: "int_3",
      status: "scheduled",
      candidateId: "dddddddddddddddddddddddd",
    });
    const prisma = mockPrisma({ interviews: [row1, row2, row3] });
    const repo = interviewRepo(prisma, tenantA);
    const filtered = await repo.list({ status: "scheduled" });
    expect(filtered).toHaveLength(2);
    const byCandidate = await repo.list({
      candidateId: "cccccccccccccccccccccccc",
    });
    expect(byCandidate).toHaveLength(2);
    const both = await repo.list({
      status: "scheduled",
      candidateId: "cccccccccccccccccccccccc",
    });
    expect(both).toHaveLength(1);
    expect(both[0]?.id).toBe("int_1");
  });

  it("getById scoped to tenant", async () => {
    const row = makeInterviewRow({ id: "int_1" });
    const prisma = mockPrisma({ interviews: [row] });
    const repoA = interviewRepo(prisma, tenantA);
    const found = await repoA.getById("int_1" as InterviewId);
    expect(found?.id).toBe("int_1");
    const repoB = interviewRepo(prisma, tenantB);
    const notFound = await repoB.getById("int_1" as InterviewId);
    expect(notFound).toBeNull();
    expect(prisma.interview.findFirst).toHaveBeenCalledWith({
      where: { id: "int_1", tenantId: tenantA },
    });
  });

  it("updateStatus rejects illegal transition", async () => {
    const row = makeInterviewRow({ id: "int_1", status: "scheduled" });
    const prisma = mockPrisma({ interviews: [row] });
    const repo = interviewRepo(prisma, tenantA);
    await expect(
      repo.updateStatus("int_1" as InterviewId, "completed"),
    ).rejects.toThrow("Invalid transition from scheduled to completed");
    expect(prisma.interview.updateMany).not.toHaveBeenCalled();
  });

  it("updateStatus allows legal linear progression", async () => {
    const row = makeInterviewRow({ id: "int_1", status: "scheduled" });
    const prisma = mockPrisma({ interviews: [row] });
    const repo = interviewRepo(prisma, tenantA);
    const s1 = await repo.updateStatus("int_1" as InterviewId, "in_progress");
    expect(s1.status).toBe("in_progress");
    const s2 = await repo.updateStatus(
      "int_1" as InterviewId,
      "feedback_needed",
    );
    expect(s2.status).toBe("feedback_needed");
    const s3 = await repo.updateStatus("int_1" as InterviewId, "completed", {
      feedback: "great",
      rating: "5/5",
    });
    expect(s3.status).toBe("completed");
    expect(s3.feedback).toBe("great");
    expect(s3.rating).toBe("5/5");
  });

  it("completed accepts feedback and rating", async () => {
    const row = makeInterviewRow({ id: "int_1", status: "feedback_needed" });
    const prisma = mockPrisma({ interviews: [row] });
    const repo = interviewRepo(prisma, tenantA);
    const updated = await repo.updateStatus(
      "int_1" as InterviewId,
      "completed",
      {
        feedback: "strong hire",
        rating: "excellent",
      },
    );
    expect(updated.feedback).toBe("strong hire");
    expect(updated.rating).toBe("excellent");
    expect(prisma.interview.updateMany).toHaveBeenCalledWith({
      where: { id: "int_1", tenantId: tenantA },
      data: {
        status: "completed",
        feedback: "strong hire",
        rating: "excellent",
      },
    });
  });

  it("remove scoped to tenant", async () => {
    const row = makeInterviewRow({ id: "int_1" });
    const prisma = mockPrisma({ interviews: [row] });
    const repoB = interviewRepo(prisma, tenantB);
    await repoB.remove("int_1" as InterviewId);
    expect(prisma.interview.deleteMany).toHaveBeenCalledWith({
      where: { id: "int_1", tenantId: tenantB },
    });
    expect(row.tenantId).toBe(tenantA as string);
    const repoA = interviewRepo(prisma, tenantA);
    await repoA.remove("int_1" as InterviewId);
    expect(prisma.interview.deleteMany).toHaveBeenCalledWith({
      where: { id: "int_1", tenantId: tenantA },
    });
    const list = await repoA.list();
    expect(list).toHaveLength(0);
  });

  it("listByCandidate filters by tenantId and candidateId", async () => {
    const rowA = makeInterviewRow({
      id: "int_a",
      candidateId: "cccccccccccccccccccccccc",
    });
    const rowB = makeInterviewRow({
      id: "int_b",
      candidateId: "dddddddddddddddddddddddd",
    });
    const prisma = mockPrisma({ interviews: [rowA, rowB] });
    const repo = interviewRepo(prisma, tenantA);
    const list = await repo.listByCandidate("cccccccccccccccccccccccc");
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("int_a");
    expect(prisma.interview.findMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA, candidateId: "cccccccccccccccccccccccc" },
    });
  });
});
