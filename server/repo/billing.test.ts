import { describe, expect, it, type Mock, vi } from "vitest";
import { cents } from "@/lib/money";
import type { BillingInterval, InvoiceId, Plan, TenantId } from "@/lib/types";
import { billingRepo } from "./billing";

const TENANT_A = "tenantA" as unknown as TenantId;
const TENANT_B = "tenantB" as unknown as TenantId;

function mockPrisma(): Parameters<typeof billingRepo>[0] {
  return {
    subscription: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "sub1",
        tenantId: data.tenantId,
        plan: data.plan,
        status: data.status ?? "active",
        billingInterval: data.billingInterval,
        seats: data.seats,
        currentPeriodStart: data.currentPeriodStart ?? "2026-08-01",
        currentPeriodEnd: data.currentPeriodEnd ?? "2026-09-01",
        renewsAt: data.renewsAt ?? new Date("2026-09-01"),
        createdAt: new Date("2026-08-01"),
        updatedAt: new Date("2026-08-01"),
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    invoice: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "inv1",
        tenantId: data.tenantId,
        subscriptionId: data.subscriptionId ?? null,
        amount: data.amount,
        status: data.status ?? "open",
        billingInterval: data.billingInterval,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        idempotencyKey: data.idempotencyKey,
        createdAt: new Date("2026-08-01"),
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  } as unknown as Parameters<typeof billingRepo>[0];
}

function storedSubscription(over: Record<string, unknown> = {}) {
  return {
    id: "sub1",
    tenantId: TENANT_A as unknown as string,
    plan: "starter" as Plan,
    status: "active",
    billingInterval: "monthly" as BillingInterval,
    seats: 3,
    currentPeriodStart: "2026-08-01",
    currentPeriodEnd: "2026-09-01",
    renewsAt: new Date("2026-09-01"),
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    ...over,
  };
}

function storedInvoice(over: Record<string, unknown> = {}) {
  return {
    id: "inv1",
    tenantId: TENANT_A as unknown as string,
    subscriptionId: null,
    amount: cents(5000) as unknown as number,
    status: "open",
    billingInterval: "monthly" as BillingInterval,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    idempotencyKey: "key-1",
    createdAt: new Date("2026-08-01"),
    ...over,
  };
}

describe("billingRepo.getSubscription", () => {
  it("filters by tenantId", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.getSubscription();
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });

  it("returns null when none", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.getSubscription();
    expect(res).toBeNull();
  });

  it("returns view when row exists", async () => {
    const prisma = mockPrisma();
    (prisma.subscription.findFirst as unknown as Mock).mockResolvedValueOnce(
      storedSubscription(),
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.getSubscription();
    expect(res?.id).toBe("sub1");
    expect(res?.tenantId).toBe(TENANT_A);
  });
});

describe("billingRepo.upsertSubscription", () => {
  it("creates when none, scopes tenantId and preserves seats/plan/billingInterval", async () => {
    const prisma = mockPrisma();
    (prisma.subscription.findFirst as unknown as Mock).mockResolvedValueOnce(
      null,
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.upsertSubscription({
      plan: "professional",
      billingInterval: "yearly",
      seats: 5,
    });
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_A,
          plan: "professional",
          billingInterval: "yearly",
          seats: 5,
        }),
      }),
    );
    expect(res.plan).toBe("professional");
    expect(res.billingInterval).toBe("yearly");
    expect(res.seats).toBe(5);
    expect(res.tenantId).toBe(TENANT_A);
  });

  it("defaults seats to 1 when omitted", async () => {
    const prisma = mockPrisma();
    (prisma.subscription.findFirst as unknown as Mock).mockResolvedValueOnce(
      null,
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.upsertSubscription({
      plan: "starter",
      billingInterval: "monthly",
    });
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ seats: 1 }) }),
    );
  });

  it("always scopes create to factory tenantId even if input has different tenant", async () => {
    const prisma = mockPrisma();
    (prisma.subscription.findFirst as unknown as Mock).mockResolvedValueOnce(
      null,
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.upsertSubscription({
      plan: "starter",
      billingInterval: "monthly",
      seats: 2,
      tenantId: TENANT_B as unknown as never,
    } as never);
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
    const createData = (prisma.subscription.create as unknown as Mock).mock
      .calls[0]?.[0]?.data as Record<string, unknown>;
    expect(createData.tenantId).not.toBe(TENANT_B);
  });

  it("updates when exists, scopes updateMany to factory tenantId and preserves seats/plan/billingInterval", async () => {
    const prisma = mockPrisma();
    const existing = storedSubscription({
      plan: "starter",
      billingInterval: "monthly",
      seats: 1,
    });
    const updated = storedSubscription({
      plan: "business",
      billingInterval: "yearly",
      seats: 10,
    });
    (prisma.subscription.findFirst as unknown as Mock)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.upsertSubscription({
      plan: "business",
      billingInterval: "yearly",
      seats: 10,
    });
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
        data: expect.objectContaining({
          plan: "business",
          billingInterval: "yearly",
          seats: 10,
        }),
      }),
    );
    expect(res.plan).toBe("business");
    expect(res.billingInterval).toBe("yearly");
    expect(res.seats).toBe(10);
  });

  it("always scopes update to factory tenantId even if input has different tenant", async () => {
    const prisma = mockPrisma();
    const existing = storedSubscription();
    const updated = storedSubscription({ plan: "professional", seats: 7 });
    (prisma.subscription.findFirst as unknown as Mock)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.upsertSubscription({
      plan: "professional",
      billingInterval: "monthly",
      seats: 7,
      tenantId: TENANT_B as unknown as never,
    } as never);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
    const where = (prisma.subscription.updateMany as unknown as Mock).mock
      .calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.tenantId).not.toBe(TENANT_B);
  });
});

describe("billingRepo.createInvoice", () => {
  it("always scopes tenantId from factory not input", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.createInvoice({
      amount: cents(1234),
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "k1",
      billingInterval: "monthly",
      tenantId: TENANT_B as unknown as never,
    } as never);
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
    const data = (prisma.invoice.create as unknown as Mock).mock.calls[0]?.[0]
      ?.data as Record<string, unknown>;
    expect(data.tenantId).not.toBe(TENANT_B);
  });

  it("creates with cents integer amount", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.createInvoice({
      amount: cents(9999),
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "k2",
      billingInterval: "monthly",
    });
    const data = (prisma.invoice.create as unknown as Mock).mock.calls[0]?.[0]
      ?.data as Record<string, unknown>;
    expect(data.amount).toBe(9999);
    expect(Number.isInteger(data.amount as number)).toBe(true);
  });

  it("dedups on idempotencyKey global lookup and returns existing if same tenant", async () => {
    const prisma = mockPrisma();
    const existing = storedInvoice({
      idempotencyKey: "dup-key",
      tenantId: TENANT_A as unknown as string,
    });
    (prisma.invoice.findUnique as unknown as Mock).mockResolvedValueOnce(
      existing,
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.createInvoice({
      amount: cents(1000),
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "dup-key",
      billingInterval: "monthly",
    });
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ idempotencyKey: "dup-key" }),
      }),
    );
    const where = (prisma.invoice.findUnique as unknown as Mock).mock
      .calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where).not.toHaveProperty("tenantId");
    expect(res.id).toBe("inv1");
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it("throws cross-tenant collision on idempotencyKey", async () => {
    const prisma = mockPrisma();
    const otherTenantInvoice = storedInvoice({
      idempotencyKey: "collision-key",
      tenantId: TENANT_B as unknown as string,
    });
    (prisma.invoice.findUnique as unknown as Mock).mockResolvedValueOnce(
      otherTenantInvoice,
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    await expect(
      repo.createInvoice({
        amount: cents(1000),
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        idempotencyKey: "collision-key",
        billingInterval: "monthly",
      }),
    ).rejects.toThrow(/collision/i);
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it("creates when no existing idempotencyKey", async () => {
    const prisma = mockPrisma();
    (prisma.invoice.findUnique as unknown as Mock).mockResolvedValueOnce(null);
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.createInvoice({
      amount: cents(2500),
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "new-key",
      billingInterval: "monthly",
    });
    expect(prisma.invoice.create).toHaveBeenCalledTimes(1);
    expect(res.amount).toBe(cents(2500));
  });
});

describe("billingRepo.listInvoices", () => {
  it("filters by tenantId", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.listInvoices();
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      }),
    );
  });

  it("returns mapped views", async () => {
    const prisma = mockPrisma();
    (prisma.invoice.findMany as unknown as Mock).mockResolvedValueOnce([
      storedInvoice({ id: "inv1" }),
      storedInvoice({ id: "inv2" }),
    ]);
    const repo = billingRepo(prisma as never, TENANT_A);
    const rows = await repo.listInvoices();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe("inv1");
  });
});

describe("billingRepo.getInvoiceById", () => {
  it("filters by {id, tenantId}", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.getInvoiceById("inv1" as InvoiceId);
    expect(prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "inv1", tenantId: TENANT_A }),
      }),
    );
  });

  it("returns null when not found", async () => {
    const prisma = mockPrisma();
    (prisma.invoice.findFirst as unknown as Mock).mockResolvedValueOnce(null);
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.getInvoiceById("missing" as InvoiceId);
    expect(res).toBeNull();
  });

  it("returns view when found", async () => {
    const prisma = mockPrisma();
    (prisma.invoice.findFirst as unknown as Mock).mockResolvedValueOnce(
      storedInvoice(),
    );
    const repo = billingRepo(prisma as never, TENANT_A);
    const res = await repo.getInvoiceById("inv1" as InvoiceId);
    expect(res?.id).toBe("inv1");
    expect(res?.tenantId).toBe(TENANT_A);
  });
});

describe("billingRepo.updateInvoiceStatus", () => {
  it("uses updateMany where {id, tenantId}", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.updateInvoiceStatus("inv1" as InvoiceId, "paid");
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "inv1", tenantId: TENANT_A }),
        data: expect.objectContaining({ status: "paid" }),
      }),
    );
  });

  it("scopes status update to factory tenant", async () => {
    const prisma = mockPrisma();
    const repo = billingRepo(prisma as never, TENANT_A);
    await repo.updateInvoiceStatus("inv1" as InvoiceId, "void");
    const where = (prisma.invoice.updateMany as unknown as Mock).mock
      .calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.tenantId).toBe(TENANT_A);
    expect(where.id).toBe("inv1");
  });
});
