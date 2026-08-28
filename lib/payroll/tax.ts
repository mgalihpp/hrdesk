import { type Cents, cents } from "@/lib/money";
import type { TaxBracket } from "@/lib/payroll/types";

export const US_2026_SINGLE_BRACKETS: TaxBracket[] = [
  { upTo: cents(1160000), rateBps: 1000 },
  { upTo: cents(4715000), rateBps: 1200 },
  { upTo: cents(10052500), rateBps: 2200 },
  { upTo: null, rateBps: 2400 },
];

export function computeTax(gross: Cents, brackets: TaxBracket[]): Cents {
  if (!Number.isInteger(gross)) throw new Error("Money must be integer cents");
  if (gross < 0) throw new Error("Gross cannot be negative");
  let remaining: number = gross;
  let prevCap: number = 0;
  let tax: number = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const cap: number = b.upTo === null ? gross : b.upTo;
    const taxableInBracket = Math.min(remaining, cap - prevCap);
    if (taxableInBracket > 0) {
      tax += Math.round((taxableInBracket * b.rateBps) / 10000);
      remaining -= taxableInBracket;
    }
    prevCap = cap;
    if (b.upTo === null) break;
  }
  return cents(tax);
}
