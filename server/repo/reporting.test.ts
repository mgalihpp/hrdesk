import { describe, expect, it, vi } from "vitest";
import { cents } from "@/lib/money";
import type { TenantId } from "@/lib/types";
import { reportingRepo } from "./reporting";

const TENANT_A = "tenantA" as unknown as TenantId;
const TENANT_B = "tenantB" as unknown as TenantId;

function mockPrisma(data: {
  employees?: unknown[];
  payRuns?: unknown[];
  payslips?: unknown[];
  timeEntries?: unknown[];
  candidates?: unknown[];
  jobs?: unknown[];
  invoices?: unknown[];
  syncs?: unknown[];
}) {
  return {
    employee: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.employees ?? []) : [],
      ),
    },
    payRun: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.payRuns ?? []) : [],
      ),
    },
    payslip: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.payslips ?? []) : [],
      ),
    },
    timeEntry: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.timeEntries ?? []) : [],
      ),
    },
    candidate: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.candidates ?? []) : [],
      ),
    },
    job: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.jobs ?? []) : [],
      ),
    },
    invoice: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.invoices ?? []) : [],
      ),
    },
    integrationSync: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string } }) =>
        where.tenantId === TENANT_A ? (data.syncs ?? []) : [],
      ),
    },
  } as unknown as Parameters<typeof reportingRepo>[0];
}

describe("reportingRepo tenancy isolation", () => {
  it("overview returns tenant scoped totals and empty for other tenant", async () => {
    const prismaA = mockPrisma({
      employees: [{ status: "active" }, { status: "active" }],
      payRuns: [
        { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
      ],
      payslips: [
        {
          gross: 10000,
          deductions: 1000,
          tax: 500,
          net: 8500,
          payRunId: "pr1",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
      ],
      timeEntries: [
        {
          status: "approved",
          startAt: "2026-01-01T09:00:00Z",
          endAt: "2026-01-01T17:00:00Z",
        },
      ],
      candidates: [{ stage: "applied" }],
      jobs: [{ status: "open" }],
      invoices: [
        {
          amount: 5000,
          status: "paid",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
      ],
      syncs: [{ status: "success" }],
    });
    const repoA = reportingRepo(prismaA, TENANT_A);
    const overA = await repoA.overview();
    expect(overA.headcount.total).toBe(2);
    expect(overA.payroll.gross).toBe(cents(10000));
    expect(overA.billing.totalAmount).toBe(cents(5000));
    expect(overA.sync.total).toBe(1);

    const repoB = reportingRepo(prismaA, TENANT_B);
    const overB = await repoB.overview();
    expect(overB.headcount.total).toBe(0);
    expect(overB.payroll.gross).toBe(cents(0));
    expect(overB.billing.totalAmount).toBe(cents(0));
    expect(overB.sync.total).toBe(0);
  });

  it("every query filtered by tenantId", async () => {
    const prisma = mockPrisma({
      employees: [{ status: "active" }],
      payRuns: [],
      payslips: [],
      timeEntries: [],
      candidates: [],
      jobs: [],
      invoices: [],
      syncs: [],
    });
    const repo = reportingRepo(prisma, TENANT_A);
    await repo.overview();
    const p = prisma as unknown as {
      employee: { findMany: { mock: { calls: unknown[][] } } };
      payRun: { findMany: { mock: { calls: unknown[][] } } };
      payslip: { findMany: { mock: { calls: unknown[][] } } };
      timeEntry: { findMany: { mock: { calls: unknown[][] } } };
      candidate: { findMany: { mock: { calls: unknown[][] } } };
      job: { findMany: { mock: { calls: unknown[][] } } };
      invoice: { findMany: { mock: { calls: unknown[][] } } };
      integrationSync: { findMany: { mock: { calls: unknown[][] } } };
    };
    for (const k of [
      "employee",
      "payRun",
      "payslip",
      "timeEntry",
      "candidate",
      "job",
      "invoice",
      "integrationSync",
    ] as const) {
      const calls = p[k].findMany.mock.calls as {
        where: { tenantId: string };
      }[][];
      expect(calls[0][0].where.tenantId).toBe(TENANT_A);
    }
  });
});

describe("reportingRepo Cents integrity", () => {
  it("payroll sums preserve Cents and reconcile", async () => {
    const prisma = mockPrisma({
      payRuns: [
        { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
        { id: "pr2", periodStart: "2026-02-01", periodEnd: "2026-02-28" },
      ],
      payslips: [
        {
          gross: 10000,
          deductions: 1000,
          tax: 500,
          net: 8500,
          payRunId: "pr1",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
        {
          gross: 20000,
          deductions: 2000,
          tax: 1000,
          net: 17000,
          payRunId: "pr2",
          periodStart: "2026-02-01",
          periodEnd: "2026-02-28",
        },
      ],
      employees: [],
      timeEntries: [],
      candidates: [],
      jobs: [],
      invoices: [],
      syncs: [],
    });
    const repo = reportingRepo(prisma, TENANT_A);
    const over = await repo.overview();
    expect(over.payroll.gross).toBe(cents(30000));
    expect(
      (over.payroll.deductions as number) +
        (over.payroll.tax as number) +
        (over.payroll.net as number),
    ).toBe(over.payroll.gross as number);
    const series = await repo.getPayrollSeries();
    for (const pt of series) {
      expect(
        (pt.deductions as number) + (pt.tax as number) + (pt.net as number),
      ).toBe(pt.gross as number);
    }
  });

  it("invoice sums preserve Cents", async () => {
    const prisma = mockPrisma({
      invoices: [
        {
          amount: 10000,
          status: "paid",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
        {
          amount: 5000,
          status: "open",
          periodStart: "2026-02-01",
          periodEnd: "2026-02-28",
        },
      ],
      employees: [],
      payRuns: [],
      payslips: [],
      timeEntries: [],
      candidates: [],
      jobs: [],
      syncs: [],
    });
    const repo = reportingRepo(prisma, TENANT_A);
    const over = await repo.overview();
    expect(over.billing.totalAmount).toBe(cents(15000));
    expect(over.billing.paidAmount).toBe(cents(10000));
    expect(over.billing.openAmount).toBe(cents(5000));
    const billing = await repo.getBilling();
    expect(billing.totalAmount).toBe(cents(15000));
  });
});

describe("reportingRepo range filtering", () => {
  it("filters payroll and billing by range", async () => {
    const prisma = mockPrisma({
      payRuns: [
        { id: "pr1", periodStart: "2026-01-01", periodEnd: "2026-01-31" },
        { id: "pr2", periodStart: "2026-02-01", periodEnd: "2026-02-28" },
        { id: "pr3", periodStart: "2026-03-01", periodEnd: "2026-03-31" },
      ],
      payslips: [
        {
          gross: 10000,
          deductions: 0,
          tax: 0,
          net: 10000,
          payRunId: "pr1",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
        {
          gross: 20000,
          deductions: 0,
          tax: 0,
          net: 20000,
          payRunId: "pr2",
          periodStart: "2026-02-01",
          periodEnd: "2026-02-28",
        },
        {
          gross: 30000,
          deductions: 0,
          tax: 0,
          net: 30000,
          payRunId: "pr3",
          periodStart: "2026-03-01",
          periodEnd: "2026-03-31",
        },
      ],
      invoices: [
        {
          amount: 1000,
          status: "paid",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        },
        {
          amount: 2000,
          status: "paid",
          periodStart: "2026-02-01",
          periodEnd: "2026-02-28",
        },
      ],
      employees: [],
      timeEntries: [],
      candidates: [],
      jobs: [],
      syncs: [],
    });
    const repo = reportingRepo(prisma, TENANT_A);
    const over = await repo.overview({ from: "2026-01-01", to: "2026-02-28" });
    expect(over.payroll.gross).toBe(cents(30000));
    expect(over.billing.totalAmount).toBe(cents(3000));
    expect(over.payroll.payRunCount).toBe(2);
  });
});
