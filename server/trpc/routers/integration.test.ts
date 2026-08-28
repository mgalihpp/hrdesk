import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TenantId } from "@/lib/types";
import { integrationRouter } from "@/server/trpc/routers/integration";

function createMockPrisma() {
  const connections: any[] = [];
  const syncs: any[] = [];
  let idCounter = 1;
  const genId = () => String(idCounter++).padStart(24, "0");

  const integrationConnection = {
    findMany: vi.fn(async ({ where }: any = {}) => {
      return connections.filter((c) => {
        if (where?.tenantId && c.tenantId !== where.tenantId) return false;
        if (where?.provider && c.provider !== where.provider) return false;
        if (where?.id && c.id !== where.id) return false;
        return true;
      });
    }),
    findFirst: vi.fn(async ({ where }: any = {}) => {
      return (
        connections.find((c) => {
          if (where?.tenantId && c.tenantId !== where.tenantId) return false;
          if (where?.provider && c.provider !== where.provider) return false;
          if (where?.id && c.id !== where.id) return false;
          return true;
        }) ?? null
      );
    }),
    findUnique: vi.fn(async ({ where }: any = {}) => {
      if (where?.tenantId_provider) {
        const { tenantId, provider } = where.tenantId_provider;
        return (
          connections.find(
            (c) => c.tenantId === tenantId && c.provider === provider,
          ) ?? null
        );
      }
      if (where?.id) return connections.find((c) => c.id === where.id) ?? null;
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const row: any = {
        id: genId(),
        tenantId: data.tenantId,
        provider: data.provider,
        status: data.status ?? "pending",
        credentialsEnc: data.credentialsEnc ?? "",
        configJson: data.configJson ?? "{}",
        lastSyncAt: data.lastSyncAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      connections.push(row);
      return row;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (const c of connections) {
        if (where?.tenantId && c.tenantId !== where.tenantId) continue;
        if (where?.id && c.id !== where.id) continue;
        Object.assign(c, data, { updatedAt: new Date() });
        count++;
      }
      return { count };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = connections.find((c) => c.id === where.id);
      if (!row) throw new Error("not found");
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    }),
    upsert: vi.fn(async ({ where, update, create }: any) => {
      let existing: any = null;
      if (where?.tenantId_provider) {
        const { tenantId, provider } = where.tenantId_provider;
        existing =
          connections.find(
            (c) => c.tenantId === tenantId && c.provider === provider,
          ) ?? null;
      } else if (where?.id) {
        existing = connections.find((c) => c.id === where.id) ?? null;
      }
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const row: any = {
        id: genId(),
        tenantId: create.tenantId,
        provider: create.provider,
        status: create.status ?? "pending",
        credentialsEnc: create.credentialsEnc ?? "",
        configJson: create.configJson ?? "{}",
        lastSyncAt: create.lastSyncAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      connections.push(row);
      return row;
    }),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };

  const integrationSync = {
    findMany: vi.fn(async ({ where }: any = {}) => {
      return syncs.filter((s) => {
        if (where?.tenantId && s.tenantId !== where.tenantId) return false;
        if (where?.connectionId && s.connectionId !== where.connectionId)
          return false;
        if (where?.id && s.id !== where.id) return false;
        if (where?.idempotencyKey && s.idempotencyKey !== where.idempotencyKey)
          return false;
        return true;
      });
    }),
    findFirst: vi.fn(async ({ where }: any = {}) => {
      return (
        syncs.find((s) => {
          if (where?.tenantId && s.tenantId !== where.tenantId) return false;
          if (where?.connectionId && s.connectionId !== where.connectionId)
            return false;
          if (where?.id && s.id !== where.id) return false;
          if (
            where?.idempotencyKey &&
            s.idempotencyKey !== where.idempotencyKey
          )
            return false;
          return true;
        }) ?? null
      );
    }),
    findUnique: vi.fn(async ({ where }: any = {}) => {
      if (where?.id) return syncs.find((s) => s.id === where.id) ?? null;
      if (where?.idempotencyKey)
        return (
          syncs.find((s) => s.idempotencyKey === where.idempotencyKey) ?? null
        );
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const row: any = {
        id: genId(),
        tenantId: data.tenantId,
        connectionId: data.connectionId,
        provider: data.provider,
        direction: data.direction ?? "inbound",
        status: data.status ?? "pending",
        idempotencyKey: data.idempotencyKey ?? null,
        payloadJson: data.payloadJson ?? "{}",
        error: data.error ?? null,
        retryCount: data.retryCount ?? 0,
        nextRetryAt: data.nextRetryAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      syncs.push(row);
      return row;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (const s of syncs) {
        if (where?.tenantId && s.tenantId !== where.tenantId) continue;
        if (where?.id && s.id !== where.id) continue;
        Object.assign(s, data, { updatedAt: new Date() });
        count++;
      }
      return { count };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = syncs.find((s) => s.id === where.id);
      if (!row) throw new Error("not found");
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    }),
    deleteMany: vi.fn(async () => ({ count: 0 })),
    upsert: vi.fn(async ({ where, update, create }: any) => {
      let existing: any = null;
      if (where?.idempotencyKey) {
        existing =
          syncs.find((s) => s.idempotencyKey === where.idempotencyKey) ?? null;
      }
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const row: any = {
        id: genId(),
        tenantId: create.tenantId,
        connectionId: create.connectionId,
        provider: create.provider,
        direction: create.direction ?? "inbound",
        status: create.status ?? "pending",
        idempotencyKey: create.idempotencyKey ?? null,
        payloadJson: create.payloadJson ?? "{}",
        error: create.error ?? null,
        retryCount: create.retryCount ?? 0,
        nextRetryAt: create.nextRetryAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      syncs.push(row);
      return row;
    }),
  };

  return {
    integrationConnection,
    integrationSync,
    __store: { connections, syncs },
  };
}

function makeCaller(roles: string[], tenantId = "tenantAaaaaaaaaaaaaaaaaaaa") {
  const prisma = createMockPrisma();
  const ctx = {
    session: {
      id: "u1",
      tenantId: tenantId as unknown as TenantId,
      roles: roles as unknown as never,
    },
    prisma: prisma as unknown as never,
  } as unknown as never;
  return { caller: integrationRouter.createCaller(ctx), prisma, tenantId };
}

// Shared prisma for cross-tenant tests — same DB, different tenantIds
let sharedPrisma: ReturnType<typeof createMockPrisma> | null = null;

function makeCallerWithTenant(roles: string[], tenantId: string) {
  if (!sharedPrisma) sharedPrisma = createMockPrisma();
  const prisma = sharedPrisma;
  const ctx = {
    session: {
      id: "u1",
      tenantId: tenantId as unknown as TenantId,
      roles: roles as unknown as never,
    },
    prisma: prisma as unknown as never,
  } as unknown as never;
  return { caller: integrationRouter.createCaller(ctx), prisma, tenantId };
}

beforeEach(() => {
  sharedPrisma = createMockPrisma();
});

describe("integration router", () => {
  it("catalog is readable by any authed role", async () => {
    const { caller } = makeCaller(["employee"]);
    const catalog = await caller.catalog();
    expect(catalog.length).toBeGreaterThanOrEqual(8);
  });
  it("connect rejects employee and hr, allows admin", async () => {
    for (const role of ["employee", "hr", "manager"] as const) {
      const { caller } = makeCaller([role]);
      await expect(
        caller.connect({ provider: "slack" }),
      ).rejects.toBeInstanceOf(TRPCError);
    }
    const { caller } = makeCaller(["admin"]);
    const conn = await caller.connect({
      provider: "slack",
      credentials: { token: "x" },
    });
    expect(conn.provider).toBe("slack");
  });
  it("connect rejects unknown provider", async () => {
    const { caller } = makeCaller(["owner"]);
    await expect(
      caller.connect({ provider: "unknown" as any }),
    ).rejects.toThrow();
  });
  it("triggerSync deduplicates on idempotencyKey", async () => {
    const { caller } = makeCaller(["admin"]);
    const conn = await caller.connect({ provider: "github" });
    const s1 = await caller.triggerSync({
      connectionId: conn.id,
      idempotencyKey: "k1",
    });
    const s2 = await caller.triggerSync({
      connectionId: conn.id,
      idempotencyKey: "k1",
    });
    expect(s1.id).toBe(s2.id);
  });
  it("cross-tenant read returns null", async () => {
    const { caller: callerA } = makeCallerWithTenant(
      ["admin"],
      "tenantAaaaaaaaaaaaaaaaaaaa",
    );
    const conn = await callerA.connect({ provider: "stripe" });
    const { caller: callerB } = makeCallerWithTenant(
      ["admin"],
      "tenantBbbbbbbbbbbbbbbbbbbb",
    );
    expect(await callerB.getConnection({ id: conn.id })).toBeNull();
  });
  it("listConnections is tenant-scoped", async () => {
    const { caller: a } = makeCallerWithTenant(
      ["admin"],
      "tenantAaaaaaaaaaaaaaaaaaaa",
    );
    const { caller: b } = makeCallerWithTenant(
      ["admin"],
      "tenantBbbbbbbbbbbbbbbbbbbb",
    );
    await a.connect({ provider: "xero" });
    expect(await b.listConnections()).toEqual([]);
  });
});
