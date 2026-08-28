import type { Cents } from "@/lib/money";
import { cents } from "@/lib/money";
import type { BillingInterval, Plan } from "@/lib/types";
import { getPlan, getPrice } from "./plans";

const PER_SEAT_MONTHLY: Cents = cents(500);
const PER_SEAT_YEARLY: Cents = cents(350);

export function computeInvoiceAmount(
  plan: Plan,
  interval: BillingInterval,
  seats?: number,
): Cents {
  const def = getPlan(plan);
  const base = getPrice(plan, interval);
  let total = base as number;
  if (seats !== undefined && seats !== null) {
    if (!Number.isInteger(seats) || seats < 1) {
      throw new Error("seats must be integer >= 1");
    }
    if (seats > def.seatsIncluded) {
      const extra = seats - def.seatsIncluded;
      const perSeat =
        interval === "yearly" ? PER_SEAT_YEARLY : PER_SEAT_MONTHLY;
      total += extra * (perSeat as number);
    }
  }
  const result = cents(total);
  const expected = base as number;
  if (seats !== undefined && seats > def.seatsIncluded) {
    const extra = seats - def.seatsIncluded;
    const perSeat = interval === "yearly" ? PER_SEAT_YEARLY : PER_SEAT_MONTHLY;
    const reconciled = (base as number) + extra * (perSeat as number);
    if (result !== reconciled) throw new Error("reconciliation failed");
    void expected;
  } else {
    if (result !== base) throw new Error("reconciliation failed");
  }
  return result;
}

export const computeSubscriptionAmount = computeInvoiceAmount;
