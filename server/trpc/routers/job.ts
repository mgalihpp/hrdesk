import { z } from "zod";
import type { JobId, Role } from "@/lib/types";
import { jobRepo } from "@/server/repo/job";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const jobRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        title: z.string().min(2).max(120),
        department: z.string().max(80).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      jobRepo(ctx.prisma, ctx.session.tenantId).create(input),
    ),

  list: protectedProcedure.query(({ ctx }) =>
    jobRepo(ctx.prisma, ctx.session.tenantId).list(),
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      jobRepo(ctx.prisma, ctx.session.tenantId).getById(input.id as JobId),
    ),

  update: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(2).max(120).optional(),
        department: z.string().max(80).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return jobRepo(ctx.prisma, ctx.session.tenantId).update(
        id as JobId,
        patch,
      );
    }),

  close: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      jobRepo(ctx.prisma, ctx.session.tenantId).close(input.id as JobId),
    ),

  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      jobRepo(ctx.prisma, ctx.session.tenantId).remove(input.id as JobId),
    ),
});
