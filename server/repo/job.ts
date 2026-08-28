import type { PrismaClient } from "@prisma/client";
import type { Job, JobStatus, NewJob } from "@/lib/recruitment/types";
import type { JobId, TenantId } from "@/lib/types";

type StoredJob = {
  id: string;
  tenantId: string;
  title: string;
  department: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function toView(d: StoredJob): Job {
  return {
    id: d.id as JobId,
    tenantId: d.tenantId as TenantId,
    title: d.title,
    department: d.department,
    description: d.description,
    status: d.status as JobStatus,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

export function jobRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewJob): Promise<Job> {
      const created = await prisma.job.create({
        data: {
          tenantId,
          title: input.title,
          department: input.department ?? null,
          description: input.description ?? null,
          status: "open",
        },
      });
      return toView(created as unknown as StoredJob);
    },

    async list(): Promise<Job[]> {
      const rows = await prisma.job.findMany({ where: { tenantId } });
      return (rows as unknown as StoredJob[]).map(toView);
    },

    async getById(id: JobId): Promise<Job | null> {
      const row = await prisma.job.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row as unknown as StoredJob) : null;
    },

    async update(id: JobId, patch: Partial<NewJob>): Promise<void> {
      const data: Record<string, unknown> = {};
      if (patch.title !== undefined) data.title = patch.title;
      if (patch.department !== undefined) data.department = patch.department;
      if (patch.description !== undefined) data.description = patch.description;
      if (Object.keys(data).length === 0) return;
      await prisma.job.updateMany({
        where: { id: id as string, tenantId },
        data,
      });
    },

    async close(id: JobId): Promise<void> {
      await prisma.job.updateMany({
        where: { id: id as string, tenantId },
        data: { status: "closed" },
      });
    },

    async remove(id: JobId): Promise<void> {
      await prisma.job.deleteMany({ where: { id: id as string, tenantId } });
    },
  };
}
