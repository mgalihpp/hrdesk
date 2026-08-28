import type { Cents } from "@/lib/money";
import { cents } from "@/lib/money";
import type { BillingInterval, Plan } from "@/lib/types";

export type PlanDef = {
  priceMonthly: Cents;
  priceYearly: Cents;
  features: string[];
  seatsIncluded: number;
};

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    priceMonthly: cents(0),
    priceYearly: cents(0),
    seatsIncluded: 5,
    features: [
      "Up to 5 employees",
      "1 payroll run / month",
      "Basic time tracking",
      "Email support",
    ],
  },
  starter: {
    priceMonthly: cents(3900),
    priceYearly: cents(2700),
    seatsIncluded: 25,
    features: [
      "Up to 25 employees",
      "Unlimited payroll runs",
      "Time & attendance",
      "Recruitment pipeline",
      "Email support",
    ],
  },
  professional: {
    priceMonthly: cents(5900),
    priceYearly: cents(4100),
    seatsIncluded: 75,
    features: [
      "Up to 75 employees",
      "Unlimited payroll runs",
      "Time & attendance",
      "Recruitment pipeline",
      "100+ tool integrations",
      "Priority support",
    ],
  },
  business: {
    priceMonthly: cents(9900),
    priceYearly: cents(6900),
    seatsIncluded: 200,
    features: [
      "Up to 200 employees",
      "Unlimited payroll runs",
      "Time & attendance",
      "Recruitment pipeline",
      "100+ tool integrations",
      "Dedicated support",
    ],
  },
};

export function getPlan(plan: Plan): PlanDef {
  const def = PLANS[plan];
  if (!def) throw new Error(`Unknown plan: ${plan}`);
  return def;
}

export function getPrice(plan: Plan, interval: BillingInterval): Cents {
  const def = getPlan(plan);
  return interval === "yearly" ? def.priceYearly : def.priceMonthly;
}

export function yearlySavingsPercent(plan: Plan): number {
  const def = getPlan(plan);
  if (def.priceMonthly === 0) return 0;
  const monthlyAnnual = def.priceMonthly * 12;
  const yearlyAnnual = def.priceYearly * 12;
  return Math.round(((monthlyAnnual - yearlyAnnual) / monthlyAnnual) * 100);
}
