import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { INTERVIEW_STATUSES } from "@/lib/interviews/types";
import type { InterviewId, Role } from "@/lib/types";
import { interviewRepo } from "@/server/repo/interview";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const interviewRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        candidateId: z.string().min(1),
        candidateName: z.string().min(1).max(120),
        position: z.string().min(1).max(120),
        time: z.string().min(1).max(50),
        interviewType: z.string().min(1).max(50),
        interviewer: z.string().min(1).max(120),
        source: z.string().max(120).nullable().optional(),
        recruiter: z.string().max(120).nullable().optional(),
        status: z.enum(INTERVIEW_STATUSES).optional(),
        feedback: z.string().max(2000).nullable().optional(),
        rating: z.string().max(20).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      interviewRepo(ctx.prisma, ctx.session.tenantId).create(input),
    ),

  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(INTERVIEW_STATUSES).optional(),
          candidateId: z.string().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      interviewRepo(ctx.prisma, ctx.session.tenantId).list(input),
    ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      interviewRepo(ctx.prisma, ctx.session.tenantId).getById(
        input.id as InterviewId,
      ),
    ),

  updateStatus: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        id: z.string(),
        status: z.enum(INTERVIEW_STATUSES),
        feedback: z.string().max(2000).optional(),
        rating: z.string().max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await interviewRepo(
          ctx.prisma,
          ctx.session.tenantId,
        ).updateStatus(input.id as InterviewId, input.status, {
          feedback: input.feedback,
          rating: input.rating,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.startsWith("Invalid transition")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: msg });
        }
        throw e;
      }
    }),

  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      interviewRepo(ctx.prisma, ctx.session.tenantId).remove(
        input.id as InterviewId,
      ),
    ),
});
