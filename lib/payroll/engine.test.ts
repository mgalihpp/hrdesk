import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";
import type { PayrollInput } from "@/lib/payroll/types";

function input(over: Partial<PayrollInput> = {}): PayrollInput {
  return {
    tenantId: "tenantA" as any,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    entityId: "default",
    idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
    taxBrackets: [{ upTo: null, rateBps: 1000 }],
    employees: [
      {
        employeeId: "e1" as any,
        tenantId: "tenantA" as any,
        gross: cents(500000),
        deductions: cents(0),
      },
      {
        employeeId: "e2" as any,
        tenantId: "tenantA" as any,
        gross: cents(300000),
        deductions: cents(5000),
      },
    ],
    ...over,
  };
}

describe("runPayroll", () => {
  it("computes net = gross - deductions - tax per employee and reconciles", () => {
    const res = runPayroll(input());
    expect(res.payslips).toHaveLength(2);
    for (const p of res.payslips) {
      expect(p.gross - p.deductions - p.tax).toBe(p.net);
    }
    expect(res.totals.gross).toBe(cents(800000));
  });
  it("net is never negative else throws", () => {
    expect(() =>
      runPayroll(
        input({
          employees: [
            {
              employeeId: "e1" as any,
              tenantId: "tenantA" as any,
              gross: cents(1000),
              deductions: cents(2000),
            },
          ],
        }),
      ),
    ).toThrow(/net cannot be negative/);
  });
  it("is deterministic", () => {
    expect(runPayroll(input())).toEqual(runPayroll(input()));
  });
  it("rejects empty employees", () => {
    expect(() => runPayroll(input({ employees: [] }))).toThrow(
      /at least one employee/,
    );
  });
  it("rejects mismatched tenantId in employee row", () => {
    expect(() =>
      runPayroll(
        input({
          employees: [
            {
              employeeId: "e1" as any,
              tenantId: "other" as any,
              gross: cents(1000),
              deductions: cents(0),
            },
          ],
        }),
      ),
    ).toThrow(/tenant mismatch/);
  });
});
