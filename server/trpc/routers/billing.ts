import { z } from "zod";
import { cents } from "@/lib/money";
import type { InvoiceId } from "@/lib/types";
import { billingRepo } from "@/server/repo/billing";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

export const billingRouter = createTRPCRouter({
  getSubscription: protectedProcedure.query(({ ctx }) => {
    const repo = billingRepo(ctx.prisma, ctx.session.tenantId);
    return repo.getSubscription();
  }),

  upsertSubscription: rbacAnyProcedure(["owner", "admin"])
    .input(
      z.object({
        plan: z.enum(["free", "starter", "professional", "business"]),
        billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
        seats: z.number().int().min(1).default(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      const repo = billingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.upsertSubscription(input);
    }),

  listInvoices: protectedProcedure.query(({ ctx }) => {
    const repo = billingRepo(ctx.prisma, ctx.session.tenantId);
    return repo.listInvoices();
  }),

  createInvoice: rbacAnyProcedure(["owner", "admin"])
    .input(
      z.object({
        amount: z.number().int().nonnegative(),
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
        idempotencyKey: z.string().min(1).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const repo = billingRepo(ctx.prisma, ctx.session.tenantId);
      const key =
        input.idempotencyKey ??
        `${ctx.session.tenantId}:${input.periodStart}:${input.periodEnd}:${input.amount}:${input.billingInterval}`;
      return repo.createInvoice({
        amount: cents(input.amount),
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        billingInterval: input.billingInterval,
        idempotencyKey: key,
      });
    }),

  getInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = billingRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getInvoiceById(input.id as InvoiceId);
    }),
});
