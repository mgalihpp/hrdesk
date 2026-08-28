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
    },
    payItem: {
      createMany: vi.fn(async () => ({})),
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
      },
      payItem: {
        createMany: vi.fn(async () => ({})),
      },
      employee: {
        findMany: vi.fn(async () => [mockEmployee()]),
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
