import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { decrypt, encrypt } from "@/lib/crypto";
import {
  canTransitionSync,
  computeBackoffMs,
  nextRetryAt,
} from "@/lib/integrations/lifecycle";
import {
  INTEGRATION_CATALOG,
  isKnownProvider,
} from "@/lib/integrations/registry";
import type {
  ConnectionStatus,
  IntegrationConnectionView,
  IntegrationDef,
  IntegrationProvider,
  IntegrationSync as IntegrationSyncView,
  SyncDirection,
  SyncStatus,
} from "@/lib/integrations/types";
import type {
  IntegrationConnectionId,
  IntegrationSyncId,
  TenantId,
} from "@/lib/types";

type StoredConnection = {
  id: string;
  tenantId: string;
  provider: string;
  status: string;
  credentialsEnc: string;
  configJson: string;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredSync = {
  id: string;
  tenantId: string;
  connectionId: string;
  provider: string;
  direction: string;
  status: string;
  idempotencyKey: string | null;
  payloadJson: string;
  error: string | null;
  retryCount: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type IntegrationPrisma = PrismaClient & {
  integrationConnection: {
    findMany: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredConnection[]>;
    findFirst: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredConnection | null>;
    findUnique: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredConnection | null>;
    create: (args: {
      data: Record<string, unknown>;
    }) => Promise<StoredConnection>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<StoredConnection>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    upsert: (args: {
      where: Record<string, unknown>;
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<StoredConnection>;
    deleteMany: (args: {
      where: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
  integrationSync: {
    findMany: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredSync[]>;
    findFirst: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredSync | null>;
    findUnique: (args: {
      where: Record<string, unknown>;
    }) => Promise<StoredSync | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<StoredSync>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<StoredSync>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    upsert: (args: {
      where: Record<string, unknown>;
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<StoredSync>;
    deleteMany: (args: {
      where: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

function toConnectionView(row: StoredConnection): IntegrationConnectionView {
  let config: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(row.configJson ?? "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      config = parsed as Record<string, unknown>;
    } else if (parsed && typeof parsed === "object") {
      config = parsed as Record<string, unknown>;
    }
  } catch {
    config = null;
  }
  // hasCredentials is true when encrypted payload exists; decrypt check not needed for boolean
  const hasCredentials =
    typeof row.credentialsEnc === "string" && row.credentialsEnc.length > 0;
  // Validate decryptability in read path without exposing plaintext (mirrors employeeRepo pattern)
  if (hasCredentials) {
    try {
      decrypt(row.credentialsEnc);
    } catch {
      // corrupted payload still counts as hasCredentials but don't throw
    }
  }
  return {
    id: row.id as IntegrationConnectionId,
    tenantId: row.tenantId as TenantId,
    provider: row.provider as IntegrationProvider,
    status: row.status as ConnectionStatus,
    config,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    hasCredentials,
  };
}

function toSyncView(row: StoredSync): IntegrationSyncView {
  let payload: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(row.payloadJson ?? "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    } else if (parsed && typeof parsed === "object") {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = null;
  }
  return {
    id: row.id as IntegrationSyncId,
    tenantId: row.tenantId as TenantId,
    connectionId: row.connectionId as IntegrationConnectionId,
    provider: row.provider as IntegrationProvider,
    direction: row.direction as SyncDirection,
    status: row.status as SyncStatus,
    idempotencyKey: row.idempotencyKey,
    payload,
    error: row.error,
    retryCount: row.retryCount,
    nextRetryAt: row.nextRetryAt
      ? new Date(row.nextRetryAt).toISOString()
      : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function integrationRepo(prisma: PrismaClient, tenantId: TenantId) {
  const db = prisma as unknown as IntegrationPrisma;

  return {
    listCatalog(): IntegrationDef[] {
      return INTEGRATION_CATALOG;
    },

    async listConnections(): Promise<IntegrationConnectionView[]> {
      const rows = await db.integrationConnection.findMany({
        where: { tenantId },
      });
      return rows.map(toConnectionView);
    },

    async getConnectionById(
      id: IntegrationConnectionId,
    ): Promise<IntegrationConnectionView | null> {
      const row = await db.integrationConnection.findFirst({
        where: { id, tenantId },
      });
      return row ? toConnectionView(row) : null;
    },

    async getConnectionByProvider(
      provider: IntegrationProvider,
    ): Promise<IntegrationConnectionView | null> {
      const row = await db.integrationConnection.findFirst({
        where: { tenantId, provider },
      });
      return row ? toConnectionView(row) : null;
    },

    async upsertConnection(input: {
      provider: IntegrationProvider;
      credentials?: Record<string, unknown> | null;
      config?: Record<string, unknown> | null;
    }): Promise<IntegrationConnectionView> {
      if (!isKnownProvider(input.provider)) {
        throw new Error(`Unknown provider: ${input.provider}`);
      }
      const hasCreds =
        input.credentials !== null &&
        input.credentials !== undefined &&
        Object.keys(input.credentials).length > 0;
      const credentialsEnc = hasCreds
        ? encrypt(JSON.stringify(input.credentials))
        : "";
      const configJson = JSON.stringify(input.config ?? {});
      const status: ConnectionStatus = hasCreds ? "connected" : "pending";

      const row = await db.integrationConnection.upsert({
        where: { tenantId_provider: { tenantId, provider: input.provider } },
        update: { credentialsEnc, configJson, status },
        create: {
          tenantId,
          provider: input.provider,
          credentialsEnc,
          configJson,
          status,
        },
      });
      return toConnectionView(row);
    },

    async disconnect(id: IntegrationConnectionId): Promise<void> {
      await db.integrationConnection.updateMany({
        where: { id, tenantId },
        data: { status: "disconnected", credentialsEnc: "" },
      });
    },

    async listSyncs(
      connectionId?: IntegrationConnectionId,
    ): Promise<IntegrationSyncView[]> {
      const where: Record<string, unknown> = { tenantId };
      if (connectionId) where.connectionId = connectionId;
      const rows = await db.integrationSync.findMany({ where });
      return rows.map(toSyncView);
    },

    async getSyncById(
      id: IntegrationSyncId,
    ): Promise<IntegrationSyncView | null> {
      const row = await db.integrationSync.findFirst({
        where: { id, tenantId },
      });
      return row ? toSyncView(row) : null;
    },

    async createSync(input: {
      connectionId: IntegrationConnectionId;
      direction: SyncDirection;
      payload?: Record<string, unknown>;
      idempotencyKey?: string | null;
    }): Promise<IntegrationSyncView> {
      // guard: connection exists and belongs to tenant
      const connection = await db.integrationConnection.findFirst({
        where: { id: input.connectionId, tenantId },
      });
      if (!connection) {
        throw new Error(`Connection not found: ${input.connectionId}`);
      }

      if (input.idempotencyKey) {
        const existing =
          (await db.integrationSync.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          })) ??
          (await db.integrationSync.findFirst({
            where: { tenantId, idempotencyKey: input.idempotencyKey },
          }));
        if (existing && existing.tenantId === tenantId) {
          return toSyncView(existing);
        }
      }

      const row = await db.integrationSync.create({
        data: {
          tenantId,
          connectionId: input.connectionId,
          provider: connection.provider,
          direction: input.direction,
          status: "pending",
          idempotencyKey: input.idempotencyKey ?? null,
          payloadJson: JSON.stringify(input.payload ?? {}),
          retryCount: 0,
        },
      });
      return toSyncView(row);
    },

    async updateSyncStatus(
      id: IntegrationSyncId,
      status: SyncStatus,
      patch?: { error?: string },
    ): Promise<void> {
      const row = await db.integrationSync.findFirst({
        where: { id, tenantId },
      });
      if (!row) throw new Error(`Sync not found: ${id}`);
      const current = row.status as SyncStatus;
      if (!canTransitionSync(current, status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid sync transition: ${current} -> ${status}`,
        });
      }
      const data: Record<string, unknown> = { status };
      if (status === "failed") {
        const nextCount = (row.retryCount ?? 0) + 1;
        void computeBackoffMs(nextCount);
        data.retryCount = nextCount;
        data.nextRetryAt = nextRetryAt(nextCount).toISOString();
        if (patch?.error !== undefined) data.error = patch.error;
      } else if (status === "success") {
        data.nextRetryAt = null;
        data.error = null;
      } else {
        if (patch?.error !== undefined) data.error = patch.error;
      }
      await db.integrationSync.updateMany({ where: { id, tenantId }, data });
    },

    async ingestWebhook(input: {
      provider: IntegrationProvider;
      externalId?: string;
      payload: Record<string, unknown>;
    }): Promise<IntegrationSyncView> {
      if (!isKnownProvider(input.provider)) {
        throw new Error(`Unknown provider: ${input.provider}`);
      }
      let connection = await db.integrationConnection.findFirst({
        where: { tenantId, provider: input.provider },
      });
      if (!connection) {
        // create pending connection for inbound webhook when none exists
        connection = await db.integrationConnection.create({
          data: {
            tenantId,
            provider: input.provider,
            status: "pending",
            credentialsEnc: "",
            configJson: "{}",
          },
        });
      }

      const idempotencyKey = input.externalId
        ? `${tenantId}:${input.provider}:${input.externalId}`
        : null;

      if (idempotencyKey) {
        const existing =
          (await db.integrationSync.findUnique({
            where: { idempotencyKey },
          })) ??
          (await db.integrationSync.findFirst({
            where: { tenantId, idempotencyKey },
          }));
        if (existing && existing.tenantId === tenantId) {
          return toSyncView(existing);
        }
      }

      const sync = await db.integrationSync.create({
        data: {
          tenantId,
          connectionId: connection.id,
          provider: input.provider,
          direction: "inbound",
          status: "pending",
          idempotencyKey,
          payloadJson: JSON.stringify(input.payload ?? {}),
          error: null,
          retryCount: 0,
          nextRetryAt: null,
        },
      });
      return toSyncView(sync);
    },
  };
}
