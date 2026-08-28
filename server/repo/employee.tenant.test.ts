import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { TenantId } from "@/lib/types";
import { employeeRepo } from "./employee";

const TID = (s: string) => s as TenantId;
const TENANT_A = TID("org_a");
const TENANT_B = TID("org_b");

function fakePrismaWithStore(store: Record<string, unknown>[]) {
  return {
    employee: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `e${store.length}`, createdAt: new Date(), ...data };
        store.push(row);
        return row;
      },
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        store.filter((r) => r.tenantId === where.tenantId),
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        store.find((r) => r.id === where.id && r.tenantId === where.tenantId) ??
        null,
      updateMany: async () => ({ count: 0 }),
      deleteMany: async () => ({ count: 0 }),
    },
  } as unknown as PrismaClient;
}

describe("employeeRepo tenancy", () => {
  it("isolates list by tenantId", async () => {
    const store: Record<string, unknown>[] = [];
    const prisma = fakePrismaWithStore(store);
    const repoA = employeeRepo(prisma, TENANT_A);
    await repoA.create({
      firstName: "A",
      lastName: "B",
      email: "a@x.co",
      ssn: "123",
      bank: "b",
      compensation: 100,
      hireDate: "2026-01-01",
      status: "active",
    });
    store.push({
      id: "eX",
      tenantId: TENANT_B,
      firstName: "Other",
      lastName: "Tenant",
      email: "other@x.co",
      ssnEnc: "x",
      bankEnc: "x",
      compensation: 100,
      hireDate: "2026-01-01",
      status: "active",
      createdAt: new Date(),
    });
    const listA = await repoA.list();
    expect(listA).toHaveLength(1);
    expect(listA[0]?.email).toBe("a@x.co");
  });

  it("getById respects tenant", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "e1",
        tenantId: TENANT_B,
        firstName: "B",
        lastName: "B",
        email: "b@x.co",
        ssnEnc: "x",
        bankEnc: "x",
        compensation: 100,
        hireDate: "2026-01-01",
        status: "active",
        createdAt: new Date(),
      },
    ];
    const prisma = fakePrismaWithStore(store);
    const repoA = employeeRepo(prisma, TENANT_A);
    const res = await repoA.getById("e1" as never);
    expect(res).toBeNull();
  });
});
