import type { PrismaClient } from "@prisma/client";
import type {
  AuditCreateInput,
  AuditLogId,
  AuditView,
} from "@/lib/audit/types";
import { parseAuditAction } from "@/lib/audit/types";
import type { TenantId } from "@/lib/types";

type AuditPrisma = PrismaClient & {
  auditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown | null>;
  };
};

type StoredAudit = {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: string | null;
  createdAt: Date;
};

function toView(row: StoredAudit): AuditView {
  return {
    id: row.id as AuditLogId,
    tenantId: row.tenantId,
    actorId: row.actorId,
    action: parseAuditAction(row.action),
    targetType: row.targetType,
    targetId: row.targetId,
    metadata: row.metadata ?? null,
    createdAt: new Date(row.createdAt),
  };
}

export function auditRepo(prisma: PrismaClient, tenantId: TenantId) {
  const db = prisma as unknown as AuditPrisma;

  return {
    async create(input: AuditCreateInput): Promise<AuditView> {
      const action = parseAuditAction(input.action);
      const row = (await db.auditLog.create({
        data: {
          tenantId: tenantId as string,
          actorId: input.actorId,
          action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata ?? null,
        },
      })) as StoredAudit;
      return toView(row);
    },

    async list(params?: {
      from?: string | Date;
      to?: string | Date;
      limit?: number;
      cursor?: string;
    }): Promise<{ items: AuditView[]; nextCursor: string | null }> {
      const from = params?.from ? new Date(params.from) : undefined;
      const to = params?.to ? new Date(params.to) : undefined;
      const limitRaw = params?.limit ?? 50;
      const limit = Math.min(Math.max(limitRaw, 1), 100);
      const cursor = params?.cursor;

      const where: Record<string, unknown> = {
        tenantId: tenantId as string,
      };

      if (from || to) {
        const createdAt: Record<string, Date> = {};
        if (from) createdAt.gte = from;
        if (to) createdAt.lte = to;
        where.createdAt = createdAt;
      }

      const take = limit + 1;
      const query: Record<string, unknown> = {
        where,
        orderBy: { createdAt: "desc" },
        take,
      };

      if (cursor) {
        query.cursor = { id: cursor };
        query.skip = 1;
      }

      const rows = (await db.auditLog.findMany(query)) as StoredAudit[];
      const hasNext = rows.length > limit;
      const items = hasNext ? rows.slice(0, limit) : rows;
      const nextCursor = hasNext ? items[items.length - 1].id : null;

      return {
        items: items.map(toView),
        nextCursor: nextCursor as string | null,
      };
    },

    async getById(id: AuditLogId): Promise<AuditView | null> {
      const row = (await db.auditLog.findFirst({
        where: { id: id as string, tenantId: tenantId as string },
      })) as StoredAudit | null;
      return row ? toView(row) : null;
    },
  };
}
