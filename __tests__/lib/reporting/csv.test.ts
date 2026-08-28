import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { buildCsv } from "@/lib/reporting/csv";
import type { PayrollSeriesPoint } from "@/lib/reporting/types";

function point(over: Partial<PayrollSeriesPoint> = {}): PayrollSeriesPoint {
  return {
    periodStart: "2024-01-01",
    periodEnd: "2024-01-31",
    gross: cents(10000),
    deductions: cents(1000),
    tax: cents(1500),
    net: cents(7500),
    payRunCount: 1,
    payslipCount: 3,
    ...over,
  };
}

describe("buildCsv header", () => {
  it("returns header with trailing newline for empty rows", () => {
    expect(buildCsv([])).toBe("period,gross,net,tax\n");
  });

  it("starts with header for non-empty", () => {
    const csv = buildCsv([point()]);
    expect(csv.startsWith("period,gross,net,tax\n")).toBe(true);
  });
});

describe("buildCsv Cents", () => {
  it("converts Cents to dollars fixed 2", () => {
    const csv = buildCsv([
      point({ gross: cents(12345), net: cents(6789), tax: cents(100) }),
    ]);
    expect(csv).toContain("123.45");
    expect(csv).toContain("67.89");
    expect(csv).toContain("1.00");
  });

  it("preserves zero and large values", () => {
    const csv = buildCsv([
      point({ gross: cents(0), net: cents(1), tax: cents(1000000) }),
    ]);
    expect(csv).toContain("0.00");
    expect(csv).toContain("0.01");
    expect(csv).toContain("10000.00");
  });
});

describe("buildCsv RFC4180 escaping", () => {
  it("escapes comma in period", () => {
    const csv = buildCsv([point({ periodStart: "2024,01,01" })]);
    expect(csv).toContain('"2024,01,01 - 2024-01-31"');
  });

  it("escapes double quotes by doubling", () => {
    const csv = buildCsv([point({ periodStart: '2024"01"01' })]);
    expect(csv).toContain('"2024""01""01 - 2024-01-31"');
  });

  it("escapes newlines", () => {
    const csv = buildCsv([point({ periodStart: "2024-01-01\n2024" })]);
    expect(csv).toContain('"2024-01-01\n2024 - 2024-01-31"');
  });
});

describe("buildCsv empty", () => {
  it("returns only header for empty array", () => {
    const csv = buildCsv([]);
    const lines = csv.trim().split("\n");
    expect(lines).toEqual(["period,gross,net,tax"]);
  });
});

describe("buildCsv no PII", () => {
  it("does not include employee identifiers", () => {
    const csv = buildCsv([point()]);
    expect(csv).not.toContain("employee");
    expect(csv).not.toContain("email");
    expect(csv.split("\n")[0]).toBe("period,gross,net,tax");
  });
});
