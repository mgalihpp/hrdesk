import { describe, expect, it, vi } from "vitest";
import type { DepartmentId, TenantId } from "@/lib/types";
import { departmentRepo } from "@/server/repo/department";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function mockPrisma(store: Record<string, unknown>[] = []) {
  return {
    department: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `dept_${store.length + 1}`,
          createdAt: new Date("2026-08-28T00:00:00.000Z"),
          updatedAt: new Date("2026-08-28T00:00:00.000Z"),
          ...data,
        };
        store.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return store.filter((r) => {
          if (where.tenantId && r.tenantId !== where.tenantId) return false;
          return true;
        });
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return (
            store.find((r) => {
              if (where.id && r.id !== where.id) return false;
              if (where.tenantId && r.tenantId !== where.tenantId) return false;
              return true;
            }) ?? null
          );
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => {
          let count = 0;
          for (const r of store) {
            if (r.id === where.id && r.tenantId === where.tenantId) {
              Object.assign(r, data);
              count++;
            }
          }
          return { count };
        },
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          const before = store.length;
          for (let i = store.length - 1; i >= 0; i--) {
            if (
              store[i]?.id === where.id &&
              store[i]?.tenantId === where.tenantId
            ) {
              store.splice(i, 1);
            }
          }
          return { count: before - store.length };
        },
      ),
    },
  } as unknown as import("@prisma/client").PrismaClient;
}

const baseInput = {
  name: "Engineering",
  iconKey: "engineering" as const,
  headName: "Alice",
  headEmail: "alice@example.com",
  location: "HQ" as const,
  budgetUtil: 50,
};

describe("departmentRepo tenancy", () => {
  it("create includes tenantId", async () => {
    const prisma = mockPrisma();
    const repo = departmentRepo(prisma, tenantA);
    await repo.create(baseInput);
    expect(prisma.department.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: tenantA }),
      }),
    );
    const repoB = departmentRepo(prisma, tenantB);
    const listB = await repoB.list();
    expect(listB).toHaveLength(0);
  });

  it("list filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [];
    const prisma = mockPrisma(store);
    store.push({
      id: "dept_1",
      tenantId: tenantA,
      name: "A dept",
      iconKey: "engineering",
      headName: "A",
      headEmail: "a@x.co",
      headAvatarUrl: null,
      location: "HQ",
      activeEmployees: 1,
      budgetUtil: 10,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    store.push({
      id: "dept_2",
      tenantId: tenantB,
      name: "B dept",
      iconKey: "marketing",
      headName: "B",
      headEmail: "b@x.co",
      headAvatarUrl: null,
      location: "HQ",
      activeEmployees: 2,
      budgetUtil: 20,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repoA = departmentRepo(prisma, tenantA);
    const list = await repoA.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.tenantId).toBe(tenantA);
    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA },
    });
  });

  it("getById returns null for other tenant", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "dept_other",
        tenantId: tenantB,
        name: "Other",
        iconKey: "engineering",
        headName: "B",
        headEmail: "b@x.co",
        headAvatarUrl: null,
        location: "HQ",
        activeEmployees: 0,
        budgetUtil: 0,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = departmentRepo(prisma, tenantA);
    const res = await repoA.getById("dept_other" as DepartmentId);
    expect(res).toBeNull();
    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: { id: "dept_other", tenantId: tenantA },
    });
  });

  it("update filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "dept_1",
        tenantId: tenantB,
        name: "Original",
        iconKey: "engineering",
        headName: "Bob",
        headEmail: "bob@x.co",
        headAvatarUrl: null,
        location: "HQ",
        activeEmployees: 0,
        budgetUtil: 0,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = departmentRepo(prisma, tenantA);
    await repoA.update("dept_1" as DepartmentId, { name: "Hacked" });
    expect(prisma.department.updateMany).toHaveBeenCalledWith({
      where: { id: "dept_1", tenantId: tenantA },
      data: expect.objectContaining({ name: "Hacked" }),
    });
    expect(store[0]?.name).toBe("Original");
  });

  it("remove filters by tenantId", async () => {
    const store: Record<string, unknown>[] = [
      {
        id: "dept_1",
        tenantId: tenantB,
        name: "B dept",
        iconKey: "engineering",
        headName: "B",
        headEmail: "b@x.co",
        headAvatarUrl: null,
        location: "HQ",
        activeEmployees: 0,
        budgetUtil: 0,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const prisma = mockPrisma(store);
    const repoA = departmentRepo(prisma, tenantA);
    await repoA.remove("dept_1" as DepartmentId);
    expect(prisma.department.deleteMany).toHaveBeenCalledWith({
      where: { id: "dept_1", tenantId: tenantA },
    });
    expect(store).toHaveLength(1);
  });

  it("budgetUtil guard throws on create outside 0..100", async () => {
    const prisma = mockPrisma();
    const repo = departmentRepo(prisma, tenantA);
    await expect(
      repo.create({ ...baseInput, budgetUtil: -1 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      repo.create({ ...baseInput, budgetUtil: 101 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      repo.create({ ...baseInput, budgetUtil: 100.5 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("budgetUtil guard throws on update outside 0..100", async () => {
    const prisma = mockPrisma();
    const repo = departmentRepo(prisma, tenantA);
    await expect(
      repo.update("dept_1" as DepartmentId, { budgetUtil: 101 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      repo.update("dept_1" as DepartmentId, { budgetUtil: -1 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("activeEmployees negative guard throws", async () => {
    const prisma = mockPrisma();
    const repo = departmentRepo(prisma, tenantA);
    await expect(
      repo.create({ ...baseInput, activeEmployees: -1 }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      repo.update("dept_1" as DepartmentId, { activeEmployees: -5 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      repo.create({ ...baseInput, activeEmployees: 1.5 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("valid create returns mapped Department view with defaults", async () => {
    const prisma = mockPrisma();
    const repo = departmentRepo(prisma, tenantA);
    const created = await repo.create({
      name: "Product",
      iconKey: "product",
      headName: "Carol",
      headEmail: "carol@example.com",
      location: "HQ",
    });
    expect(created.name).toBe("Product");
    expect(created.iconKey).toBe("product");
    expect(created.headName).toBe("Carol");
    expect(created.headEmail).toBe("carol@example.com");
    expect(created.location).toBe("HQ");
    expect(created.activeEmployees).toBe(0);
    expect(created.budgetUtil).toBe(0);
    expect(created.status).toBe("Active");
    expect(created.tenantId).toBe(tenantA);
    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();
  });
});
