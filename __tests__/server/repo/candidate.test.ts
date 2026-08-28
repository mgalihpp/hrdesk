import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";
import type { CandidateId, JobId } from "@/lib/recruitment/types";
import type { TenantId } from "@/lib/types";
import { candidateRepo } from "@/server/repo/candidate";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;
const jobA = "cccccccccccccccccccccccc" as unknown as JobId;
const _jobB = "dddddddddddddddddddddddd" as unknown as JobId;

function makeCandidateRow(over: Record<string, unknown> = {}) {
  return {
    id: "cand_1",
    tenantId: tenantA as string,
    jobId: jobA as string,
    firstName: "Ada",
    lastName: "Lovelace",
    emailEnc: encrypt("ada@example.com"),
    phoneEnc: encrypt("555-0100"),
    stage: "applied",
    hiredEmployeeId: null,
    createdAt: new Date("2026-08-28T00:00:00.000Z"),
    updatedAt: new Date("2026-08-28T00:00:00.000Z"),
    ...over,
  };
}

function mockPrisma(
  opts: {
    jobs?: Record<string, unknown>[];
    candidates?: Record<string, unknown>[];
    employees?: Record<string, unknown>[];
  } = {},
) {
  const jobs = opts.jobs ?? [
    { id: jobA as string, tenantId: tenantA as string, title: "Eng" },
  ];
  const candidates = opts.candidates ?? [];
  const employees = opts.employees ?? [];

  return {
    job: {
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            jobs.find(
              (j) => j.id === where.id && j.tenantId === where.tenantId,
            ) ?? null
          );
        },
      ),
    },
    candidate: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `cand_${candidates.length + 1}`,
          createdAt: new Date("2026-08-28T00:00:00.000Z"),
          updatedAt: new Date("2026-08-28T00:00:00.000Z"),
          stage: "applied",
          hiredEmployeeId: null,
          ...data,
        };
        candidates.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return candidates.filter((c) => {
          if (where.tenantId && c.tenantId !== where.tenantId) return false;
          if (where.jobId && c.jobId !== where.jobId) return false;
          if (where.stage && c.stage !== where.stage) return false;
          return true;
        });
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            candidates.find((c) => {
              if (where.id && c.id !== where.id) return false;
              if (where.tenantId && c.tenantId !== where.tenantId) return false;
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
          for (const c of candidates) {
            if (c.id === where.id && c.tenantId === where.tenantId) {
              Object.assign(c, data);
              count++;
            }
          }
          return { count };
        },
      ),
    },
    employee: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `emp_${employees.length + 1}`,
          createdAt: new Date("2026-08-28T00:00:00.000Z"),
          ...data,
        };
        employees.push(row);
        return row;
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            employees.find(
              (e) => e.id === where.id && e.tenantId === where.tenantId,
            ) ?? null
          );
        },
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return employees.filter((e) => e.tenantId === where.tenantId);
      }),
    },
    _stores: { jobs, candidates, employees },
  } as unknown as PrismaClient & {
    _stores: {
      jobs: Record<string, unknown>[];
      candidates: Record<string, unknown>[];
      employees: Record<string, unknown>[];
    };
  };
}

describe("candidateRepo", () => {
  it("encrypts PII at write and decrypts at read", async () => {
    const prisma = mockPrisma();
    const repo = candidateRepo(prisma, tenantA);
    const view = await repo.create({
      jobId: jobA,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "555-0100",
    });
    expect(view.email).toBe("ada@example.com");
    expect(view.phone).toBe("555-0100");

    const stores = (
      prisma as unknown as {
        _stores: { candidates: Record<string, unknown>[] };
      }
    )._stores.candidates;
    const stored = stores[0];
    expect(stored).toBeDefined();
    expect(stored?.emailEnc).not.toBe("ada@example.com");
    expect(decrypt(stored?.emailEnc as string)).toBe("ada@example.com");
    expect(decrypt(stored?.phoneEnc as string)).toBe("555-0100");

    // getById decrypts
    const fetched = await repo.getById(view.id);
    expect(fetched?.email).toBe("ada@example.com");
    expect(fetched?.phone).toBe("555-0100");

    // list decrypts
    const list = await repo.list();
    expect(list[0]?.email).toBe("ada@example.com");
  });

  it("tenant isolation: candidate in A invisible to B", async () => {
    const prisma = mockPrisma();
    const repoA = candidateRepo(prisma, tenantA);
    const created = await repoA.create({
      jobId: jobA,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: null,
    });
    const repoB = candidateRepo(prisma, tenantB);
    const fetched = await repoB.getById(created.id);
    expect(fetched).toBeNull();
    const listB = await repoB.list();
    expect(listB).toHaveLength(0);
    const byJobB = await repoB.listByJob(jobA);
    expect(byJobB).toHaveLength(0);
  });

  it("create validates job belongs to same tenant", async () => {
    const prisma = mockPrisma({
      jobs: [
        {
          id: jobA as string,
          tenantId: tenantB as string,
          title: "Other tenant job",
        },
      ],
    });
    const repoA = candidateRepo(prisma, tenantA);
    await expect(
      repoA.create({
        jobId: jobA,
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: null,
      }),
    ).rejects.toThrow();
    expect(prisma.candidate.create).not.toHaveBeenCalled();
  });

  it("moveStage rejects illegal transition", async () => {
    const row = makeCandidateRow({ stage: "applied" });
    const prisma = mockPrisma({ candidates: [row] });
    const repo = candidateRepo(prisma, tenantA);
    await expect(
      repo.moveStage(row.id as CandidateId, "hired"),
    ).rejects.toThrow();
    // ensure no update
    expect(prisma.candidate.updateMany).not.toHaveBeenCalled();
  });

  it("moveStage allows legal transition", async () => {
    const row = makeCandidateRow({ stage: "applied" });
    const prisma = mockPrisma({ candidates: [row] });
    const repo = candidateRepo(prisma, tenantA);
    const updated = await repo.moveStage(row.id as CandidateId, "screening");
    expect(updated.stage).toBe("screening");
    expect(prisma.candidate.updateMany).toHaveBeenCalledWith({
      where: { id: row.id, tenantId: tenantA },
      data: { stage: "screening" },
    });
  });

  it("hire requires offer stage", async () => {
    const row = makeCandidateRow({ stage: "screening" });
    const prisma = mockPrisma({ candidates: [row] });
    const repo = candidateRepo(prisma, tenantA);
    await expect(
      repo.hire(row.id as CandidateId, {
        compensation: 8000000,
        hireDate: "2026-08-28",
      }),
    ).rejects.toThrow(/offer/i);
    expect(prisma.employee.create).not.toHaveBeenCalled();
  });

  it("hire is idempotent: second call returns same employee, no duplicate", async () => {
    const row = makeCandidateRow({ stage: "offer", id: "cand_hire" });
    const prisma = mockPrisma({ candidates: [row] });
    const repo = candidateRepo(prisma, tenantA);

    const emp1 = await repo.hire("cand_hire" as CandidateId, {
      compensation: 8000000,
      hireDate: "2026-08-28",
    });
    expect(emp1.email).toBe("ada@example.com");
    expect(prisma.employee.create).toHaveBeenCalledTimes(1);

    const emp2 = await repo.hire("cand_hire" as CandidateId, {
      compensation: 8000000,
      hireDate: "2026-08-28",
    });
    expect(emp2.id).toBe(emp1.id);
    expect(prisma.employee.create).toHaveBeenCalledTimes(1); // no duplicate
    // candidate should be marked hired
    expect(row.stage).toBe("hired");
    expect(row.hiredEmployeeId).toBe(emp1.id);
  });

  it("hire creates employee with provided compensation", async () => {
    const row = makeCandidateRow({ stage: "offer", id: "cand_comp" });
    const prisma = mockPrisma({ candidates: [row] });
    const repo = candidateRepo(prisma, tenantA);
    const emp = await repo.hire("cand_comp" as CandidateId, {
      compensation: 123456,
      hireDate: "2026-08-28",
    });
    expect(emp.compensation).toBe(123456);
    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: tenantA,
          compensation: 123456,
          hireDate: "2026-08-28",
          status: "active",
        }),
      }),
    );
  });

  it("listByJob filters by tenantId", async () => {
    const rowA = makeCandidateRow({
      id: "cand_a",
      tenantId: tenantA as string,
      jobId: jobA as string,
    });
    const rowB = makeCandidateRow({
      id: "cand_b",
      tenantId: tenantB as string,
      jobId: jobA as string,
    });
    // use prisma with both candidates but jobA belongs to A; B's candidate is separate
    const prisma = mockPrisma({
      jobs: [{ id: jobA as string, tenantId: tenantA as string, title: "Eng" }],
      candidates: [rowA, rowB],
    });
    const repoA = candidateRepo(prisma, tenantA);
    const list = await repoA.listByJob(jobA);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("cand_a");
    expect(prisma.candidate.findMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA, jobId: jobA },
    });
  });
});
