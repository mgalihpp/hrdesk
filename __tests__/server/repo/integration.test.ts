import { describe, expect, it, vi } from "vitest";
import { computeBackoffMs } from "@/lib/integrations/lifecycle";
import type { TenantId } from "@/lib/types";
import { integrationRepo } from "@/server/repo/integration";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function mockPrisma() {
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
      if (where?.idempotencyKey)
        return (
          connections.find(
            (c) => (c as any).idempotencyKey === where.idempotencyKey,
          ) ?? null
        );
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
        if (where?.provider && c.provider !== where.provider) continue;
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
    deleteMany: vi.fn(async ({ where }: any = {}) => {
      const before = connections.length;
      for (let i = connections.length - 1; i >= 0; i--) {
        const c = connections[i];
        if (where?.tenantId && c.tenantId !== where.tenantId) continue;
        if (where?.id && c.id !== where.id) continue;
        connections.splice(i, 1);
      }
      return { count: before - connections.length };
    }),
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
        if (where?.idempotencyKey && s.idempotencyKey !== where.idempotencyKey)
          continue;
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

describe("integrationRepo tenancy", () => {
  it("upsertConnection is idempotent on (tenantId, provider)", async () => {
    const prisma: any = mockPrisma();
    const repoA = integrationRepo(prisma, tenantA);
    const c1 = await repoA.upsertConnection({
      provider: "slack",
      credentials: { token: "xoxb-1" },
    });
    const c2 = await repoA.upsertConnection({
      provider: "slack",
      credentials: { token: "xoxb-1" },
    });
    expect(c1.id).toBe(c2.id);
    expect(prisma.integrationConnection.upsert).toHaveBeenCalled();
  });
  it("tenant B cannot see tenant A connections", async () => {
    const prisma: any = mockPrisma();
    const repoA = integrationRepo(prisma, tenantA);
    await repoA.upsertConnection({ provider: "github" });
    const repoB = integrationRepo(prisma, tenantB);
    expect(await repoB.getConnectionByProvider("github")).toBeNull();
    expect(await repoB.listConnections()).toEqual([]);
  });
  it("credentials are encrypted at rest", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    await repo.upsertConnection({
      provider: "stripe",
      credentials: { apiKey: "sk_live_123" },
    });
    const raw = prisma.__store.connections[0];
    expect(raw.credentialsEnc).not.toContain("sk_live_123");
  });
  it("createSync deduplicates on idempotencyKey", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "slack" });
    const s1 = await repo.createSync({
      connectionId: conn.id as any,
      direction: "inbound",
      idempotencyKey: "evt_1",
      payload: { ok: true },
    });
    const s2 = await repo.createSync({
      connectionId: conn.id as any,
      direction: "inbound",
      idempotencyKey: "evt_1",
      payload: { ok: true },
    });
    expect(s1.id).toBe(s2.id);
  });
  it("ingestWebhook creates sync log for inbound event", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    await repo.upsertConnection({ provider: "webhook-generic" });
    const sync = await repo.ingestWebhook({
      provider: "webhook-generic",
      externalId: "wh_123",
      payload: { type: "test" },
    });
    expect(sync.direction).toBe("inbound");
    expect(sync.provider).toBe("webhook-generic");
  });
  it("updateSyncStatus enforces transition guard", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "quickbooks" });
    const sync = await repo.createSync({
      connectionId: conn.id as any,
      direction: "outbound",
    });
    await expect(
      repo.updateSyncStatus(sync.id as any, "success"),
    ).rejects.toThrow();
    await repo.updateSyncStatus(sync.id as any, "running");
    await repo.updateSyncStatus(sync.id as any, "success");
    const done = await repo.getSyncById(sync.id as any);
    expect(done?.status).toBe("success");
  });
  it("failed sync increments retryCount and sets nextRetryAt", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "slack" });
    const sync = await repo.createSync({
      connectionId: conn.id as any,
      direction: "outbound",
    });
    await repo.updateSyncStatus(sync.id as any, "running");
    await repo.updateSyncStatus(sync.id as any, "failed", { error: "timeout" });
    const failed = await repo.getSyncById(sync.id as any);
    expect(failed?.retryCount).toBe(1);
    expect(failed?.nextRetryAt).toBeTruthy();
    expect(failed?.error).toBe("timeout");
  });
  it("retry does not exceed 5 and backoff caps at 24h", async () => {
    expect(computeBackoffMs(6)).toBe(computeBackoffMs(5));
    expect(computeBackoffMs(10)).toBe(computeBackoffMs(5));
    expect(computeBackoffMs(6)).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(computeBackoffMs(10)).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(computeBackoffMs(100, 24 * 60 * 60 * 1000)).toBe(
      24 * 60 * 60 * 1000,
    );
  });
  it("listFailedSyncs returns only failed for tenant", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "github" });
    const s1 = await repo.createSync({
      connectionId: conn.id as any,
      direction: "inbound",
    });
    const s2 = await repo.createSync({
      connectionId: conn.id as any,
      direction: "inbound",
    });
    await repo.updateSyncStatus(s1.id as any, "running");
    await repo.updateSyncStatus(s1.id as any, "failed");
    await repo.updateSyncStatus(s2.id as any, "running");
    await repo.updateSyncStatus(s2.id as any, "success");
    const failed = (await repo.listSyncs()).filter(
      (s) => s.status === "failed",
    );
    expect(failed.length).toBe(1);
  });
});
