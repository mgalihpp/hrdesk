import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { encrypt } from "@/lib/crypto";
import { payrunRouter } from "@/server/trpc/routers/payrun";

function mockEmployee(over: Record<string, unknown> = {}) {
  return {
    id: "e1",
    tenantId: "t1",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    ssnEnc: encrypt("123-45-6789"),
    bankEnc: encrypt("bank123"),
    compensation: 500000,
    hireDate: "2026-01-01",
    status: "active",
    createdAt: new Date(),
    ...over,
  };
}

function caller(roles: string[], prismaOverrides: unknown = {}) {
  const prisma = {
    employee: {
      findMany: vi.fn(async () => [mockEmployee()]),
      findFirst: vi.fn(async () => mockEmployee()),
    },
    payRun: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "pr1",
        ...data,
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    payslip: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ps1",
        ...data,
      })),
      createMany: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    payItem: {
      createMany: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    timeEntry: {
      findMany: vi.fn(async () => []),
    },
    leave: {
      findMany: vi.fn(async () => []),
    },
    ...(prismaOverrides as Record<string, unknown>),
  } as unknown as never;
  const ctx = {
    session: {
      id: "u1",
      tenantId: "t1" as unknown as never,
      roles: roles as unknown as never,
    },
    prisma,
  } as unknown as never;
  return payrunRouter.createCaller(ctx);
}

describe("payrun router RBAC", () => {
  it("rejects employee role on create", async () => {
    const c = caller(["employee"]);
    await expect(
      c.create({
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        entityId: "default",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows payrollAdmin on create", async () => {
    const c = caller(["payrollAdmin"]);
    const res = await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    });
    expect(res.id).toBeDefined();
  });

  it("list is allowed for any authenticated role", async () => {
    const c = caller(["employee"]);
    const res = await c.list();
    expect(Array.isArray(res)).toBe(true);
  });

  it("create is idempotent: second call with same period returns same id", async () => {
    const existing = {
      id: "existing",
      idempotencyKey: "t1:2026-08-01:2026-08-31:default",
      tenantId: "t1",
    };
    const prisma = {
      payRun: {
        findUnique: vi.fn(async () => existing),
        findFirst: vi.fn(async () => existing),
        findMany: vi.fn(async () => [existing]),
        create: vi.fn(async () => {
          throw new Error("should not create");
        }),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      payslip: {
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
      payItem: {
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
      },
      employee: {
        findMany: vi.fn(async () => [mockEmployee()]),
        findFirst: vi.fn(async () => mockEmployee()),
      },
      timeEntry: {
        findMany: vi.fn(async () => []),
      },
      leave: {
        findMany: vi.fn(async () => []),
      },
    } as unknown as never;
    const c = caller(["payrollAdmin"], prisma);
    const a = await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    });
    const b = await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    });
    expect(a.id).toBe(b.id);
  });
});

describe("payrun router TIME integration", () => {
  it("excludes employee with approved unpaid leave overlapping period", async () => {
    const unpaidLeave = {
      id: "lv1",
      tenantId: "t1",
      employeeId: "e1",
      type: "unpaid",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
      status: "approved",
      reason: null,
      approvedBy: "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const c = caller(["payrollAdmin"], {
      leave: { findMany: vi.fn(async () => [unpaidLeave]) },
      timeEntry: { findMany: vi.fn(async () => []) },
    });
    await expect(
      c.create({
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        entityId: "default",
      }),
    ).rejects.toThrow("No eligible employees");
  });

  it("includes timeSummary with approved counts", async () => {
    const te = {
      id: "te1",
      tenantId: "t1",
      employeeId: "e1",
      type: "clock",
      startAt: new Date("2026-08-15T09:00:00Z"),
      endAt: new Date("2026-08-15T17:00:00Z"),
      status: "approved",
      approvedBy: "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const lv = {
      id: "lv1",
      tenantId: "t1",
      employeeId: "e2",
      type: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
      status: "approved",
      reason: null,
      approvedBy: "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const c = caller(["payrollAdmin"], {
      timeEntry: { findMany: vi.fn(async () => [te]) },
      leave: { findMany: vi.fn(async () => [lv]) },
    });
    const res = (await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    })) as unknown as {
      timeSummary: { approvedTimeEntries: number; approvedLeaves: number };
    };
    expect(res.timeSummary.approvedTimeEntries).toBe(1);
    expect(res.timeSummary.approvedLeaves).toBe(1);
  });

  it("vacation leave does not exclude employee", async () => {
    const vac = {
      id: "lv1",
      tenantId: "t1",
      employeeId: "e1",
      type: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
      status: "approved",
      reason: null,
      approvedBy: "u1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const c = caller(["payrollAdmin"], {
      leave: { findMany: vi.fn(async () => [vac]) },
      timeEntry: { findMany: vi.fn(async () => []) },
    });
    const res = (await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    })) as unknown as { id: string };
    expect(res.id).toBeDefined();
  });

  it("excludes unpaid employee but keeps others and surfaces excludedIds in timeSummary", async () => {
    const e1 = mockEmployee({ id: "e1", email: "e1@example.com" });
    const e2 = mockEmployee({ id: "e2", email: "e2@example.com" });
    const leaveRows = [
      {
        id: "l1",
        tenantId: "t1",
        employeeId: "e2",
        type: "unpaid",
        startDate: "2026-08-10",
        endDate: "2026-08-20",
        status: "approved",
        reason: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const payslipCreate = vi.fn(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: `ps-${data.employeeId}`,
        ...data,
      }),
    );
    const prisma = {
      employee: {
        findMany: vi.fn(async () => [e1, e2]),
        findFirst: vi.fn(async () => e1),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      payslip: {
        create: payslipCreate,
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
      payItem: {
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
      },
      timeEntry: { findMany: vi.fn(async () => []) },
      leave: { findMany: vi.fn(async () => leaveRows) },
    };
    const c = caller(["payrollAdmin"], prisma as unknown);
    const res = (await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    })) as unknown as {
      timeSummary: {
        excludedByUnpaidLeave: string[];
        approvedLeaves: number;
        approvedTimeEntries: number;
      };
    };
    expect(res.timeSummary.excludedByUnpaidLeave).toContain("e2");
    expect(res.timeSummary.approvedLeaves).toBe(1);
    expect(payslipCreate).toHaveBeenCalledTimes(1);
  });

  it("filters pending and out-of-period TIME from timeSummary counts", async () => {
    const timeRows = [
      {
        id: "te1",
        tenantId: "t1",
        employeeId: "e1",
        type: "clock",
        startAt: new Date("2026-08-15T09:00:00Z"),
        endAt: new Date("2026-08-15T17:00:00Z"),
        status: "approved",
        approvedBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "te2",
        tenantId: "t1",
        employeeId: "e1",
        type: "clock",
        startAt: new Date("2026-07-15T09:00:00Z"),
        endAt: new Date("2026-07-15T17:00:00Z"),
        status: "approved",
        approvedBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "te3",
        tenantId: "t1",
        employeeId: "e1",
        type: "clock",
        startAt: new Date("2026-08-20T09:00:00Z"),
        endAt: new Date("2026-08-20T17:00:00Z"),
        status: "pending",
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const leaveRows = [
      {
        id: "l1",
        tenantId: "t1",
        employeeId: "e1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: "approved",
        reason: null,
        approvedBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "l2",
        tenantId: "t1",
        employeeId: "e1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: "pending",
        reason: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const c = caller(["payrollAdmin"], {
      timeEntry: { findMany: vi.fn(async () => timeRows) },
      leave: { findMany: vi.fn(async () => leaveRows) },
    });
    const res = (await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    })) as unknown as {
      timeSummary: { approvedTimeEntries: number; approvedLeaves: number };
    };
    expect(res.timeSummary.approvedTimeEntries).toBe(1);
    expect(res.timeSummary.approvedLeaves).toBe(1);
  });

  it("byId returns timeSummary and filtered TIME for audit", async () => {
    const payRunRow = {
      id: "pr1",
      tenantId: "t1",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      status: "draft",
      idempotencyKey: "t1:2026-08-01:2026-08-31:default",
    };
    const timeRows = [
      {
        id: "te1",
        tenantId: "t1",
        employeeId: "e1",
        type: "clock",
        startAt: new Date("2026-08-15T09:00:00.000Z"),
        endAt: new Date("2026-08-15T17:00:00.000Z"),
        status: "approved",
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const leaveRows = [
      {
        id: "l1",
        tenantId: "t1",
        employeeId: "e1",
        type: "vacation",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        status: "approved",
        reason: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const c = caller(["payrollAdmin"], {
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async (args: unknown) => {
          const where = (args as { where: { id: string } }).where;
          if (where?.id === "pr1") return payRunRow;
          return null;
        }),
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      payslip: {
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
      payItem: {
        createMany: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
      },
      employee: {
        findMany: vi.fn(async () => [mockEmployee()]),
        findFirst: vi.fn(async () => mockEmployee()),
      },
      timeEntry: { findMany: vi.fn(async () => timeRows) },
      leave: { findMany: vi.fn(async () => leaveRows) },
    } as unknown);
    const res = (await c.byId({ id: "pr1" })) as unknown as {
      payRun: unknown;
      payslips: unknown[];
      timeSummary: { approvedTimeEntries: number; approvedLeaves: number };
      timeEntries: unknown[];
      leaves: unknown[];
    };
    expect(res.payRun).toBeDefined();
    expect(res.timeSummary.approvedTimeEntries).toBe(1);
    expect(res.timeSummary.approvedLeaves).toBe(1);
    expect(res.timeEntries).toHaveLength(1);
    expect(res.leaves).toHaveLength(1);
  });

  it("tenancy: all repo calls are scoped to tenantId", async () => {
    const employeeFindMany = vi.fn(async () => [mockEmployee()]);
    const timeFindMany = vi.fn(async () => []);
    const leaveFindMany = vi.fn(async () => []);
    const c = caller(["payrollAdmin"], {
      employee: {
        findMany: employeeFindMany,
        findFirst: vi.fn(async () => mockEmployee()),
      },
      timeEntry: { findMany: timeFindMany },
      leave: { findMany: leaveFindMany },
    } as unknown);
    await c.create({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
    });
    const empWhere = (
      (
        employeeFindMany.mock.calls as unknown as Array<
          Array<{ where: { tenantId: string } }>
        >
      )[0]?.[0] as { where: { tenantId: string } } | undefined
    )?.where;
    expect(empWhere?.tenantId).toBe("t1");
    const timeWhere = (
      (
        timeFindMany.mock.calls as unknown as Array<
          Array<{ where: { tenantId: string } }>
        >
      )[0]?.[0] as { where: { tenantId: string } } | undefined
    )?.where;
    expect(timeWhere?.tenantId).toBe("t1");
    const leaveWhere = (
      (
        leaveFindMany.mock.calls as unknown as Array<
          Array<{ where: { tenantId: string } }>
        >
      )[0]?.[0] as { where: { tenantId: string } } | undefined
    )?.where;
    expect(leaveWhere?.tenantId).toBe("t1");
  });
});

describe("payrun router payslip RBAC + filtering", () => {
  it("listPayslips allowed for employee role", async () => {
    const payslipRow = {
      id: "ps1",
      tenantId: "t1",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 10000,
      deductions: 0,
      tax: 1000,
      net: 9000,
      createdAt: new Date("2026-08-31T00:00:00Z"),
    };
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => [payslipRow]),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => [
          {
            id: "pr1",
            status: "locked",
            periodStart: "2026-08-01",
            periodEnd: "2026-08-31",
          },
        ]),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => [
          {
            id: "e1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            department: "Engineering",
          },
        ]),
        findFirst: vi.fn(async () => ({
          id: "e1",
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          department: "Engineering",
        })),
      },
      payItem: {
        findMany: vi.fn(async () => []),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    const res = await c.listPayslips({});
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(1);
  });

  it("listPayslips filtering by status Paid", async () => {
    const slips = [
      {
        id: "ps1",
        tenantId: "t1",
        payRunId: "prLocked",
        employeeId: "e1",
        gross: 1000,
        deductions: 0,
        tax: 100,
        net: 900,
        createdAt: new Date(),
      },
      {
        id: "ps2",
        tenantId: "t1",
        payRunId: "prDraft",
        employeeId: "e2",
        gross: 1000,
        deductions: 0,
        tax: 100,
        net: 900,
        createdAt: new Date(),
      },
    ];
    const payRuns = [
      {
        id: "prLocked",
        status: "locked",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
      {
        id: "prDraft",
        status: "draft",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
    ];
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => slips),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => payRuns),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => [
          {
            id: "e1",
            firstName: "A",
            lastName: "B",
            email: "a@b.com",
            department: "Engineering",
          },
          {
            id: "e2",
            firstName: "C",
            lastName: "D",
            email: "c@d.com",
            department: "Sales",
          },
        ]),
        findFirst: vi.fn(async () => ({
          id: "e1",
          firstName: "A",
          lastName: "B",
          email: "a@b.com",
          department: "Engineering",
        })),
      },
      payItem: {
        findMany: vi.fn(async () => []),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    const paid = await c.listPayslips({ status: "Paid" });
    expect(paid).toHaveLength(1);
    expect(paid[0]?.id).toBe("ps1");
    const pending = await c.listPayslips({ status: "Pending" });
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe("ps2");
  });

  it("listPayslips filtering by payRunId tenant-scoped", async () => {
    const slip = {
      id: "ps1",
      tenantId: "t1",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 1000,
      deductions: 0,
      tax: 0,
      net: 1000,
      createdAt: new Date(),
    };
    const payslipFindMany = vi.fn(async () => [slip]);
    const c = caller(["employee"], {
      payslip: {
        findMany: payslipFindMany,
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => [
          {
            id: "pr1",
            status: "locked",
            periodStart: "2026-08-01",
            periodEnd: "2026-08-31",
          },
        ]),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => [
          {
            id: "e1",
            firstName: "A",
            lastName: "B",
            email: "a@b.com",
            department: "Engineering",
          },
        ]),
        findFirst: vi.fn(async () => ({
          id: "e1",
          firstName: "A",
          lastName: "B",
          email: "a@b.com",
          department: "Engineering",
        })),
      },
      payItem: {
        findMany: vi.fn(async () => []),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    const res = await c.listPayslips({ payRunId: "pr1" });
    expect(res).toHaveLength(1);
    expect(payslipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "t1", payRunId: "pr1" }),
      }),
    );
  });

  it("getPayslipById returns NOT_FOUND cross-tenant", async () => {
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
      payItem: {
        findMany: vi.fn(async () => []),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    await expect(c.getPayslipById({ id: "missing" })).rejects.toBeInstanceOf(
      TRPCError,
    );
    await expect(c.getPayslipById({ id: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("getPayslipById success returns enriched view", async () => {
    const slip = {
      id: "ps1",
      tenantId: "t1",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 10000,
      deductions: 500,
      tax: 1000,
      net: 8500,
      createdAt: new Date("2026-08-31T00:00:00Z"),
    };
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => slip),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => ({
          id: "pr1",
          status: "locked",
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
        })),
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => ({
          id: "e1",
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          department: "Engineering",
        })),
      },
      payItem: {
        findMany: vi.fn(async () => [
          { id: "pi1", category: "gross", amount: 10000, label: "Base" },
        ]),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    const res = await c.getPayslipById({ id: "ps1" });
    expect(res.id).toBe("ps1");
    expect(res.employeeName).toBe("Ada Lovelace");
    expect(res.payItems).toHaveLength(1);
    expect(res.payItems[0]?.amount).toBe(10000);
  });

  it("getPayslipById tenancy scope uses tenantId", async () => {
    const slip = {
      id: "ps1",
      tenantId: "t1",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 1000,
      deductions: 0,
      tax: 0,
      net: 1000,
      createdAt: new Date(),
    };
    const payslipFindFirst = vi.fn(async () => slip);
    const payRunFindFirst = vi.fn(async () => ({
      id: "pr1",
      status: "locked",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    }));
    const employeeFindFirst = vi.fn(async () => ({
      id: "e1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      department: "Engineering",
    }));
    const payItemFindMany = vi.fn(async () => []);
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => []),
        findFirst: payslipFindFirst,
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: payRunFindFirst,
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => []),
        findFirst: employeeFindFirst,
      },
      payItem: {
        findMany: payItemFindMany,
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    await c.getPayslipById({ id: "ps1" });
    expect(payslipFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "t1" }),
      }),
    );
    expect(payRunFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "t1" }),
      }),
    );
    expect(payItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "t1" }),
      }),
    );
  });

  it("listPayslips with no input defaults to empty object", async () => {
    const c = caller(["employee"], {
      payslip: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
        createMany: vi.fn(async () => ({})),
      },
      payRun: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: "pr1",
          ...data,
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      employee: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
      payItem: {
        findMany: vi.fn(async () => []),
        createMany: vi.fn(async () => ({})),
      },
    } as unknown);
    const res = await c.listPayslips();
    expect(res).toEqual([]);
  });
});
