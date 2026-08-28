import { z } from "zod";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";
import { US_2026_SINGLE_BRACKETS } from "@/lib/payroll/tax";
import type { Role } from "@/lib/types";
import { employeeRepo } from "@/server/repo/employee";
import { payRunRepo } from "@/server/repo/payrun";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const RUN_ROLES: Role[] = ["owner", "payrollAdmin"];

export const payrunRouter = createTRPCRouter({
  create: rbacAnyProcedure(RUN_ROLES)
    .input(
      z.object({
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        entityId: z.string().min(1).default("default"),
        employeeIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.periodStart > input.periodEnd) {
        throw new Error("periodStart must be <= periodEnd");
      }
      const empRepo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      let employees = await empRepo.list();
      if (input.employeeIds && input.employeeIds.length > 0) {
        const set = new Set(input.employeeIds);
        employees = employees.filter((e) => set.has(e.id as string));
      }
      employees = employees.filter(
        (e) => e.status === "active" || e.status === "on_leave",
      );
      if (employees.length === 0) {
        throw new Error("No eligible employees for pay run");
      }
      const idempotencyKey = `${ctx.session.tenantId}:${input.periodStart}:${input.periodEnd}:${input.entityId}`;
      const payrollInput = {
        tenantId: ctx.session.tenantId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        entityId: input.entityId,
        idempotencyKey,
        taxBrackets: US_2026_SINGLE_BRACKETS,
        employees: employees.map((e) => ({
          employeeId: e.id as unknown as string,
          tenantId: e.tenantId as unknown as string,
          gross: cents(e.compensation as number),
          deductions: cents(0),
        })),
      };
      const result = runPayroll(payrollInput as never);
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      const saved = await repo.create(result as never);
      return saved;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
    return repo.list();
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      const row = await repo.getById(input.id as never);
      if (!row) {
        throw new Error("PayRun not found");
      }
      const payslips = await repo.getPayslips(input.id as never);
      return { payRun: row, payslips };
    }),

  lock: rbacAnyProcedure(RUN_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      return repo.lock(input.id as never);
    }),
});
