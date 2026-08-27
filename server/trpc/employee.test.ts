import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { SessionUser, TenantId } from "@/lib/types";
import { appRouter } from "./routers/_app";

const TID = (s: string) => s as TenantId;

const session = (roles: SessionUser["roles"]): SessionUser => ({
  id: "u1",
  tenantId: TID("org_a"),
  roles,
});

function fakePrisma(): PrismaClient {
  return {
    employee: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: "e1",
        createdAt: new Date(),
        ...data,
      }),
      findMany: async () => [],
      findFirst: async () => null,
      updateMany: async () => ({ count: 0 }),
      deleteMany: async () => ({ count: 0 }),
    },
  } as unknown as PrismaClient;
}

const sample = {
  firstName: "J",
  lastName: "D",
  email: "j@x.co",
  ssn: "123",
  bank: "a",
  compensation: 1,
  hireDate: "2026-01-01",
  status: "active" as const,
};

describe("employee RBAC", () => {
  it("rejects create without a write role", async () => {
    const caller = appRouter.createCaller({
      session: session(["employee"]),
      prisma: fakePrisma(),
    });
    await expect(caller.employee.create(sample)).rejects.toThrow(/FORBIDDEN/);
  });

  it("allows create with hr role", async () => {
    const caller = appRouter.createCaller({
      session: session(["hr"]),
      prisma: fakePrisma(),
    });
    const res = await caller.employee.create(sample);
    expect(res.id).toBeDefined();
  });

  it("rejects unauthenticated reads", async () => {
    const caller = appRouter.createCaller({
      session: null,
      prisma: fakePrisma(),
    });
    await expect(caller.employee.list()).rejects.toThrow(/UNAUTHORIZED/);
  });
});
