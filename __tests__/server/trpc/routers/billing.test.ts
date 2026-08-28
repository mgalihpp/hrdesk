import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { billingRouter } from "@/server/trpc/routers/billing";

function makeCaller(
  roles: string[],
  tenantId = "tenantA",
  prismaOverrides: Record<string, unknown> = {},
) {
  const subscription = {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "sub1",
      tenantId,
      plan: data.plan,
      status: "active",
      billingInterval: data.billingInterval,
      seats: data.seats,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      renewsAt: data.renewsAt ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
    findMany: vi.fn(async () => []),
  };

  const invoice = {
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
      createdAt: new Date(),
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
  };

  const prisma = {
    subscription,
    invoice,
    ...(prismaOverrides as Record<string, unknown>),
  } as unknown as never;

  const ctx = {
    session: {
      id: "u1",
      tenantId: tenantId as unknown as never,
      roles: roles as unknown as never,
    },
    prisma,
  } as unknown as never;

  return {
    caller: billingRouter.createCaller(ctx),
    prisma: prisma as unknown as {
      subscription: typeof subscription;
      invoice: typeof invoice;
    },
    tenantId,
  };
}

describe("billing router RBAC: getSubscription and listInvoices", () => {
  it("getSubscription allowed for owner", async () => {
    const { caller } = makeCaller(["owner"]);
    const res = await caller.getSubscription();
    expect(res).toBeNull();
  });

  it("getSubscription allowed for employee", async () => {
    const { caller } = makeCaller(["employee"]);
    const res = await caller.getSubscription();
    expect(res).toBeNull();
  });

  it("listInvoices allowed for owner", async () => {
    const { caller } = makeCaller(["owner"]);
    const res = await caller.listInvoices();
    expect(Array.isArray(res)).toBe(true);
  });

  it("listInvoices allowed for employee", async () => {
    const { caller } = makeCaller(["employee"]);
    const res = await caller.listInvoices();
    expect(Array.isArray(res)).toBe(true);
  });

  it("getInvoice allowed for any authed role", async () => {
    const { caller } = makeCaller(["employee"], "tenantA", {
      invoice: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => ({
          id: "inv1",
          tenantId: "tenantA",
          subscriptionId: null,
          amount: 1000,
          status: "open",
          billingInterval: "monthly",
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
          idempotencyKey: "k",
          createdAt: new Date(),
        })),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    });
    const res = await caller.getInvoice({ id: "inv1" });
    expect(res).not.toBeNull();
    expect(res?.id).toBe("inv1");
  });

  it("getInvoice allowed for hr and manager", async () => {
    for (const role of ["hr", "manager"]) {
      const { caller } = makeCaller([role], "tenantA", {
        invoice: {
          findUnique: vi.fn(async () => null),
          findFirst: vi.fn(async () => null),
          findMany: vi.fn(async () => []),
          create: vi.fn(async () => ({})),
          updateMany: vi.fn(async () => ({ count: 1 })),
        },
      });
      const res = await caller.getInvoice({ id: "missing" });
      expect(res).toBeNull();
    }
  });
});

describe("billing router RBAC: upsertSubscription", () => {
  it.each(["employee", "hr", "manager"])("rejects %s", async (role) => {
    const { caller } = makeCaller([role]);
    await expect(
      caller.upsertSubscription({
        plan: "starter",
        billingInterval: "monthly",
        seats: 1,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      caller.upsertSubscription({
        plan: "starter",
        billingInterval: "monthly",
        seats: 1,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows owner", async () => {
    const { caller } = makeCaller(["owner"]);
    const res = await caller.upsertSubscription({
      plan: "starter",
      billingInterval: "monthly",
      seats: 2,
    });
    expect(res.plan).toBe("starter");
  });

  it("allows admin", async () => {
    const { caller } = makeCaller(["admin"]);
    const res = await caller.upsertSubscription({
      plan: "professional",
      billingInterval: "yearly",
      seats: 5,
    });
    expect(res.plan).toBe("professional");
  });

  it("rejects unauthenticated without session role check still forbidden", async () => {
    const { caller } = makeCaller(["employee"]);
    await expect(
      caller.upsertSubscription({ plan: "free" } as never),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("billing router RBAC: createInvoice", () => {
  it.each(["employee", "hr", "manager"])("rejects %s", async (role) => {
    const { caller } = makeCaller([role]);
    await expect(
      caller.createInvoice({
        amount: 1000,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        billingInterval: "monthly",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows owner", async () => {
    const { caller } = makeCaller(["owner"]);
    const res = await caller.createInvoice({
      amount: 1000,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    expect(res.amount).toBe(1000);
  });

  it("allows admin", async () => {
    const { caller } = makeCaller(["admin"]);
    const res = await caller.createInvoice({
      amount: 2000,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      billingInterval: "yearly",
    });
    expect(res.amount).toBe(2000);
  });
});

describe("billing router validation: createInvoice", () => {
  it("rejects negative amount", async () => {
    const { caller } = makeCaller(["owner"]);
    await expect(
      caller.createInvoice({
        amount: -1,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        billingInterval: "monthly",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      caller.createInvoice({
        amount: -1,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        billingInterval: "monthly",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects float amount (not int)", async () => {
    const { caller } = makeCaller(["owner"]);
    await expect(
      caller.createInvoice({
        amount: 10.5,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        billingInterval: "monthly",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("allows zero amount", async () => {
    const { caller } = makeCaller(["owner"]);
    const res = await caller.createInvoice({
      amount: 0,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    expect(res.amount).toBe(0);
  });

  it("defaults billingInterval to monthly when not provided", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    const res = await caller.createInvoice({
      amount: 1500,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    } as never);
    expect(res.billingInterval).toBe("monthly");
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ billingInterval: "monthly" }),
      }),
    );
    const rawArg = prisma.invoice.create.mock.calls[0][0] as unknown;
    const arg = rawArg as { data: { idempotencyKey: string } };
    expect(arg.data.idempotencyKey).toBe(
      "tenantA:2026-08-01:2026-08-31:1500:monthly",
    );
  });

  it("rejects empty idempotencyKey", async () => {
    const { caller } = makeCaller(["owner"]);
    await expect(
      caller.createInvoice({
        amount: 100,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        billingInterval: "monthly",
        idempotencyKey: "",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("billing router tenant injection and idempotencyKey", () => {
  it("injects tenantId from ctx.session.tenantId not input", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.createInvoice({
      amount: 1000,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("builds idempotencyKey as tenant:periodStart:periodEnd:amount:interval when not provided", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.createInvoice({
      amount: 9999,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      billingInterval: "yearly",
    });
    const raw = prisma.invoice.create.mock.calls[0][0] as unknown;
    const parsed = raw as { data: { idempotencyKey: string } };
    expect(parsed.data.idempotencyKey).toBe(
      "tenantA:2026-09-01:2026-09-30:9999:yearly",
    );
  });

  it("uses provided idempotencyKey when given", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.createInvoice({
      amount: 500,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
      idempotencyKey: "custom-key-123",
    });
    const raw2 = prisma.invoice.create.mock.calls[0][0] as unknown;
    const parsed2 = raw2 as { data: { idempotencyKey: string } };
    expect(parsed2.data.idempotencyKey).toBe("custom-key-123");
  });

  it("tenant isolation: different tenants get different idempotencyKeys", async () => {
    const a = makeCaller(["owner"], "tenantA");
    const b = makeCaller(["owner"], "tenantB");
    await a.caller.createInvoice({
      amount: 100,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    await b.caller.createInvoice({
      amount: 100,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    const rawA = a.prisma.invoice.create.mock.calls[0][0] as unknown;
    const parsedA = rawA as { data: { idempotencyKey: string } };
    const rawB = b.prisma.invoice.create.mock.calls[0][0] as unknown;
    const parsedB = rawB as { data: { idempotencyKey: string } };
    expect(parsedA.data.idempotencyKey).toBe(
      "tenantA:2026-08-01:2026-08-31:100:monthly",
    );
    expect(parsedB.data.idempotencyKey).toBe(
      "tenantB:2026-08-01:2026-08-31:100:monthly",
    );
    expect(parsedA.data.idempotencyKey).not.toBe(parsedB.data.idempotencyKey);
  });

  it("strips tenantId from input if attacker tries to inject", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.createInvoice({
      amount: 1000,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
      tenantId: "evilTenant",
    } as never);
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
    const data = prisma.invoice.create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data.data.tenantId).not.toBe("evilTenant");
  });

  it("passes amount as Cents integer to repo", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.createInvoice({
      amount: 12345,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    const rawAmt = prisma.invoice.create.mock.calls[0][0] as unknown;
    const parsedAmt = rawAmt as { data: { amount: number } };
    expect(parsedAmt.data.amount).toBe(12345);
    expect(Number.isInteger(parsedAmt.data.amount)).toBe(true);
  });
});

describe("billing router idempotency dedup", () => {
  it("second createInvoice with same key returns existing without duplicate create", async () => {
    const existing = {
      id: "inv-existing",
      tenantId: "tenantA",
      subscriptionId: null,
      amount: 1000,
      status: "open",
      billingInterval: "monthly",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "tenantA:2026-08-01:2026-08-31:1000:monthly",
      createdAt: new Date(),
    };
    const { caller, prisma } = makeCaller(["owner"], "tenantA", {
      invoice: {
        findUnique: vi.fn(async () => existing),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => {
          throw new Error("should not create duplicate");
        }),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    });
    const a = await caller.createInvoice({
      amount: 1000,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    const b = await caller.createInvoice({
      amount: 1000,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    expect(a.id).toBe("inv-existing");
    expect(b.id).toBe("inv-existing");
    expect(prisma.invoice.create).not.toHaveBeenCalled();
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: "tenantA:2026-08-01:2026-08-31:1000:monthly" },
    });
  });
});

describe("billing router tenant filtering", () => {
  it("getSubscription filters by tenantId", async () => {
    const { caller, prisma } = makeCaller(["owner"], "tenantA");
    await caller.getSubscription();
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
      where: { tenantId: "tenantA" },
    });
  });

  it("listInvoices filters by tenantId", async () => {
    const { caller, prisma } = makeCaller(["employee"], "tenantB");
    await caller.listInvoices();
    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: { tenantId: "tenantB" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("getInvoice filters by tenantId and id", async () => {
    const findFirst = vi.fn(async () => null);
    const { caller } = makeCaller(["employee"], "tenantA", {
      invoice: {
        findUnique: vi.fn(async () => null),
        findFirst,
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    });
    await caller.getInvoice({ id: "inv1" });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "inv1", tenantId: "tenantA" },
    });
  });

  it("tenancy isolation: getInvoice for tenantA does not return tenantB data", async () => {
    const tenantAInvoice = {
      id: "inv1",
      tenantId: "tenantA",
      subscriptionId: null,
      amount: 1000,
      status: "open",
      billingInterval: "monthly",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      idempotencyKey: "tenantA:2026-08-01:2026-08-31:1000:monthly",
      createdAt: new Date(),
    };
    const callerA = makeCaller(["owner"], "tenantA", {
      invoice: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(
          async ({ where }: { where: { id: string; tenantId: string } }) =>
            where.tenantId === "tenantA" ? tenantAInvoice : null,
        ),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    });
    const callerB = makeCaller(["owner"], "tenantB", {
      invoice: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    });
    const resA = await callerA.caller.getInvoice({ id: "inv1" });
    const resB = await callerB.caller.getInvoice({ id: "inv1" });
    expect(resA?.tenantId).toBe("tenantA");
    expect(resB).toBeNull();
  });

  it("all repo calls are scoped to tenantId from session", async () => {
    const { caller: ca, prisma: pa } = makeCaller(["owner"], "tenantX");
    await ca.getSubscription();
    await ca.listInvoices();
    await ca.createInvoice({
      amount: 100,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      billingInterval: "monthly",
    });
    expect(pa.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenantX" } }),
    );
    expect(pa.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: "tenantX" } }),
    );
    expect(pa.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantX" }),
      }),
    );
  });
});
