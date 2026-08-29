import type { PrismaClient } from "@prisma/client";
import { canTransition } from "@/lib/interviews/pipeline";
import type {
  Interview,
  InterviewStatus,
  NewInterview,
} from "@/lib/interviews/types";
import type { InterviewId, TenantId } from "@/lib/types";

type StoredInterview = {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string;
  position: string;
  time: string;
  interviewType: string;
  interviewer: string;
  source: string | null;
  recruiter: string | null;
  status: string;
  feedback: string | null;
  rating: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toView(d: StoredInterview): Interview {
  return {
    id: d.id as InterviewId,
    tenantId: d.tenantId as TenantId,
    candidateId: d.candidateId,
    candidateName: d.candidateName,
    position: d.position,
    time: d.time,
    interviewType: d.interviewType,
    interviewer: d.interviewer,
    source: d.source,
    recruiter: d.recruiter,
    status: d.status as InterviewStatus,
    feedback: d.feedback,
    rating: d.rating,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

export function interviewRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewInterview): Promise<Interview> {
      const created = await prisma.interview.create({
        data: {
          tenantId,
          candidateId: input.candidateId,
          candidateName: input.candidateName,
          position: input.position,
          time: input.time,
          interviewType: input.interviewType,
          interviewer: input.interviewer,
          source: input.source ?? null,
          recruiter: input.recruiter ?? null,
          status: input.status ?? "scheduled",
          feedback: input.feedback ?? null,
          rating: input.rating ?? null,
        },
      });
      return toView(created as unknown as StoredInterview);
    },

    async list(filters?: {
      status?: InterviewStatus;
      candidateId?: string;
    }): Promise<Interview[]> {
      const where: Record<string, unknown> = { tenantId };
      if (filters?.status) where.status = filters.status;
      if (filters?.candidateId) where.candidateId = filters.candidateId;
      const rows = await prisma.interview.findMany({ where });
      return (rows as unknown as StoredInterview[]).map(toView);
    },

    async listByCandidate(candidateId: string): Promise<Interview[]> {
      const rows = await prisma.interview.findMany({
        where: { tenantId, candidateId },
      });
      return (rows as unknown as StoredInterview[]).map(toView);
    },

    async getById(id: InterviewId): Promise<Interview | null> {
      const row = await prisma.interview.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row as unknown as StoredInterview) : null;
    },

    async updateStatus(
      id: InterviewId,
      to: InterviewStatus,
      extra?: { feedback?: string; rating?: string },
    ): Promise<Interview> {
      const row = await prisma.interview.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Interview not found");
      const stored = row as unknown as StoredInterview;
      const from = stored.status as InterviewStatus;
      if (!canTransition(from, to)) {
        throw new Error(`Invalid transition from ${from} to ${to}`);
      }
      const data: Record<string, unknown> = { status: to };
      if (to === "completed") {
        if (extra?.feedback !== undefined) data.feedback = extra.feedback;
        if (extra?.rating !== undefined) data.rating = extra.rating;
      }
      await prisma.interview.updateMany({
        where: { id: id as string, tenantId },
        data,
      });
      return toView({ ...stored, ...data } as StoredInterview);
    },

    async remove(id: InterviewId): Promise<void> {
      await prisma.interview.deleteMany({
        where: { id: id as string, tenantId },
      });
    },
  };
}
