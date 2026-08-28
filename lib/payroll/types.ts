import type { Cents } from "@/lib/money";
import type { EmployeeId, TenantId } from "@/lib/types";

export type PayRunId = string & { readonly __brand: "PayRunId" };
export type PayslipId = string & { readonly __brand: "PayslipId" };
export type PayItemId = string & { readonly __brand: "PayItemId" };

export const PAY_RUN_STATUS = ["draft", "running", "done", "locked"] as const;
export type PayRunStatus = (typeof PAY_RUN_STATUS)[number];

export function isValidPayRunStatus(v: string): v is PayRunStatus {
  return (PAY_RUN_STATUS as readonly string[]).includes(v);
}

export const PAY_RUN_TRANSITIONS: Record<PayRunStatus, PayRunStatus[]> = {
  draft: ["running"],
  running: ["done"],
  done: ["locked"],
  locked: [],
};

export interface TaxBracket {
  upTo: Cents | null; // null means no cap
  rateBps: number; // basis points, e.g. 1000 = 10%
}

export interface PayItem {
  id: PayItemId;
  payslipId: PayslipId;
  category: "gross" | "deduction" | "tax" | "net";
  amount: Cents;
  label: string;
}

export interface Payslip {
  id: PayslipId;
  payRunId: PayRunId;
  employeeId: EmployeeId;
  tenantId: TenantId;
  gross: Cents;
  deductions: Cents;
  tax: Cents;
  net: Cents;
  items: PayItem[];
}

export interface PayrollInputEmployee {
  employeeId: EmployeeId;
  tenantId: TenantId;
  gross: Cents; // for v1: monthly compensation proration caller provides
  deductions: Cents; // pre-tax deductions sum, 0 if none
}

export interface PayrollInput {
  tenantId: TenantId;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd: string; // ISO date YYYY-MM-DD
  entityId: string; // legal entity or department scope, "default" for v1
  employees: PayrollInputEmployee[];
  taxBrackets: TaxBracket[];
  idempotencyKey: string; // tenantId:periodStart:periodEnd:entityId
}

export interface PayrollResult {
  payRunId: PayRunId;
  tenantId: TenantId;
  periodStart: string;
  periodEnd: string;
  entityId: string;
  idempotencyKey: string;
  status: PayRunStatus;
  payslips: Payslip[];
  totals: { gross: Cents; tax: Cents; deductions: Cents; net: Cents };
}

export interface PayRun {
  id: PayRunId;
  tenantId: TenantId;
  entityId: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  idempotencyKey: string;
  createdAt: string;
}
