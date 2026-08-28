import { describe, expect, it, vi } from "vitest";
import { reportingRouter } from "@/server/trpc/routers/reporting";

function makeCaller(
  roles: string[],
  tenantId = "tenantA",
  prismaOverrides: Record<string, unknown> = {},
) {
  const basePrisma = {
    employee: { findMany: vi.fn(async () => []) },
    payRun: { findMany: vi.fn(async () => []) },
    payslip: { findMany: vi.fn(async () => []) },
    timeEntry: { findMany: vi.fn(async () => []) },
    candidate: { findMany: vi.fn(async () => []) },
    job: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    integrationSync: { findMany: vi.fn(async () => []) },
    ...prismaOverrides,
  };
  const ctx = {
    session: roles.length > 0 ? { id: "u1", tenantId, roles } : null,
    prisma: basePrisma,
  } as unknown as never;
  return reportingRouter.createCaller(ctx);
}

describe("reporting router auth", () => {
  it("rejects unauthed for overview", async () => {
    const caller = makeCaller([]);
    await expect(caller.overview()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects unauthed for payrollSeries", async () => {
    const caller = makeCaller([]);
    await expect(caller.payrollSeries()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects unauthed for headcount", async () => {
    const caller = makeCaller([]);
    await expect(caller.headcount()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows viewer roles", async () => {
    for (const role of [
      "owner",
      "admin",
      "manager",
      "hr",
      "employee",
      "payrollAdmin",
    ]) {
      const caller = makeCaller([role]);
      const r = await caller.overview();
      expect(r).toBeDefined();
      expect(r.headcount).toBeDefined();
    }
  });
});

describe("reporting router validation", () => {
  it("rejects bad date format", async () => {
    const caller = makeCaller(["owner"]);
    await expect(
      caller.overview({
        from: "2026/01/01",
        to: "2026-01-31",
      } as unknown as never),
    ).rejects.toThrow();
    await expect(
      caller.overview({
        from: "01-01-2026",
        to: "2026-01-31",
      } as unknown as never),
    ).rejects.toThrow();
    await expect(
      caller.payrollSeries({
        from: "bad",
        to: "2026-01-31",
      } as unknown as never),
    ).rejects.toThrow();
    await expect(
      caller.billing({
        from: "2026-01-01",
        to: "not-a-date",
      } as unknown as never),
    ).rejects.toThrow();
  });

  it("accepts valid range", async () => {
    const caller = makeCaller(["owner"]);
    const r = await caller.overview({ from: "2026-01-01", to: "2026-01-31" });
    expect(r).toBeDefined();
  });

  it("rejects from greater than to", async () => {
    const caller = makeCaller(["owner"]);
    await expect(
      caller.overview({ from: "2026-02-01", to: "2026-01-01" }),
    ).rejects.toThrow();
  });

  it("single day range allowed", async () => {
    const caller = makeCaller(["owner"]);
    const r = await caller.overview({ from: "2026-01-01", to: "2026-01-01" });
    expect(r).toBeDefined();
  });
});

describe("reporting router tenant injection", () => {
  it("ignores injected tenantId and uses session tenant", async () => {
    const findMany = vi.fn(
      async ({ where }: { where: { tenantId: string } }) => {
        if (where.tenantId === "tenantA") return [{ status: "active" }];
        return [];
      },
    );
    const prismaOverrides = {
      employee: { findMany },
      payRun: { findMany: vi.fn(async () => []) },
      payslip: { findMany: vi.fn(async () => []) },
      timeEntry: { findMany: vi.fn(async () => []) },
      candidate: { findMany: vi.fn(async () => []) },
      job: { findMany: vi.fn(async () => []) },
      invoice: { findMany: vi.fn(async () => []) },
      integrationSync: { findMany: vi.fn(async () => []) },
    };
    const caller = makeCaller(["owner"], "tenantA", prismaOverrides);
    const input = {
      from: "2026-01-01",
      to: "2026-01-31",
      tenantId: "tenantB",
    } as unknown as never;
    const r = await caller.overview(input);
    expect(r.headcount.total).toBe(1);
    expect(findMany).toHaveBeenCalledWith({ where: { tenantId: "tenantA" } });
  });

  it("returns empty for other tenant data when caller is tenantB", async () => {
    const findMany = vi.fn(
      async ({ where }: { where: { tenantId: string } }) => {
        if (where.tenantId === "tenantA")
          return [{ status: "active" }, { status: "active" }];
        return [];
      },
    );
    const overrides = {
      employee: { findMany },
      payRun: { findMany: vi.fn(async () => []) },
      payslip: { findMany: vi.fn(async () => []) },
      timeEntry: { findMany: vi.fn(async () => []) },
      candidate: { findMany: vi.fn(async () => []) },
      job: { findMany: vi.fn(async () => []) },
      invoice: { findMany: vi.fn(async () => []) },
      integrationSync: { findMany: vi.fn(async () => []) },
    };
    const callerB = makeCaller(["owner"], "tenantB", overrides);
    const r = await callerB.overview();
    expect(r.headcount.total).toBe(0);
  });
});

describe("reporting router procedures return shapes", () => {
  it("all procedures return without throw for authed user", async () => {
    const caller = makeCaller(["employee"]);
    expect(await caller.headcount()).toBeDefined();
    expect(await caller.pipeline()).toBeDefined();
    expect(await caller.syncHealth()).toBeDefined();
    expect(await caller.payrollSeries()).toBeDefined();
    expect(await caller.attendance()).toBeDefined();
    expect(await caller.billing()).toBeDefined();
  });
});
