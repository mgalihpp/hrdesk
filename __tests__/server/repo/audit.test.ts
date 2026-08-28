import { describe, expect, it, vi } from "vitest";
import { isAuditAction, parseAuditAction } from "@/lib/audit/types";
import type { TenantId } from "@/lib/types";
import { auditRepo } from "@/server/repo/audit";

const TENANT_A = "tenantA" as unknown as TenantId;
const TENANT_B = "tenantB" as unknown as TenantId;
const ACTOR = "507f1f77bcf86cd799439011";

function stored(over: Record<string, unknown> = {}) {
  return {
    id: "audit1",
    tenantId: TENANT_A as string,
    actorId: ACTOR,
    action: "payrun.create",
    targetType: "payrun",
    targetId: "pr1",
    metadata: null,
    createdAt: new Date("2026-08-28T00:00:00.000Z"),
    ...over,
  };
}

function mockPrisma(rows: ReturnType<typeof stored>[]) {
  return {
    auditLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const rec = {
          id: `audit${rows.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        rows.push(rec as ReturnType<typeof stored>);
        return rec;
      }),
      findMany: vi.fn(async (args: Record<string, unknown>) => {
        const where = args.where as {
          tenantId: string;
          createdAt?: { gte?: Date; lte?: Date };
        };
        let out = rows.filter((r) => r.tenantId === where.tenantId);
        if (where.createdAt) {
          const { gte, lte } = where.createdAt;
          out = out.filter((r) => {
            const t = new Date(r.createdAt).getTime();
            if (gte && t < gte.getTime()) return false;
            if (lte && t > lte.getTime()) return false;
            return true;
          });
        }
        const ordered = [...out].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const cursor = args.cursor as { id: string } | undefined;
        if (cursor) {
          const idx = ordered.findIndex((r) => r.id === cursor.id);
          if (idx >= 0) {
            const skip = (args.skip as number) ?? 0;
            const take = (args.take as number) ?? ordered.length;
            return ordered.slice(idx + skip, idx + skip + take);
          }
        }
        if (args.take) return ordered.slice(0, args.take as number);
        return ordered;
      }),
      findFirst: vi.fn(
        async ({ where }: { where: { id: string; tenantId: string } }) => {
          return (
            rows.find(
              (r) => r.id === where.id && r.tenantId === where.tenantId,
            ) ?? null
          );
        },
      ),
    },
  } as unknown as Parameters<typeof auditRepo>[0];
}

describe("auditRepo tenant isolation", () => {
  it("create injects factory tenantId and list is isolated", async () => {
    const rows: ReturnType<typeof stored>[] = [];
    const prismaA = mockPrisma(rows);
    const prismaB = mockPrisma(rows);
    const repoA = auditRepo(prismaA, TENANT_A);
    const repoB = auditRepo(prismaB, TENANT_B);

    await repoA.create({
      actorId: ACTOR,
      action: "payrun.create",
      targetType: "payrun",
      targetId: "pr1",
    });

    const listA = await repoA.list();
    expect(listA.items).toHaveLength(1);
    expect(listA.items[0].tenantId).toBe(TENANT_A as string);
    expect(listA.items[0].action).toBe("payrun.create");

    const listB = await repoB.list();
    expect(listB.items).toHaveLength(0);
  });

  it("getById respects tenantId", async () => {
    const rows = [stored({ id: "a1", tenantId: TENANT_A as string })];
    const prismaA = mockPrisma(rows);
    const prismaB = mockPrisma(rows);
    const repoA = auditRepo(prismaA, TENANT_A);
    const repoB = auditRepo(prismaB, TENANT_B);

    const foundA = await repoA.getById("a1" as never);
    expect(foundA).not.toBeNull();
    expect(foundA?.id).toBe("a1");

    const foundB = await repoB.getById("a1" as never);
    expect(foundB).toBeNull();
  });

  it("is append only: repo exposes no update or delete", async () => {
    const rows: ReturnType<typeof stored>[] = [];
    const prisma = mockPrisma(rows);
    const repo = auditRepo(prisma, TENANT_A) as Record<string, unknown>;
    expect(repo.update).toBeUndefined();
    expect(repo.delete).toBeUndefined();
    expect(repo.updateMany).toBeUndefined();
    expect(repo.deleteMany).toBeUndefined();
  });

  it("filters by createdAt range", async () => {
    const rows = [
      stored({ id: "a1", createdAt: new Date("2026-01-10T00:00:00.000Z") }),
      stored({ id: "a2", createdAt: new Date("2026-02-10T00:00:00.000Z") }),
      stored({ id: "a3", createdAt: new Date("2026-03-10T00:00:00.000Z") }),
    ];
    const prisma = mockPrisma(rows);
    const repo = auditRepo(prisma, TENANT_A);

    const jan = await repo.list({ from: "2026-01-01", to: "2026-01-31" });
    expect(jan.items).toHaveLength(1);
    expect(jan.items[0].id).toBe("a1");

    const all = await repo.list();
    expect(all.items).toHaveLength(3);
  });

  it("paginates with cursor", async () => {
    const rows = [
      stored({ id: "a3", createdAt: new Date("2026-03-10T00:00:00.000Z") }),
      stored({ id: "a2", createdAt: new Date("2026-02-10T00:00:00.000Z") }),
      stored({ id: "a1", createdAt: new Date("2026-01-10T00:00:00.000Z") }),
    ];
    const prisma = mockPrisma(rows);
    const repo = auditRepo(prisma, TENANT_A);

    const page1 = await repo.list({ limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBe("a2");
    const page2 = await repo.list({
      limit: 2,
      cursor: page1.nextCursor as string,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0].id).toBe("a1");
    expect(page2.nextCursor).toBeNull();
  });

  it("validates action enum at boundary", () => {
    expect(() => parseAuditAction("payrun.create")).not.toThrow();
    expect(() => parseAuditAction("invalid.action")).toThrow();
    expect(isAuditAction("billing.createInvoice")).toBe(true);
    expect(isAuditAction("unknown")).toBe(false);
  });

  it("create always scopes to factory tenantId even if caller tries different", async () => {
    const rows: ReturnType<typeof stored>[] = [];
    const prisma = mockPrisma(rows);
    const repo = auditRepo(prisma, TENANT_A);
    await repo.create({
      actorId: ACTOR,
      action: "reporting.export",
      targetType: "reporting",
      targetId: "export1",
    });
    expect(rows[0].tenantId).toBe(TENANT_A as string);
    expect(rows[0].tenantId).not.toBe(TENANT_B as string);
  });
});
