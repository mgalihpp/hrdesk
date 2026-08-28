import { z } from "zod";
import type { Role } from "@/lib/types";
import { leaveRepo } from "@/server/repo/leave";
import { timeEntryRepo } from "@/server/repo/timeEntry";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr", "manager"];
const APPROVE_ROLES: Role[] = ["owner", "admin", "hr", "manager"];

export const timeEntryRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z
        .object({
          employeeId: z.string().min(1),
          type: z.enum(["clock", "shift", "manual"]),
          startAt: z.string().datetime(),
          endAt: z.string().datetime(),
        })
        .refine((v) => new Date(v.startAt) < new Date(v.endAt), {
          message: "startAt must be before endAt",
          path: ["endAt"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      return repo.create(input);
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          employeeId: z.string().optional(),
          status: z.enum(["pending", "approved", "rejected"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      return repo.list(input ?? undefined);
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      const row = await repo.getById(input.id as never);
      if (!row) throw new Error("TimeEntry not found");
      return row;
    }),

  approve: rbacAnyProcedure(APPROVE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      return repo.approve(input.id as never, ctx.session.id);
    }),

  reject: rbacAnyProcedure(APPROVE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      return repo.reject(input.id as never, ctx.session.id);
    }),

  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      await repo.remove(input.id as never);
      return { ok: true as const };
    }),
});

export const leaveRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(
      z
        .object({
          employeeId: z.string().min(1),
          type: z.enum(["vacation", "sick", "unpaid", "other"]),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().max(500).optional().nullable(),
        })
        .refine((v) => v.startDate <= v.endDate, {
          message: "startDate must be <= endDate",
          path: ["endDate"],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      return repo.create({
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason ?? null,
      });
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          employeeId: z.string().optional(),
          status: z
            .enum(["pending", "approved", "rejected", "cancelled"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      return repo.list(input ?? undefined);
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      const row = await repo.getById(input.id as never);
      if (!row) throw new Error("Leave not found");
      return row;
    }),

  approve: rbacAnyProcedure(APPROVE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      return repo.approve(input.id as never, ctx.session.id);
    }),

  reject: rbacAnyProcedure(APPROVE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      return repo.reject(input.id as never, ctx.session.id);
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      return repo.cancel(input.id as never);
    }),

  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = leaveRepo(ctx.prisma, ctx.session.tenantId);
      await repo.remove(input.id as never);
      return { ok: true as const };
    }),
});
