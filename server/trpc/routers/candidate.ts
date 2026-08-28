import { z } from "zod";
import type { CandidateId, JobId, NewCandidate } from "@/lib/recruitment/types";
import { CANDIDATE_STAGES } from "@/lib/recruitment/types";
import type { Role } from "@/lib/types";
import { candidateRepo } from "@/server/repo/candidate";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const candidateRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        jobId: z.string().min(1),
        firstName: z.string().min(1).max(80),
        lastName: z.string().min(1).max(80),
        email: z.string().email(),
        phone: z.string().max(20).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      candidateRepo(ctx.prisma, ctx.session.tenantId).create(
        input as NewCandidate,
      ),
    ),

  list: protectedProcedure.query(({ ctx }) =>
    candidateRepo(ctx.prisma, ctx.session.tenantId).list(),
  ),

  listByJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) =>
      candidateRepo(ctx.prisma, ctx.session.tenantId).listByJob(
        input.jobId as JobId,
      ),
    ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      candidateRepo(ctx.prisma, ctx.session.tenantId).getById(
        input.id as CandidateId,
      ),
    ),

  moveStage: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        id: z.string(),
        to: z.enum(CANDIDATE_STAGES),
      }),
    )
    .mutation(({ ctx, input }) =>
      candidateRepo(ctx.prisma, ctx.session.tenantId).moveStage(
        input.id as CandidateId,
        input.to,
      ),
    ),

  hire: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        id: z.string(),
        compensation: z.number().int().min(0),
        hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(({ ctx, input }) =>
      candidateRepo(ctx.prisma, ctx.session.tenantId).hire(
        input.id as CandidateId,
        {
          compensation: input.compensation,
          hireDate: input.hireDate,
        },
      ),
    ),
});
