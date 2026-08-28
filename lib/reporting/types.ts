import type { Cents } from "@/lib/money";

export type ReportId = string & { readonly __brand: "ReportId" };

export interface ReportRange {
  from: string;
  to: string;
}

export interface PayrollSummary {
  gross: Cents;
  deductions: Cents;
  tax: Cents;
  net: Cents;
  payRunCount: number;
  payslipCount: number;
}

export interface PayrollSeriesPoint {
  periodStart: string;
  periodEnd: string;
  gross: Cents;
  deductions: Cents;
  tax: Cents;
  net: Cents;
  payRunCount: number;
  payslipCount: number;
}

export interface HeadcountSummary {
  total: number;
  active: number;
  onLeave: number;
  terminated: number;
  byStatus: Record<string, number>;
}

export interface AttendanceSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvedHours: number;
}

export interface PipelineSummary {
  totalCandidates: number;
  byStage: Record<string, number>;
  totalJobs: number;
  openJobs: number;
}

export interface BillingSummary {
  totalAmount: Cents;
  invoiceCount: number;
  paidAmount: Cents;
  openAmount: Cents;
  byStatus: Record<string, { count: number; amount: Cents }>;
}

export interface SyncSummary {
  total: number;
  success: number;
  failed: number;
  pending: number;
  byStatus: Record<string, number>;
}

export interface ReportingOverview {
  payroll: PayrollSummary;
  headcount: HeadcountSummary;
  attendance: AttendanceSummary;
  pipeline: PipelineSummary;
  billing: BillingSummary;
  sync: SyncSummary;
}
