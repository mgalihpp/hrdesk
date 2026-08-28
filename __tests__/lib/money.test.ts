import { describe, expect, it } from "vitest";
import { cents, moneyAdd, moneyGte, moneySub, moneyToMajor } from "@/lib/money";

describe("money", () => {
  it("rejects non-integer cents", () => {
    expect(() => cents(1.5)).toThrow();
  });

  it("adds and subtracts exactly", () => {
    expect(moneyAdd(cents(100), cents(50))).toBe(150);
    expect(moneySub(cents(100), cents(30))).toBe(70);
  });

  it("compares and formats", () => {
    expect(moneyGte(cents(100), cents(50))).toBe(true);
    expect(moneyGte(cents(10), cents(50))).toBe(false);
    expect(moneyToMajor(cents(12345))).toBe("123.45");
  });
});
