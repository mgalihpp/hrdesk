import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { TenantId } from "@/lib/types";
import { employeeRepo, type NewEmployee } from "./employee";

const TID = (s: string) => s as TenantId;

interface EmpRow {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  ssnEnc: string;
  bankEnc: string;
  compensation: number;
  hireDate: string;
  status: string;
  createdAt: Date;
}

function fakePrisma() {
  const employees: EmpRow[] = [];
  const prisma = {
    employee: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const rec = { id: "e1", createdAt: new Date(), ...data } as EmpRow;
        employees.push(rec);
        return rec;
      },
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        employees.filter((e) => e.tenantId === where.tenantId),
      findFirst: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) =>
        employees.find(
          (e) => e.id === where.id && e.tenantId === where.tenantId,
        ) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; tenantId: string };
        data: Partial<EmpRow>;
      }) => {
        const i = employees.findIndex(
          (e) => e.id === where.id && e.tenantId === where.tenantId,
        );
        if (i >= 0) {
          employees[i] = { ...employees[i], ...data } as EmpRow;
          return { count: 1 };
        }
        return { count: 0 };
      },
      deleteMany: async ({
        where,
      }: {
        where: { id: string; tenantId: string };
      }) => {
        const i = employees.findIndex(
          (e) => e.id === where.id && e.tenantId === where.tenantId,
        );
        if (i >= 0) {
          employees.splice(i, 1);
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
  };
  return { prisma: prisma as unknown as PrismaClient, employees };
}

const sample: NewEmployee = {
  firstName: "Jane",
  lastName: "Doe",
  email: "j@x.co",
  ssn: "123-45-6789",
  bank: "acct-1",
  compensation: 50000,
  hireDate: "2026-01-01",
  status: "active",
};

describe("employeeRepo", () => {
  it("encrypts PII at write and decrypts at read", async () => {
    const { prisma, employees } = fakePrisma();
    const created = await employeeRepo(prisma, TID("org_a")).create(sample);
    expect(created.ssn).toBe("123-45-6789");
    expect(created.bank).toBe("acct-1");
    expect(created.compensation).toBe(50000);
    expect(employees[0].ssnEnc).not.toBe("123-45-6789");
    expect(employees[0].ssnEnc).toContain(":");
    expect(employees[0].bankEnc).not.toBe("acct-1");
  });

  it("isolates employees by tenant", async () => {
    const { prisma } = fakePrisma();
    await employeeRepo(prisma, TID("org_a")).create(sample);
    const a = await employeeRepo(prisma, TID("org_a")).list();
    const b = await employeeRepo(prisma, TID("org_b")).list();
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
  });
});
