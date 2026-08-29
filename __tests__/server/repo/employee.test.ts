import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { encrypt } from "@/lib/crypto";
import type { TenantId } from "@/lib/types";
import { employeeRepo, type NewEmployee } from "@/server/repo/employee";

const TID = (s: string) => s as TenantId;

interface EmpRow {
  id: string;
  tenantId: string;
  lastName: string;
  email: string;
  ssnEnc: string;
  bankEnc: string;
  compensation: number;
  hireDate: string;
  status: string;
  department?: string | null;
  position?: string | null;
  employmentType?: string | null;
  avatarUrl?: string | null;
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

  it("round-trips department fields via create and list/getById", async () => {
    const { prisma } = fakePrisma();
    const repo = employeeRepo(prisma, TID("org_a"));
    const created = await repo.create({
      ...sample,
      email: "dept@x.co",
      department: "Marketing",
      position: "Growth Manager",
      employmentType: "Contract",
      avatarUrl: "https://example.com/a.png",
    });
    expect(created.department).toBe("Marketing");
    expect(created.position).toBe("Growth Manager");
    expect(created.employmentType).toBe("Contract");
    expect(created.avatarUrl).toBe("https://example.com/a.png");
    const listed = await repo.list();
    expect(listed[0]?.department).toBe("Marketing");
    const fetched = await repo.getById(created.id);
    expect(fetched?.position).toBe("Growth Manager");
  });

  it("defaults legacy rows without new fields", async () => {
    const { prisma, employees } = fakePrisma();
    employees.push({
      id: "e_legacy",
      tenantId: "org_a",
      firstName: "Legacy",
      lastName: "User",
      email: "legacy@x.co",
      ssnEnc: encrypt("123-45-6789"),
      bankEnc: encrypt("acct-1"),
      compensation: 100,
      hireDate: "2026-01-01",
      status: "active",
      createdAt: new Date(),
    } as EmpRow);
    const repo = employeeRepo(prisma, TID("org_a"));
    const row = await repo.getById("e_legacy" as never);
    expect(row?.department).toBe("Engineering");
    expect(row?.position).toBe("Employee");
    expect(row?.employmentType).toBe("Full Time");
    expect(row?.avatarUrl).toBe("");
  });

  it("updates department fields", async () => {
    const { prisma } = fakePrisma();
    const repo = employeeRepo(prisma, TID("org_a"));
    const created = await repo.create(sample);
    await repo.update(created.id, {
      department: "Finance",
      position: "Accountant",
    });
    const updated = await repo.getById(created.id);
    expect(updated?.department).toBe("Finance");
    expect(updated?.position).toBe("Accountant");
  });
});
