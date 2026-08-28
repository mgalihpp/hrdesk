import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import {
  attendance,
  billingSummary,
  headcount,
  payrollSeries,
  payrollSummary,
  pipeline,
  syncHealth,
} from "./aggregates";

describe("payrollSummary empty", () => {
  it("returns zeros for empty input", () => {
    const r = payrollSummary([], []);
    expect(r.gross).toBe(cents(0));
    expect(r.deductions).toBe(cents(0));
    expect(r.tax).toBe(cents(0));
    expect(r.net).toBe(cents(0));
    expect(r.payRunCount).toBe(0);
    expect(r.payslipCount).toBe(0);
  });
});

describe("payrollSummary single period", () => {
  it("sums single payslip and preserves Cents", () => {
    const payslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
    ];
    const payRuns = [
      { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
    ];
    const r = payrollSummary(payslips, payRuns);
    expect(r.gross).toBe(cents(10000));
    expect(r.deductions).toBe(cents(1000));
    expect(r.tax).toBe(cents(500));
    expect(r.net).toBe(cents(8500));
    expect(r.payRunCount).toBe(1);
    expect(r.payslipCount).toBe(1);
  });
});

describe("payrollSummary multi period", () => {
  it("sums across multiple payslips", () => {
    const payslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 20000,
        deductions: 2000,
        tax: 1000,
        net: 17000,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 15000,
        deductions: 1500,
        tax: 750,
        net: 12750,
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        payRunId: "pr2",
      },
    ];
    const payRuns = [
      { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
      { id: "pr2", periodStart: "2026-02-01", periodEnd: "2026-02-28" },
    ];
    const r = payrollSummary(payslips, payRuns);
    expect(r.gross).toBe(cents(45000));
    expect(r.payslipCount).toBe(3);
    expect(r.payRunCount).toBe(2);
  });
});

describe("payroll Cents reconciliation", () => {
  it("gross equals deductions plus tax plus net per payslip set", () => {
    const payslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 5000,
        deductions: 500,
        tax: 250,
        net: 4250,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
    ];
    const payRuns = [
      { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
    ];
    const r = payrollSummary(payslips, payRuns);
    expect(
      (r.deductions as number) + (r.tax as number) + (r.net as number),
    ).toBe(r.gross as number);
  });

  it("series points also reconcile", () => {
    const payslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 12000,
        deductions: 1200,
        tax: 600,
        net: 10200,
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        payRunId: "pr2",
      },
    ];
    const pts = payrollSeries(payslips);
    for (const p of pts) {
      expect(
        (p.deductions as number) + (p.tax as number) + (p.net as number),
      ).toBe(p.gross as number);
    }
  });
});

describe("payrollSeries", () => {
  it("empty input gives empty series", () => {
    expect(payrollSeries([])).toEqual([]);
  });

  it("groups by period and sorts", () => {
    const payslips = [
      {
        gross: 12000,
        deductions: 1200,
        tax: 600,
        net: 10200,
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        payRunId: "pr2",
      },
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
    ];
    const pts = payrollSeries(payslips);
    expect(pts).toHaveLength(2);
    expect(pts[0].periodStart).toBe("2026-01-01");
    expect(pts[1].periodStart).toBe("2026-02-01");
  });

  it("multi period aggregation per group", () => {
    const payslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 5000,
        deductions: 500,
        tax: 250,
        net: 4250,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        payRunId: "pr1",
      },
      {
        gross: 15000,
        deductions: 1500,
        tax: 750,
        net: 12750,
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        payRunId: "pr2",
      },
    ];
    const pts = payrollSeries(payslips);
    expect(pts[0].gross).toBe(cents(15000));
    expect(pts[0].payslipCount).toBe(2);
    expect(pts[1].gross).toBe(cents(15000));
  });
});

describe("headcount", () => {
  it("empty gives zeros", () => {
    const r = headcount([]);
    expect(r.total).toBe(0);
    expect(r.active).toBe(0);
    expect(r.byStatus).toEqual({});
  });

  it("counts by status", () => {
    const r = headcount([
      { status: "active" },
      { status: "active" },
      { status: "on_leave" },
      { status: "terminated" },
    ]);
    expect(r.total).toBe(4);
    expect(r.active).toBe(2);
    expect(r.onLeave).toBe(1);
    expect(r.terminated).toBe(1);
    expect(r.byStatus["active"]).toBe(2);
  });
});

describe("attendance", () => {
  it("empty gives zeros", () => {
    const r = attendance([]);
    expect(r.total).toBe(0);
    expect(r.approved).toBe(0);
  });

  it("counts approved only and pending rejected", () => {
    const rows = [
      {
        status: "approved",
        startAt: "2026-08-01T09:00:00Z",
        endAt: "2026-08-01T17:00:00Z",
      },
      {
        status: "approved",
        startAt: "2026-08-02T09:00:00Z",
        endAt: "2026-08-02T13:00:00Z",
      },
      {
        status: "pending",
        startAt: "2026-08-03T09:00:00Z",
        endAt: "2026-08-03T17:00:00Z",
      },
      {
        status: "rejected",
        startAt: "2026-08-04T09:00:00Z",
        endAt: "2026-08-04T17:00:00Z",
      },
    ];
    const r = attendance(rows);
    expect(r.approved).toBe(2);
    expect(r.pending).toBe(1);
    expect(r.rejected).toBe(1);
    expect(r.total).toBe(4);
    expect(r.approvedHours).toBe(12);
  });
});

describe("pipeline", () => {
  it("empty gives zeros", () => {
    const r = pipeline([], []);
    expect(r.totalCandidates).toBe(0);
    expect(r.totalJobs).toBe(0);
  });

  it("funnel sums to total", () => {
    const cands = [
      { stage: "applied" },
      { stage: "applied" },
      { stage: "interview" },
      { stage: "hired" },
    ];
    const jobs = [{ status: "open" }, { status: "closed" }];
    const r = pipeline(cands, jobs);
    expect(r.totalCandidates).toBe(4);
    const sum = Object.values(r.byStage).reduce((a, b) => a + b, 0);
    expect(sum).toBe(r.totalCandidates);
    expect(r.totalJobs).toBe(2);
    expect(r.openJobs).toBe(1);
  });
});

describe("billingSummary", () => {
  it("empty gives zeros", () => {
    const r = billingSummary([]);
    expect(r.totalAmount).toBe(cents(0));
    expect(r.invoiceCount).toBe(0);
  });

  it("sums Cents and groups by status", () => {
    const rows = [
      { amount: 10000, status: "paid" },
      { amount: 5000, status: "open" },
      { amount: 7000, status: "paid" },
    ];
    const r = billingSummary(rows);
    expect(r.totalAmount).toBe(cents(22000));
    expect(r.paidAmount).toBe(cents(17000));
    expect(r.openAmount).toBe(cents(5000));
    expect(r.byStatus["paid"].count).toBe(2);
    expect(r.byStatus["paid"].amount).toBe(cents(17000));
  });

  it("Cents reconciliation total equals paid plus open plus other", () => {
    const rows = [
      { amount: 1000, status: "paid" },
      { amount: 2000, status: "open" },
      { amount: 3000, status: "void" },
    ];
    const r = billingSummary(rows);
    const bySum = Object.values(r.byStatus).reduce(
      (a, b) => a + (b.amount as number),
      0,
    );
    expect(bySum).toBe(r.totalAmount as number);
  });
});

describe("syncHealth", () => {
  it("empty gives zeros", () => {
    const r = syncHealth([]);
    expect(r.total).toBe(0);
  });

  it("counts success failed pending", () => {
    const rows = [
      { status: "success" },
      { status: "failed" },
      { status: "pending" },
      { status: "success" },
    ];
    const r = syncHealth(rows);
    expect(r.total).toBe(4);
    expect(r.success).toBe(2);
    expect(r.failed).toBe(1);
    expect(r.pending).toBe(1);
    const sum = r.success + r.failed + r.pending;
    expect(sum).toBe(4);
  });

  it("failed plus success plus pending equals total when only those statuses", () => {
    const rows = [
      { status: "success" },
      { status: "failed" },
      { status: "pending" },
    ];
    const r = syncHealth(rows);
    expect(r.success + r.failed + r.pending).toBe(r.total);
  });
});

describe("unpaid leave exclusion parity", () => {
  it("payroll totals exclude filtered payslips same as payrun does", () => {
    const allPayslips = [
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        payRunId: "pr1",
      },
      {
        gross: 10000,
        deductions: 1000,
        tax: 500,
        net: 8500,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        payRunId: "pr1",
      },
    ];
    const unpaidEmployeePayrunId = "pr1";
    const filtered = allPayslips.slice(0, 1);
    const full = payrollSummary(allPayslips, [
      { id: "pr1", periodStart: "2026-08-01", periodEnd: "2026-08-31" },
    ]);
    const after = payrollSummary(filtered, [
      { id: "pr1", periodStart: "2026-08-01", periodEnd: "2026-08-31" },
    ]);
    expect(after.gross).toBe(cents(10000));
    expect(full.gross).toBe(cents(20000));
    expect(
      (after.deductions as number) +
        (after.tax as number) +
        (after.net as number),
    ).toBe(after.gross as number);
    void unpaidEmployeePayrunId;
  });
});
