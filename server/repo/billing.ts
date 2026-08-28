import type { PrismaClient } from "@prisma/client";
import type { Cents } from "@/lib/money";
import { cents } from "@/lib/money";
import type {
  BillingInterval,
  InvoiceId,
  InvoiceStatus,
  InvoiceView,
  Plan,
  SubscriptionId,
  SubscriptionStatus,
  SubscriptionView,
  TenantId,
} from "@/lib/types";

export type { InvoiceId, SubscriptionId };

type StoredSubscription = {
  id: string;
  tenantId: string;
  plan: string;
  status: string;
  billingInterval: string;
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredInvoice = {
  id: string;
  tenantId: string;
  subscriptionId: string | null;
  amount: number;
  status: string;
  billingInterval: string;
  periodStart: string;
  periodEnd: string;
  idempotencyKey: string;
  createdAt: Date;
};

type BillingPrisma = PrismaClient & {
  subscription: {
    findFirst: (args: unknown) => Promise<StoredSubscription | null>;
    create: (args: unknown) => Promise<StoredSubscription>;
    updateMany: (args: unknown) => Promise<unknown>;
  };
  invoice: {
    findUnique: (args: unknown) => Promise<StoredInvoice | null>;
    findFirst: (args: unknown) => Promise<StoredInvoice | null>;
    findMany: (args: unknown) => Promise<StoredInvoice[]>;
    create: (args: unknown) => Promise<StoredInvoice>;
    updateMany: (args: unknown) => Promise<unknown>;
  };
};

export function billingRepo(prisma: PrismaClient, tenantId: TenantId) {
  const db = prisma as BillingPrisma;

  const toSubscriptionView = (d: StoredSubscription): SubscriptionView => ({
    id: d.id as SubscriptionId,
    tenantId: d.tenantId as TenantId,
    plan: d.plan as Plan,
    status: d.status as SubscriptionStatus,
    billingInterval: d.billingInterval as BillingInterval,
    seats: d.seats,
    currentPeriodStart: d.currentPeriodStart,
    currentPeriodEnd: d.currentPeriodEnd,
    renewsAt: d.renewsAt ? new Date(d.renewsAt).toISOString() : null,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  });

  const toInvoiceView = (d: StoredInvoice): InvoiceView => ({
    id: d.id as InvoiceId,
    tenantId: d.tenantId as TenantId,
    subscriptionId: d.subscriptionId as SubscriptionId | null,
    amount: d.amount as Cents,
    status: d.status as InvoiceStatus,
    billingInterval: d.billingInterval as BillingInterval,
    periodStart: d.periodStart,
    periodEnd: d.periodEnd,
    idempotencyKey: d.idempotencyKey,
    createdAt: new Date(d.createdAt).toISOString(),
  });

  return {
    async getSubscription(): Promise<SubscriptionView | null> {
      const row = await db.subscription.findFirst({
        where: { tenantId },
      });
      return row ? toSubscriptionView(row) : null;
    },

    async upsertSubscription(input: {
      plan: Plan;
      billingInterval: BillingInterval;
      seats?: number;
    }): Promise<SubscriptionView> {
      const seats = input.seats ?? 1;
      const now = new Date();
      const periodStart = now.toISOString().slice(0, 10);
      const end = new Date(now);
      if (input.billingInterval === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }
      const periodEnd = end.toISOString().slice(0, 10);

      const existing = await db.subscription.findFirst({
        where: { tenantId },
      });

      if (!existing) {
        const created = await db.subscription.create({
          data: {
            tenantId,
            plan: input.plan,
            billingInterval: input.billingInterval,
            seats,
            status: "active",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            renewsAt: end,
          },
        });
        return toSubscriptionView(created);
      }

      await db.subscription.updateMany({
        where: { tenantId },
        data: {
          plan: input.plan,
          billingInterval: input.billingInterval,
          seats,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          renewsAt: end,
        },
      });
      const updated = await db.subscription.findFirst({
        where: { tenantId },
      });
      if (!updated) throw new Error("upsertSubscription failed");
      return toSubscriptionView(updated);
    },

    async createInvoice(input: {
      amount: Cents;
      periodStart: string;
      periodEnd: string;
      idempotencyKey: string;
      subscriptionId?: string;
      billingInterval: BillingInterval;
      status?: InvoiceStatus;
    }): Promise<InvoiceView> {
      const amountInt = cents(input.amount as number) as unknown as number;

      const existing = await db.invoice.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        if (existing.tenantId !== (tenantId as string)) {
          throw new Error("idempotency key collision across tenant");
        }
        return toInvoiceView(existing);
      }

      const created = await db.invoice.create({
        data: {
          tenantId,
          subscriptionId: input.subscriptionId ?? null,
          amount: amountInt,
          status: input.status ?? "open",
          billingInterval: input.billingInterval,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return toInvoiceView(created);
    },

    async listInvoices(): Promise<InvoiceView[]> {
      const rows = await db.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(toInvoiceView);
    },

    async getInvoiceById(id: InvoiceId): Promise<InvoiceView | null> {
      const row = await db.invoice.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toInvoiceView(row) : null;
    },

    async updateInvoiceStatus(
      id: InvoiceId,
      status: InvoiceStatus,
    ): Promise<void> {
      await db.invoice.updateMany({
        where: { id: id as string, tenantId },
        data: { status },
      });
    },
  };
}
