import { z } from "zod";
import type { Role } from "@/lib/types";
import { eventRepo } from "@/server/repo/event";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const eventRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(20).optional() })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const repo = eventRepo(ctx.prisma, ctx.session.tenantId);
      return repo.listUpcoming(input?.limit ?? 3);
    }),

  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z
        .object({
          title: z.string().min(1).max(200),
          location: z.string().max(200).optional().nullable(),
          startAt: z
            .string()
            .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid startAt"),
          endAt: z
            .string()
            .optional()
            .nullable()
            .refine((s) => !s || !Number.isNaN(Date.parse(s)), "Invalid endAt"),
          type: z
            .enum(["meeting", "interview", "payroll"])
            .optional()
            .default("meeting"),
        })
        .refine((v) => !v.endAt || new Date(v.startAt) < new Date(v.endAt), {
          message: "endAt must be after startAt",
          path: ["endAt"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = eventRepo(ctx.prisma, ctx.session.tenantId);
      return repo.create({
        title: input.title,
        location: input.location ?? null,
        startAt: input.startAt,
        endAt: input.endAt ?? null,
        type: input.type,
      });
    }),
});
