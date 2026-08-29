import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { reportingRepo } from "@/server/repo/reporting";
import { createTRPCRouter, protectedProcedure } from "../init";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const rangeSchema = z
  .object({
    from: z.string().regex(dateRegex),
    to: z.string().regex(dateRegex),
  })
  .optional();

function validateRange(range: { from: string; to: string } | undefined) {
  if (range && range.from > range.to) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "from must be <= to" });
  }
  return range;
}

export const reportingRouter = createTRPCRouter({
  overview: protectedProcedure.input(rangeSchema).query(({ ctx, input }) => {
    const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
    return repo.overview(
      validateRange(input as { from: string; to: string } | undefined),
    );
  }),

  payrollSeries: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => {
      const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getPayrollSeries(
        validateRange(input as { from: string; to: string } | undefined),
      );
    }),

  headcount: protectedProcedure
    .input(z.object({}).optional())
    .query(({ ctx }) => {
      const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getHeadcount();
    }),

  attendance: protectedProcedure.input(rangeSchema).query(({ ctx, input }) => {
    const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
    return repo.getAttendance(
      validateRange(input as { from: string; to: string } | undefined),
    );
  }),

  pipeline: protectedProcedure
    .input(z.object({}).optional())
    .query(({ ctx }) => {
      const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getPipeline();
    }),

  billing: protectedProcedure.input(rangeSchema).query(({ ctx, input }) => {
    const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
    return repo.getBilling(
      validateRange(input as { from: string; to: string } | undefined),
    );
  }),

  syncHealth: protectedProcedure
    .input(z.object({}).optional())
    .query(({ ctx }) => {
      const repo = reportingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getSyncHealth();
    }),
});
