import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";

describe("runPayroll invariants", () => {
  it("totals equal sum of payslips for 100 random-ish cases", () => {
    for (let i = 0; i < 100; i++) {
      const n = (i % 5) + 1;
      const employees = Array.from({ length: n }, (_, j) => ({
        employeeId: `e${j}` as any,
        tenantId: "t1" as any,
        gross: cents(10000 + ((i * 37 + j * 13) % 90000)),
        deductions: cents(((i + j) % 3) * 1000),
      }));
      const res = runPayroll({
        tenantId: "t1" as any,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        entityId: "default",
        idempotencyKey: `t1:2026-08-01:2026-08-31:default:${i}`,
        taxBrackets: [{ upTo: null, rateBps: 1000 }],
        employees,
      });
      const sum = res.payslips.reduce((a, p) => cents(a + p.net), cents(0));
      expect(sum).toBe(res.totals.net);
    }
  });
  it("no float leaks: every amount is integer", () => {
    const res = runPayroll({
      tenantId: "t1" as any,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
      idempotencyKey: "t1:2026-08-01:2026-08-31:default",
      taxBrackets: [
        { upTo: cents(10000), rateBps: 333 },
        { upTo: null, rateBps: 777 },
      ],
      employees: [
        {
          employeeId: "e1" as any,
          tenantId: "t1" as any,
          gross: cents(12345),
          deductions: cents(0),
        },
      ],
    });
    for (const p of res.payslips) {
      expect(Number.isInteger(p.gross)).toBe(true);
      expect(Number.isInteger(p.tax)).toBe(true);
      expect(Number.isInteger(p.net)).toBe(true);
    }
  });
});
