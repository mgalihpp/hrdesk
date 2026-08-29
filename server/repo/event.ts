import type { PrismaClient, Event as PrismaEvent } from "@prisma/client";
import type { Event, EventId, EventType, TenantId } from "@/lib/types";

export interface NewEvent {
  title: string;
  location?: string | null;
  startAt: string;
  endAt?: string | null;
  type?: EventType;
}

function toView(row: PrismaEvent): Event {
  return {
    id: row.id as EventId,
    tenantId: row.tenantId as TenantId,
    title: row.title,
    location: row.location ?? null,
    startAt: new Date(row.startAt).toISOString(),
    endAt: row.endAt ? new Date(row.endAt).toISOString() : null,
    type: row.type as EventType,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function eventRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewEvent): Promise<Event> {
      const title = input.title?.trim();
      if (!title) throw new Error("title is required");
      const start = new Date(input.startAt);
      if (Number.isNaN(start.getTime())) throw new Error("Invalid startAt");
      let end: Date | null = null;
      if (input.endAt) {
        end = new Date(input.endAt);
        if (Number.isNaN(end.getTime())) throw new Error("Invalid endAt");
        if (start >= end) throw new Error("endAt must be after startAt");
      }
      const allowed: EventType[] = ["meeting", "interview", "payroll"];
      const type: EventType = allowed.includes(input.type as EventType)
        ? (input.type as EventType)
        : "meeting";
      const created = await prisma.event.create({
        data: {
          tenantId,
          title,
          location: input.location ?? null,
          startAt: start,
          endAt: end,
          type,
        },
      });
      return toView(created);
    },

    async listUpcoming(limit?: number): Promise<Event[]> {
      const take = Math.min(limit ?? 3, 20);
      if (take < 1 || take > 20)
        throw new Error("limit must be between 1 and 20");
      const rows = await prisma.event.findMany({
        where: { tenantId },
        orderBy: { startAt: "asc" },
        take,
      });
      return rows.map(toView);
    },

    async list(filter?: { limit?: number }): Promise<Event[]> {
      const take =
        filter?.limit !== undefined ? Math.min(filter.limit, 20) : undefined;
      if (take !== undefined && (take < 1 || take > 20))
        throw new Error("limit must be between 1 and 20");
      const rows = await prisma.event.findMany({
        where: { tenantId },
        orderBy: { startAt: "asc" },
        ...(take !== undefined ? { take } : {}),
      });
      return rows.map(toView);
    },

    async getById(id: EventId): Promise<Event | null> {
      const row = await prisma.event.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row) : null;
    },

    async remove(id: EventId): Promise<void> {
      await prisma.event.deleteMany({
        where: { id: id as string, tenantId },
      });
    },
  };
}
