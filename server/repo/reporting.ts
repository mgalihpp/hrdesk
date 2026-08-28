import type { PrismaClient } from "@prisma/client";
import {
  attendance,
  billingSummary,
  headcount,
  payrollSeries,
  payrollSummary,
  pipeline,
  syncHealth,
} from "@/lib/reporting/aggregates";
import type { ReportingOverview, ReportRange } from "@/lib/reporting/types";
import type { TenantId } from "@/lib/types";

type ReportingPrisma = PrismaClient & {
  employee: { findMany: (args: unknown) => Promise<unknown[]> };
  payRun: { findMany: (args: unknown) => Promise<unknown[]> };
  payslip: { findMany: (args: unknown) => Promise<unknown[]> };
  timeEntry: { findMany: (args: unknown) => Promise<unknown[]> };
  candidate: { findMany: (args: unknown) => Promise<unknown[]> };
  job: { findMany: (args: unknown) => Promise<unknown[]> };
  invoice: { findMany: (args: unknown) => Promise<unknown[]> };
  integrationSync: { findMany: (args: unknown) => Promise<unknown[]> };
};

function inRangeDate(dateStr: string, range: ReportRange | undefined): boolean {
  if (!range) return true;
  return dateStr >= range.from && dateStr <= range.to;
}

export function reportingRepo(prisma: PrismaClient, tenantId: TenantId) {
  const p = prisma as unknown as ReportingPrisma;

  async function overview(range?: ReportRange): Promise<ReportingOverview> {
    const [
      employees,
      payRunsRaw,
      payslipsRaw,
      timeEntriesRaw,
      candidatesRaw,
      jobsRaw,
      invoicesRaw,
      syncsRaw,
    ] = await Promise.all([
      p.employee.findMany({ where: { tenantId } }) as Promise<
        { status: string }[]
      >,
      p.payRun.findMany({ where: { tenantId } }) as Promise<
        { id: string; periodStart: string; periodEnd: string }[]
      >,
      p.payslip.findMany({ where: { tenantId } }) as Promise<
        {
          gross: number;
          deductions: number;
          tax: number;
          net: number;
          payRunId: string;
          periodStart?: string;
          periodEnd?: string;
        }[]
      >,
      p.timeEntry.findMany({ where: { tenantId } }) as Promise<
        {
          status: string;
          startAt: Date | string;
          endAt: Date | string;
          createdAt?: Date | string;
        }[]
      >,
      p.candidate.findMany({ where: { tenantId } }) as Promise<
        { stage: string }[]
      >,
      p.job.findMany({ where: { tenantId } }) as Promise<{ status: string }[]>,
      p.invoice.findMany({ where: { tenantId } }) as Promise<
        {
          amount: number;
          status: string;
          periodStart: string;
          periodEnd: string;
        }[]
      >,
      p.integrationSync.findMany({ where: { tenantId } }) as Promise<
        { status: string }[]
      >,
    ]);

    let payRuns = payRunsRaw as {
      id: string;
      periodStart: string;
      periodEnd: string;
    }[];
    let payslips = payslipsRaw as {
      gross: number;
      deductions: number;
      tax: number;
      net: number;
      payRunId: string;
      periodStart?: string;
      periodEnd?: string;
    }[];
    let invoices = invoicesRaw as {
      amount: number;
      status: string;
      periodStart: string;
      periodEnd: string;
    }[];

    if (range) {
      payRuns = payRuns.filter(
        (r) =>
          inRangeDate(r.periodStart, range) && inRangeDate(r.periodEnd, range),
      );
      const payRunIds = new Set(payRuns.map((r) => r.id));
      if (payRunIds.size > 0) {
        payslips = payslips.filter((s) => payRunIds.has(s.payRunId));
      } else if (payslips.length > 0 && payslips[0].periodStart !== undefined) {
        payslips = payslips.filter(
          (s) =>
            inRangeDate(s.periodStart as string, range) &&
            inRangeDate(s.periodEnd as string, range),
        );
      }
      invoices = invoices.filter(
        (inv) =>
          inRangeDate(inv.periodStart, range) &&
          inRangeDate(inv.periodEnd, range),
      );
    }

    const payslipRows = payslips.map((s) => {
      const pr = payRuns.find((r) => r.id === s.payRunId);
      return {
        gross: s.gross,
        deductions: s.deductions,
        tax: s.tax,
        net: s.net,
        periodStart: s.periodStart ?? pr?.periodStart ?? "",
        periodEnd: s.periodEnd ?? pr?.periodEnd ?? "",
        payRunId: s.payRunId,
      };
    });

    const payroll = payrollSummary(payslipRows, payRuns);
    const hc = headcount(employees as { status: string }[]);
    const att = attendance(
      timeEntriesRaw as unknown as {
        status: string;
        startAt: string | Date;
        endAt: string | Date;
      }[],
    );
    const pipe = pipeline(
      candidatesRaw as { stage: string }[],
      jobsRaw as { status: string }[],
    );
    const billing = billingSummary(
      invoices as { amount: number; status: string }[],
    );
    const sync = syncHealth(syncsRaw as { status: string }[]);

    return {
      payroll,
      headcount: hc,
      attendance: att,
      pipeline: pipe,
      billing,
      sync,
    };
  }

  async function getPayrollSeries(range?: ReportRange) {
    const [payRunsRaw, payslipsRaw] = await Promise.all([
      p.payRun.findMany({ where: { tenantId } }) as Promise<
        { id: string; periodStart: string; periodEnd: string }[]
      >,
      p.payslip.findMany({ where: { tenantId } }) as Promise<
        {
          gross: number;
          deductions: number;
          tax: number;
          net: number;
          payRunId: string;
        }[]
      >,
    ]);
    let payRuns = payRunsRaw;
    if (range) {
      payRuns = payRuns.filter(
        (r) =>
          inRangeDate(r.periodStart, range) && inRangeDate(r.periodEnd, range),
      );
    }
    const payRunIds = new Set(payRuns.map((r) => r.id));
    let payslips = payslipsRaw as {
      gross: number;
      deductions: number;
      tax: number;
      net: number;
      payRunId: string;
    }[];
    payslips = payslips.filter((s) => payRunIds.has(s.payRunId));
    const rows = payslips.map((s) => {
      const pr = payRuns.find((r) => r.id === s.payRunId);
      return {
        gross: s.gross,
        deductions: s.deductions,
        tax: s.tax,
        net: s.net,
        periodStart: pr?.periodStart ?? "",
        periodEnd: pr?.periodEnd ?? "",
        payRunId: s.payRunId,
      };
    });
    return payrollSeries(rows);
  }

  async function getHeadcount() {
    const employees = (await p.employee.findMany({ where: { tenantId } })) as {
      status: string;
    }[];
    return headcount(employees);
  }

  async function getAttendance(range?: ReportRange) {
    let timeEntries = (await p.timeEntry.findMany({ where: { tenantId } })) as {
      status: string;
      startAt: Date | string;
      endAt: Date | string;
    }[];
    if (range) {
      timeEntries = timeEntries.filter((te) => {
        const d = new Date(te.startAt).toISOString().slice(0, 10);
        return inRangeDate(d, range);
      });
    }
    return attendance(timeEntries);
  }

  async function getPipeline() {
    const [candidates, jobs] = await Promise.all([
      p.candidate.findMany({ where: { tenantId } }) as Promise<
        { stage: string }[]
      >,
      p.job.findMany({ where: { tenantId } }) as Promise<{ status: string }[]>,
    ]);
    return pipeline(
      candidates as { stage: string }[],
      jobs as { status: string }[],
    );
  }

  async function getBilling(range?: ReportRange) {
    let invoices = (await p.invoice.findMany({ where: { tenantId } })) as {
      amount: number;
      status: string;
      periodStart: string;
      periodEnd: string;
    }[];
    if (range) {
      invoices = invoices.filter(
        (inv) =>
          inRangeDate(inv.periodStart, range) &&
          inRangeDate(inv.periodEnd, range),
      );
    }
    return billingSummary(invoices as { amount: number; status: string }[]);
  }

  async function getSyncHealth() {
    const syncs = (await p.integrationSync.findMany({
      where: { tenantId },
    })) as { status: string }[];
    return syncHealth(syncs as { status: string }[]);
  }

  return {
    overview,
    getPayrollSeries,
    getHeadcount,
    getAttendance,
    getPipeline,
    getBilling,
    getSyncHealth,
  };
}
