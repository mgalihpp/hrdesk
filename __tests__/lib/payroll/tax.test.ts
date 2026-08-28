import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { computeTax, US_2026_SINGLE_BRACKETS } from "@/lib/payroll/tax";

describe("computeTax", () => {
  it("returns 0 for 0 gross", () => {
    expect(computeTax(cents(0), US_2026_SINGLE_BRACKETS)).toBe(cents(0));
  });
  it("computes single bracket correctly", () => {
    expect(computeTax(cents(10000), [{ upTo: null, rateBps: 1000 }])).toBe(
      cents(1000),
    );
  });
  it("computes progressive brackets", () => {
    const brackets = [
      { upTo: cents(10000), rateBps: 1000 },
      { upTo: null, rateBps: 2000 },
    ];
    expect(computeTax(cents(15000), brackets)).toBe(cents(2000));
  });
  it("throws on non-integer gross", () => {
    expect(() =>
      computeTax(10.5 as unknown as never, US_2026_SINGLE_BRACKETS),
    ).toThrow();
  });
  it("US 2026 single has at least 3 brackets and last is open", () => {
    expect(US_2026_SINGLE_BRACKETS.length).toBeGreaterThanOrEqual(3);
    expect(US_2026_SINGLE_BRACKETS.at(-1)?.upTo).toBe(null);
  });
});
