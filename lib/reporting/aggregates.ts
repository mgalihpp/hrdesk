import { type Cents, cents } from "@/lib/money";
import type {
  AttendanceSummary,
  BillingSummary,
  HeadcountSummary,
  PayrollSeriesPoint,
  PayrollSummary,
  PipelineSummary,
  SyncSummary,
} from "./types";

export type PayslipRow = {
  gross: number;
  deductions: number;
  tax: number;
  net: number;
  periodStart: string;
  periodEnd: string;
  payRunId: string;
};

export type PayRunRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
};

export type EmployeeRow = {
  status: string;
};

export type TimeEntryRow = {
  status: string;
  startAt: string | Date;
  endAt: string | Date;
};

export type CandidateRow = {
  stage: string;
};

export type JobRow = {
  status: string;
};

export type InvoiceRow = {
  amount: number;
  status: string;
};

export type SyncRow = {
  status: string;
};

export function payrollSummary(
  payslips: PayslipRow[],
  payRuns: PayRunRow[],
): PayrollSummary {
  let gross = 0;
  let deductions = 0;
  let tax = 0;
  let net = 0;
  for (const p of payslips) {
    gross += p.gross;
    deductions += p.deductions;
    tax += p.tax;
    net += p.net;
  }
  return {
    gross: cents(gross),
    deductions: cents(deductions),
    tax: cents(tax),
    net: cents(net),
    payRunCount: payRuns.length,
    payslipCount: payslips.length,
  };
}

export function payrollSeries(payslips: PayslipRow[]): PayrollSeriesPoint[] {
  const groups = new Map<string, PayslipRow[]>();
  for (const p of payslips) {
    const key = `${p.periodStart}__${p.periodEnd}`;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  const points: PayrollSeriesPoint[] = [];
  for (const [, rows] of groups) {
    let gross = 0;
    let deductions = 0;
    let tax = 0;
    let net = 0;
    const payRunIds = new Set<string>();
    const periodStart = rows[0].periodStart;
    const periodEnd = rows[0].periodEnd;
    for (const r of rows) {
      gross += r.gross;
      deductions += r.deductions;
      tax += r.tax;
      net += r.net;
      payRunIds.add(r.payRunId);
    }
    points.push({
      periodStart,
      periodEnd,
      gross: cents(gross),
      deductions: cents(deductions),
      tax: cents(tax),
      net: cents(net),
      payRunCount: payRunIds.size,
      payslipCount: rows.length,
    });
  }
  points.sort((a, b) =>
    a.periodStart < b.periodStart ? -1 : a.periodStart > b.periodStart ? 1 : 0,
  );
  return points;
}

export function headcount(rows: EmployeeRow[]): HeadcountSummary {
  let active = 0;
  let onLeave = 0;
  let terminated = 0;
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    const s = r.status;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (s === "active") active += 1;
    else if (s === "on_leave") onLeave += 1;
    else if (s === "terminated") terminated += 1;
  }
  return {
    total: rows.length,
    active,
    onLeave,
    terminated,
    byStatus,
  };
}

function hoursBetween(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
  return (e - s) / 3_600_000;
}

export function attendance(rows: TimeEntryRow[]): AttendanceSummary {
  let approved = 0;
  let pending = 0;
  let rejected = 0;
  let approvedHours = 0;
  for (const r of rows) {
    if (r.status === "approved") {
      approved += 1;
      approvedHours += hoursBetween(r.startAt, r.endAt);
    } else if (r.status === "pending") pending += 1;
    else if (r.status === "rejected") rejected += 1;
  }
  return {
    total: rows.length,
    approved,
    pending,
    rejected,
    approvedHours: Math.round(approvedHours * 100) / 100,
  };
}

export function pipeline(
  candidates: CandidateRow[],
  jobs: JobRow[],
): PipelineSummary {
  const byStage: Record<string, number> = {};
  for (const c of candidates) {
    byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
  }
  let openJobs = 0;
  for (const j of jobs) {
    if (j.status === "open") openJobs += 1;
  }
  return {
    totalCandidates: candidates.length,
    byStage,
    totalJobs: jobs.length,
    openJobs,
  };
}

export function billingSummary(rows: InvoiceRow[]): BillingSummary {
  let totalAmount = 0;
  let paidAmount = 0;
  let openAmount = 0;
  const byStatus: Record<string, { count: number; amount: Cents }> = {};
  for (const r of rows) {
    totalAmount += r.amount;
    if (r.status === "paid") paidAmount += r.amount;
    if (r.status === "open") openAmount += r.amount;
    const entry = byStatus[r.status];
    if (entry) {
      entry.count += 1;
      entry.amount = cents((entry.amount as number) + r.amount);
    } else {
      byStatus[r.status] = { count: 1, amount: cents(r.amount) };
    }
  }
  return {
    totalAmount: cents(totalAmount),
    invoiceCount: rows.length,
    paidAmount: cents(paidAmount),
    openAmount: cents(openAmount),
    byStatus,
  };
}

export function syncHealth(rows: SyncRow[]): SyncSummary {
  let success = 0;
  let failed = 0;
  let pending = 0;
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.status === "success" || r.status === "completed") success += 1;
    else if (r.status === "failed" || r.status === "error") failed += 1;
    else if (r.status === "pending" || r.status === "queued") pending += 1;
  }
  return {
    total: rows.length,
    success,
    failed,
    pending,
    byStatus,
  };
}
