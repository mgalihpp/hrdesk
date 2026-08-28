import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import type { Plan } from "@/lib/types";
import { computeInvoiceAmount, computeSubscriptionAmount } from "./engine";
import { getPlan, getPrice, yearlySavingsPercent } from "./plans";

describe("billing engine", () => {
  describe("computeInvoiceAmount base prices", () => {
    it("free monthly is 0", () => {
      expect(computeInvoiceAmount("free", "monthly")).toBe(cents(0));
    });

    it("free yearly is 0", () => {
      expect(computeInvoiceAmount("free", "yearly")).toBe(cents(0));
    });

    it("starter monthly 3900 yearly 2700", () => {
      expect(computeInvoiceAmount("starter", "monthly")).toBe(cents(3900));
      expect(computeInvoiceAmount("starter", "yearly")).toBe(cents(2700));
    });

    it("professional monthly 5900 yearly 4100", () => {
      expect(computeInvoiceAmount("professional", "monthly")).toBe(cents(5900));
      expect(computeInvoiceAmount("professional", "yearly")).toBe(cents(4100));
    });

    it("business monthly 9900 yearly 6900", () => {
      expect(computeInvoiceAmount("business", "monthly")).toBe(cents(9900));
      expect(computeInvoiceAmount("business", "yearly")).toBe(cents(6900));
    });

    it("computeSubscriptionAmount is alias and returns same values", () => {
      expect(computeSubscriptionAmount("starter", "monthly")).toBe(cents(3900));
      expect(computeSubscriptionAmount("starter", "yearly")).toBe(cents(2700));
      expect(computeSubscriptionAmount).toBe(computeInvoiceAmount);
    });
  });

  describe("yearlySavingsPercent", () => {
    it("free returns 0", () => {
      expect(yearlySavingsPercent("free")).toBe(0);
    });

    it("paid plans save ~30 percent", () => {
      const starter = yearlySavingsPercent("starter");
      const professional = yearlySavingsPercent("professional");
      const business = yearlySavingsPercent("business");
      expect(starter).toBe(31);
      expect(professional).toBe(31);
      expect(business).toBe(30);
      for (const v of [starter, professional, business]) {
        expect(v).toBeGreaterThanOrEqual(30);
        expect(v).toBeLessThanOrEqual(31);
      }
    });
  });

  describe("seat overage", () => {
    it("starter 30 seats monthly: 3900 + 5*500 = 6400", () => {
      expect(computeInvoiceAmount("starter", "monthly", 30)).toBe(cents(6400));
    });

    it("starter 30 seats yearly: 2700 + 5*350 = 4450", () => {
      expect(computeInvoiceAmount("starter", "yearly", 30)).toBe(cents(4450));
    });

    it("seats within included charges no overage", () => {
      expect(computeInvoiceAmount("starter", "monthly", 25)).toBe(cents(3900));
      expect(computeInvoiceAmount("starter", "monthly", 10)).toBe(cents(3900));
      expect(computeInvoiceAmount("starter", "yearly", 25)).toBe(cents(2700));
      expect(computeInvoiceAmount("free", "monthly", 5)).toBe(cents(0));
      expect(computeInvoiceAmount("free", "monthly", 3)).toBe(cents(0));
      expect(computeInvoiceAmount("professional", "monthly", 75)).toBe(
        cents(5900),
      );
      expect(computeInvoiceAmount("business", "yearly", 200)).toBe(cents(6900));
    });

    it("no seats argument returns base price", () => {
      expect(computeInvoiceAmount("starter", "monthly")).toBe(cents(3900));
      expect(computeInvoiceAmount("starter", "monthly", undefined)).toBe(
        cents(3900),
      );
    });

    it("exactly one over included charges one per-seat unit", () => {
      expect(computeInvoiceAmount("starter", "monthly", 26)).toBe(cents(4400));
      expect(computeInvoiceAmount("starter", "yearly", 26)).toBe(cents(3050));
    });
  });

  describe("validation", () => {
    it("seats < 1 throws", () => {
      expect(() => computeInvoiceAmount("starter", "monthly", 0)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() => computeInvoiceAmount("starter", "monthly", -1)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() => computeInvoiceAmount("starter", "monthly", -10)).toThrow(
        /seats must be integer >= 1/,
      );
    });

    it("non-integer seats throws", () => {
      expect(() => computeInvoiceAmount("starter", "monthly", 1.5)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() => computeInvoiceAmount("starter", "monthly", 25.1)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() => computeInvoiceAmount("starter", "yearly", 30.5)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() => computeInvoiceAmount("starter", "monthly", NaN)).toThrow(
        /seats must be integer >= 1/,
      );
      expect(() =>
        computeInvoiceAmount("starter", "monthly", Infinity),
      ).toThrow(/seats must be integer >= 1/);
    });

    it("reconciliation does not throw and result is Cents integer", () => {
      expect(() =>
        computeInvoiceAmount("starter", "monthly", 30),
      ).not.toThrow();
      expect(() => computeInvoiceAmount("starter", "yearly", 30)).not.toThrow();
      expect(() =>
        computeInvoiceAmount("business", "monthly", 250),
      ).not.toThrow();
      const result = computeInvoiceAmount("starter", "monthly", 30);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(cents(6400));
    });
  });

  describe("getPlan / getPrice helpers", () => {
    it("getPlan throws on unknown plan", () => {
      const unknown = "unknown" as unknown as Plan;
      const empty = "" as unknown as Plan;
      expect(() => getPlan(unknown)).toThrow(/Unknown plan/);
      expect(() => getPlan(empty)).toThrow(/Unknown plan/);
    });

    it("getPrice throws on unknown plan", () => {
      const unknown = "unknown" as unknown as Plan;
      expect(() => getPrice(unknown, "monthly")).toThrow(/Unknown plan/);
    });

    it("getPrice returns correct Cents per interval", () => {
      expect(getPrice("free", "monthly")).toBe(cents(0));
      expect(getPrice("free", "yearly")).toBe(cents(0));
      expect(getPrice("starter", "monthly")).toBe(cents(3900));
      expect(getPrice("starter", "yearly")).toBe(cents(2700));
      expect(getPrice("professional", "monthly")).toBe(cents(5900));
      expect(getPrice("professional", "yearly")).toBe(cents(4100));
      expect(getPrice("business", "monthly")).toBe(cents(9900));
      expect(getPrice("business", "yearly")).toBe(cents(6900));
    });

    it("getPlan returns def with seatsIncluded and features", () => {
      expect(getPlan("starter").seatsIncluded).toBe(25);
      expect(getPlan("free").seatsIncluded).toBe(5);
      expect(getPlan("professional").seatsIncluded).toBe(75);
      expect(getPlan("business").seatsIncluded).toBe(200);
    });

    it("yearlySavingsPercent throws on unknown plan", () => {
      const unknown = "unknown" as unknown as Plan;
      expect(() => yearlySavingsPercent(unknown)).toThrow(/Unknown plan/);
    });
  });

  describe("determinism and isolation", () => {
    it("is deterministic across repeated calls", () => {
      const a = computeInvoiceAmount("starter", "monthly", 30);
      const b = computeInvoiceAmount("starter", "monthly", 30);
      expect(a).toBe(b);
      expect(a).toEqual(b);
    });

    it("does not mutate across calls with different seats", () => {
      const base = computeInvoiceAmount("starter", "monthly");
      const over = computeInvoiceAmount("starter", "monthly", 30);
      const baseAgain = computeInvoiceAmount("starter", "monthly");
      expect(base).toBe(cents(3900));
      expect(over).toBe(cents(6400));
      expect(baseAgain).toBe(cents(3900));
    });
  });
});
