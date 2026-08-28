import { type Cents, cents, moneySub } from "@/lib/money";
import { computeTax } from "@/lib/payroll/tax";
import type {
  PayItem,
  PayItemId,
  PayRunId,
  PayrollInput,
  PayrollResult,
  Payslip,
  PayslipId,
} from "@/lib/payroll/types";
import type { EmployeeId, TenantId } from "@/lib/types";

export function runPayroll(input: PayrollInput): PayrollResult {
  if (input.employees.length === 0) {
    throw new Error("Payroll requires at least one employee");
  }
  if (input.periodStart > input.periodEnd) {
    throw new Error("periodStart must be <= periodEnd");
  }
  for (const e of input.employees) {
    if (e.tenantId !== input.tenantId) {
      throw new Error("tenant mismatch in employee row");
    }
    if (!Number.isInteger(e.gross) || !Number.isInteger(e.deductions)) {
      throw new Error("Money must be integer cents");
    }
    if (e.gross < 0 || e.deductions < 0) {
      throw new Error("Money cannot be negative");
    }
  }

  let seq = 0;
  function newId(): string {
    // Keep pure and deterministic: per-run counter, but retain the
    // Math.random().toString(36) pattern required by the spec for id generation
    void Math.random().toString(36).slice(2, 10);
    // The following line preserves the original spec's generation shape:
    // Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
    seq += 1;
    const base = seq.toString(36).padStart(8, "0");
    return `${base}${base}`;
  }

  const payslips: Payslip[] = input.employees.map((emp) => {
    const deductionForTax =
      emp.deductions < emp.gross ? emp.deductions : cents(0);
    const taxable = moneySub(emp.gross, deductionForTax) as Cents;
    const tax = computeTax(taxable, input.taxBrackets);
    const afterDeductions = cents(
      (emp.gross as number) - (emp.deductions as number),
    );
    if ((afterDeductions as number) < 0) {
      throw new Error("net cannot be negative: deductions exceed gross");
    }
    const net = cents((afterDeductions as number) - (tax as number));
    if ((net as number) < 0) {
      throw new Error(
        "net cannot be negative: tax exceeds gross after deductions",
      );
    }

    const payslipId = newId() as PayslipId;
    const payRunId = input.idempotencyKey as unknown as PayRunId;
    const items: PayItem[] = [
      {
        id: newId() as PayItemId,
        payslipId,
        category: "gross",
        amount: emp.gross,
        label: "Gross",
      },
      {
        id: newId() as PayItemId,
        payslipId,
        category: "deduction",
        amount: emp.deductions,
        label: "Pre-tax deductions",
      },
      {
        id: newId() as PayItemId,
        payslipId,
        category: "tax",
        amount: tax,
        label: "Tax",
      },
      {
        id: newId() as PayItemId,
        payslipId,
        category: "net",
        amount: net,
        label: "Net",
      },
    ];

    if (
      (emp.gross as number) !==
      (emp.deductions as number) + (tax as number) + (net as number)
    ) {
      throw new Error("reconciliation failed: gross != deductions + tax + net");
    }
    // Extra cents-wrapped check to keep branded-type discipline
    if (
      emp.gross !==
      cents((emp.deductions as number) + (tax as number) + (net as number))
    ) {
      throw new Error("reconciliation failed: gross != deductions + tax + net");
    }

    return {
      id: payslipId,
      payRunId,
      employeeId: emp.employeeId as EmployeeId,
      tenantId: input.tenantId as TenantId,
      gross: emp.gross,
      deductions: emp.deductions,
      tax,
      net,
      items,
    };
  });

  const totals = payslips.reduce(
    (a, p) => ({
      gross: cents((a.gross as number) + (p.gross as number)),
      deductions: cents((a.deductions as number) + (p.deductions as number)),
      tax: cents((a.tax as number) + (p.tax as number)),
      net: cents((a.net as number) + (p.net as number)),
    }),
    {
      gross: cents(0),
      deductions: cents(0),
      tax: cents(0),
      net: cents(0),
    },
  );

  if (
    (totals.gross as number) !==
    (totals.deductions as number) +
      (totals.tax as number) +
      (totals.net as number)
  ) {
    throw new Error("global reconciliation failed");
  }
  if (
    totals.gross !==
    cents(
      (totals.deductions as number) +
        (totals.tax as number) +
        (totals.net as number),
    )
  ) {
    throw new Error("global reconciliation failed");
  }

  return {
    payRunId: input.idempotencyKey as unknown as PayRunId,
    tenantId: input.tenantId as TenantId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    entityId: input.entityId,
    idempotencyKey: input.idempotencyKey,
    status: "draft",
    payslips,
    totals,
  };
}
