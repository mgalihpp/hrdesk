import { describe, expect, it, vi } from "vitest";
import { cents } from "@/lib/money";
import { payRunRepo } from "@/server/repo/payrun";

function result(over: Record<string, unknown> = {}) {
  return {
    payRunId: "k1" as unknown as never,
    tenantId: "tenantA" as unknown as never,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    entityId: "default",
    idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
    status: "draft" as const,
    payslips: [
      {
        id: "ps1" as unknown as never,
        payRunId: "k1" as unknown as never,
        employeeId: "e1" as unknown as never,
        tenantId: "tenantA" as unknown as never,
        gross: cents(10000),
        deductions: cents(0),
        tax: cents(1000),
        net: cents(9000),
        items: [],
      },
    ],
    totals: {
      gross: cents(10000),
      deductions: cents(0),
      tax: cents(1000),
      net: cents(9000),
    },
    ...over,
  };
}

function mockPrisma() {
  return {
    payRun: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "newId",
        ...data,
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    payslip: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "ps1",
        ...data,
      })),
      createMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    payItem: {
      createMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => []),
    },
    employee: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
  } as unknown as never;
}

describe("payRunRepo tenancy", () => {
  it("create always scopes writes to the factory tenantId even if result has different tenant", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.create(
      result({ tenantId: "evil" as unknown as never }) as never,
    );
    expect(prisma.payRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("list filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.list();
    expect(prisma.payRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("getById filters by tenantId", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.getById("someId" as unknown as never);
    expect(prisma.payRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });
});

describe("payRunRepo idempotency", () => {
  it("returns existing run when idempotencyKey already exists instead of creating duplicate", async () => {
    const existing = {
      id: "existingId",
      idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
      tenantId: "tenantA",
    };
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payRun.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(existing);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.create(result() as never);
    expect(res.id).toBe("existingId");
    expect(prisma.payRun.create).not.toHaveBeenCalled();
  });

  it("lock rejects cross-tenant id", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payRun.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await expect(
      repo.lock("otherTenantId" as unknown as never),
    ).rejects.toThrow(/not found/i);
  });
});

describe("payRunRepo payslip listPayslips tenancy", () => {
  it("returns only tenant slips via tenantId filter", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const payslipRow = {
      id: "ps1",
      tenantId: "tenantA",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 10000,
      deductions: 0,
      tax: 1000,
      net: 9000,
      createdAt: new Date("2026-08-31T00:00:00Z"),
    };
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([payslipRow]);
    (
      prisma.payRun.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "pr1",
        status: "locked",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
    ]);
    (
      prisma.employee.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "e1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        department: "Engineering",
      },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.listPayslips();
    expect(prisma.payslip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
    expect(res).toHaveLength(1);
    expect(res[0]?.employeeName).toBe("Ada Lovelace");
    expect(res[0]?.gross).toBe(10000);
    expect(res[0]?.periodLabel).toBe("August 2026");
  });

  it("filters by payRunId with tenant scope", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const payslipRow = {
      id: "ps2",
      tenantId: "tenantA",
      payRunId: "pr2",
      employeeId: "e2",
      gross: 5000,
      deductions: 500,
      tax: 200,
      net: 4300,
      createdAt: new Date("2026-08-31T00:00:00Z"),
    };
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([payslipRow]);
    (
      prisma.payRun.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "pr2",
        status: "draft",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
    ]);
    (
      prisma.employee.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "e2",
        firstName: "Bob",
        lastName: "",
        email: "bob@example.com",
        department: null,
      },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.listPayslips({ payRunId: "pr2" });
    expect(prisma.payslip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenantA",
          payRunId: "pr2",
        }),
      }),
    );
    expect(res[0]?.department).toBe("Engineering");
    expect(res[0]?.employeeName).toBe("Bob");
  });

  it("status filter maps Paid to locked and Pending to draft", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    const slips = [
      {
        id: "ps1",
        tenantId: "tenantA",
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
        tenantId: "tenantA",
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
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(slips);
    (
      prisma.payRun.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(payRuns);
    (
      prisma.employee.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      {
        id: "e1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        department: "Finance",
      },
      {
        id: "e2",
        firstName: "C",
        lastName: "D",
        email: "c@d.com",
        department: "Sales",
      },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const paid = await repo.listPayslips({ status: "Paid" });
    expect(paid).toHaveLength(1);
    expect(paid[0]?.id).toBe("ps1");
    const pending = await repo.listPayslips({ status: "Pending" });
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe("ps2");
    const generated = await repo.listPayslips({ status: "Generated" });
    expect(generated).toHaveLength(1);
    expect(generated[0]?.id).toBe("ps2");
  });

  it("status filter is tenant-scoped via payRun query", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "ps1",
        tenantId: "tenantA",
        payRunId: "pr1",
        employeeId: "e1",
        gross: 1000,
        deductions: 0,
        tax: 0,
        net: 1000,
        createdAt: new Date(),
      },
    ]);
    (
      prisma.payRun.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "pr1",
        status: "locked",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
    ]);
    (
      prisma.employee.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "e1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        department: "Engineering",
      },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.listPayslips({ status: "Paid" });
    expect(prisma.payRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });

  it("returns empty when no slips", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.listPayslips();
    expect(res).toEqual([]);
    expect(prisma.payRun.findMany).not.toHaveBeenCalled();
  });

  it("enriches with email fallback and cents branding", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "ps1",
        tenantId: "tenantA",
        payRunId: "pr1",
        employeeId: "e1",
        gross: 12000,
        deductions: 100,
        tax: 200,
        net: 11700,
        createdAt: new Date("2026-08-31T00:00:00Z"),
      },
    ]);
    (
      prisma.payRun.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "pr1",
        status: "locked",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      },
    ]);
    (
      prisma.employee.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: "e1",
        firstName: "",
        lastName: "",
        email: "fallback@example.com",
        department: null,
      },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.listPayslips();
    expect(res[0]?.employeeName).toBe("fallback@example.com");
    expect(typeof res[0]?.gross).toBe("number");
    expect(res[0]?.gross).toBe(12000);
    expect(Number.isInteger(res[0]?.net as number)).toBe(true);
  });
});

describe("payRunRepo getPayslipById tenancy", () => {
  it("returns null cross-tenant", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.getPayslipById("psOther" as unknown as never);
    expect(res).toBeNull();
    expect(prisma.payslip.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA", id: "psOther" }),
      }),
    );
  });

  it("returns null when payRun missing", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "ps1",
      tenantId: "tenantA",
      payRunId: "prMissing",
      employeeId: "e1",
      gross: 1000,
      deductions: 0,
      tax: 0,
      net: 1000,
      createdAt: new Date(),
    });
    (
      prisma.payRun.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.getPayslipById("ps1" as unknown as never);
    expect(res).toBeNull();
  });

  it("returns detailed view with payItems and cents", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "ps1",
      tenantId: "tenantA",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 10000,
      deductions: 500,
      tax: 1000,
      net: 8500,
      createdAt: new Date("2026-08-31T00:00:00Z"),
    });
    (
      prisma.payRun.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "pr1",
      status: "locked",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
    (
      prisma.employee.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "e1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      department: "Engineering",
    });
    (
      prisma.payItem.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      { id: "pi1", category: "gross", amount: 10000, label: "Base" },
      { id: "pi2", category: "tax", amount: 1000, label: "Tax" },
    ]);
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    const res = await repo.getPayslipById("ps1" as unknown as never);
    expect(res?.employeeName).toBe("Ada Lovelace");
    expect(res?.periodLabel).toBe("August 2026");
    expect(res?.payItems).toHaveLength(2);
    expect(res?.payItems[0]?.amount).toBe(10000);
    expect(res?.gross).toBe(10000);
    expect(prisma.payItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenantA",
          payslipId: "ps1",
        }),
      }),
    );
  });

  it("tenant isolation on payRun and payItem lookups", async () => {
    const prisma = mockPrisma() as never as Parameters<typeof payRunRepo>[0];
    (
      prisma.payslip.findFirst as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "ps1",
      tenantId: "tenantA",
      payRunId: "pr1",
      employeeId: "e1",
      gross: 1000,
      deductions: 0,
      tax: 0,
      net: 1000,
      createdAt: new Date(),
    });
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
    prisma.payRun.findFirst = payRunFindFirst as unknown as never;
    prisma.employee.findFirst = employeeFindFirst as unknown as never;
    prisma.payItem.findMany = payItemFindMany as unknown as never;
    const repo = payRunRepo(prisma, "tenantA" as unknown as never);
    await repo.getPayslipById("ps1" as unknown as never);
    expect(payRunFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
    expect(employeeFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
    expect(payItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: "tenantA" }),
      }),
    );
  });
});
