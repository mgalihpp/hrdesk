import { z } from "zod";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";
import { US_2026_SINGLE_BRACKETS } from "@/lib/payroll/tax";
import type { Role } from "@/lib/types";
import { auditRepo } from "@/server/repo/audit";
import { employeeRepo } from "@/server/repo/employee";
import { leaveRepo } from "@/server/repo/leave";
import { payRunRepo } from "@/server/repo/payrun";
import { timeEntryRepo } from "@/server/repo/timeEntry";
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
      const timeRepo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      const leaveRepoInst = leaveRepo(ctx.prisma, ctx.session.tenantId);
      const [allTimeEntries, allLeaves] = await Promise.all([
        timeRepo.list(),
        leaveRepoInst.list(),
      ]);
      const periodStartT = new Date(
        `${input.periodStart}T00:00:00.000Z`,
      ).getTime();
      const periodEndT = new Date(`${input.periodEnd}T23:59:59.999Z`).getTime();
      const approvedTimeEntries = allTimeEntries.filter((te) => {
        if (te.status !== "approved") return false;
        const t = new Date(te.startAt).getTime();
        return t >= periodStartT && t <= periodEndT;
      });
      const approvedLeaves = allLeaves.filter(
        (l) =>
          l.status === "approved" &&
          l.startDate <= input.periodEnd &&
          l.endDate >= input.periodStart,
      );
      const excludedByUnpaidLeave = new Set<string>();
      for (const l of approvedLeaves) {
        if (l.type === "unpaid")
          excludedByUnpaidLeave.add(l.employeeId as string);
      }
      employees = employees.filter(
        (e) => !excludedByUnpaidLeave.has(e.id as string),
      );
      if (employees.length === 0) {
        throw new Error("No eligible employees for pay run");
      }
      const timeSummary = {
        approvedTimeEntries: approvedTimeEntries.length,
        approvedLeaves: approvedLeaves.length,
        excludedByUnpaidLeave: [...excludedByUnpaidLeave],
      };
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
      try {
        await auditRepo(ctx.prisma, ctx.session.tenantId).create({
          actorId: ctx.session.id,
          action: "payrun.create",
          targetType: "payrun",
          targetId: saved.id,
          metadata: JSON.stringify({
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
          }),
        });
      } catch {}
      return { ...saved, timeSummary };
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
      const timeRepo = timeEntryRepo(ctx.prisma, ctx.session.tenantId);
      const leaveRepoInst = leaveRepo(ctx.prisma, ctx.session.tenantId);
      const [allTimeEntries, allLeaves] = await Promise.all([
        timeRepo.list(),
        leaveRepoInst.list(),
      ]);
      const periodStart = row.periodStart;
      const periodEnd = row.periodEnd;
      const periodStartT = new Date(`${periodStart}T00:00:00.000Z`).getTime();
      const periodEndT = new Date(`${periodEnd}T23:59:59.999Z`).getTime();
      const approvedTimeEntries = allTimeEntries.filter((te) => {
        if (te.status !== "approved") return false;
        const t = new Date(te.startAt).getTime();
        return t >= periodStartT && t <= periodEndT;
      });
      const approvedLeaves = allLeaves.filter(
        (l) =>
          l.status === "approved" &&
          l.startDate <= periodEnd &&
          l.endDate >= periodStart,
      );
      const excludedByUnpaidLeave = new Set<string>();
      for (const l of approvedLeaves) {
        if (l.type === "unpaid")
          excludedByUnpaidLeave.add(l.employeeId as string);
      }
      const timeSummary = {
        approvedTimeEntries: approvedTimeEntries.length,
        approvedLeaves: approvedLeaves.length,
        excludedByUnpaidLeave: [...excludedByUnpaidLeave],
      };
      return {
        payRun: row,
        payslips,
        timeSummary,
        timeEntries: approvedTimeEntries,
        leaves: approvedLeaves,
      };
    }),

  lock: rbacAnyProcedure(RUN_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      const result = await repo.lock(input.id as never);
      try {
        await auditRepo(ctx.prisma, ctx.session.tenantId).create({
          actorId: ctx.session.id,
          action: "payrun.lock",
          targetType: "payrun",
          targetId: input.id,
        });
      } catch {}
      return result;
    }),
});
