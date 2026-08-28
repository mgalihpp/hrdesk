import { z } from "zod";
import type { AuditLogId } from "@/lib/audit/types";
import { auditRepo } from "@/server/repo/audit";
import { createTRPCRouter, protectedProcedure } from "../init";

export const auditRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const repo = auditRepo(ctx.prisma, ctx.session.tenantId);
      return repo.list({
        from: input?.from,
        to: input?.to,
        limit: input?.limit,
        cursor: input?.cursor,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = auditRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getById(input.id as AuditLogId);
    }),
});
