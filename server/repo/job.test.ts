import { describe, expect, it, vi } from "vitest";
import type { JobId } from "@/lib/recruitment/types";
import type { TenantId } from "@/lib/types";
import { jobRepo } from "@/server/repo/job";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function mockPrisma(store: Record<string, unknown>[] = []) {
  return {
    job: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `job_${store.length + 1}`,
          createdAt: new Date("2026-08-28T00:00:00.000Z"),
          updatedAt: new Date("2026-08-28T00:00:00.000Z"),
          status: "open",
          ...data,
        };
        store.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return store.filter((r) => {
          if (where.tenantId && r.tenantId !== where.tenantId) return false;
          if (where.status && r.status !== where.status) return false;
          return true;
        });
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            store.find((r) => {
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
          for (const r of store) {
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
          const before = store.length;
          for (let i = store.length - 1; i >= 0; i--) {
            if (
              store[i]?.id === where.id &&
              store[i]?.tenantId === where.tenantId
            ) {
              store.splice(i, 1);
            }
          }
          return { count: before - store.length };
        },
      ),
    },
  } as unknown as import("@prisma/client").PrismaClient;
}

describe("jobRepo tenancy", () => {
  it("create includes tenantId", async () => {
    const prisma = mockPrisma();
    const repo = jobRepo(prisma, tenantA);
    await repo.create({
      title: "FE Eng",
      department: "Eng",
      description: "build ui",
    });
    expect(prisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: tenantA }),
      }),
    );
    // ensure tenant isolation: B cannot see A's job
    const repoB = jobRepo(prisma, tenantB);
    const listB = await repoB.list();
    expect(listB).toHaveLength(0);
  });

  it("list filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [];
    const prisma = mockPrisma(store);
    store.push({
      id: "job_1",
      tenantId: tenantA,
      title: "A job",
      department: null,
      description: null,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    store.push({
      id: "job_2",
      tenantId: tenantB,
      title: "B job",
      department: null,
      description: null,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repoA = jobRepo(prisma, tenantA);
    const list = await repoA.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.tenantId).toBe(tenantA);
    // also assert underlying call had tenantId
    expect(prisma.job.findMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA },
    });
  });

  it("getById returns null for other tenant", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "job_other",
        tenantId: tenantB,
        title: "Other",
        department: null,
        description: null,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = jobRepo(prisma, tenantA);
    const res = await repoA.getById("job_other" as JobId);
    expect(res).toBeNull();
    expect(prisma.job.findFirst).toHaveBeenCalledWith({
      where: { id: "job_other", tenantId: tenantA },
    });
  });

  it("update filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "job_1",
        tenantId: tenantB,
        title: "Original",
        department: null,
        description: null,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = jobRepo(prisma, tenantA);
    await repoA.update("job_1" as JobId, { title: "Hacked" });
    expect(prisma.job.updateMany).toHaveBeenCalledWith({
      where: { id: "job_1", tenantId: tenantA },
      data: expect.objectContaining({ title: "Hacked" }),
    });
    // ensure store not mutated for other tenant
    expect(store[0]?.title).toBe("Original");
  });

  it("close is idempotent for already closed", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "job_1",
        tenantId: tenantA,
        title: "FE Eng",
        department: null,
        description: null,
        status: "closed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repo = jobRepo(prisma, tenantA);
    await repo.close("job_1" as JobId);
    expect(prisma.job.updateMany).toHaveBeenCalledWith({
      where: { id: "job_1", tenantId: tenantA },
      data: { status: "closed" },
    });
    expect(store[0]?.status).toBe("closed");
    // second close same
    await repo.close("job_1" as JobId);
    expect(store[0]?.status).toBe("closed");
  });

  it("remove filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "job_1",
        tenantId: tenantB,
        title: "B job",
        department: null,
        description: null,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = jobRepo(prisma, tenantA);
    await repoA.remove("job_1" as JobId);
    expect(prisma.job.deleteMany).toHaveBeenCalledWith({
      where: { id: "job_1", tenantId: tenantA },
    });
    expect(store).toHaveLength(1);
  });
});
