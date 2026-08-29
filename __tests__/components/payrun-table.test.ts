import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PayrunTable", () => {
  it("does not import PAY_RUNS from lib/dashboard-data", () => {
    const src = readFileSync("components/dashboard/payrun-table.tsx", "utf8");
    expect(src).not.toContain("PAY_RUNS");
    expect(src).not.toContain("lib/dashboard-data");
  });

  it("handles empty state with No pay runs yet", () => {
    const src = readFileSync("components/dashboard/payrun-table.tsx", "utf8");
    expect(src).toContain("No pay runs yet");
    expect(src).toContain("payRuns.length === 0");
  });

  it("formats gross/net via moneyToMajor", () => {
    const src = readFileSync("components/dashboard/payrun-table.tsx", "utf8");
    expect(src).toContain("moneyToMajor");
  });

  it("lib/dashboard-data no longer exports PAY_RUNS", () => {
    const src = readFileSync("lib/dashboard-data.ts", "utf8");
    expect(src).not.toContain("PAY_RUNS");
    expect(src).not.toContain("export type PayRun");
  });
});
