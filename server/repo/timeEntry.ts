import type {
  PrismaClient,
  TimeEntry as PrismaTimeEntry,
} from "@prisma/client";
import type {
  EmployeeId,
  TenantId,
  TimeEntry,
  TimeEntryId,
  TimeEntryStatus,
  TimeEntryType,
} from "@/lib/types";

export interface NewTimeEntry {
  employeeId: string;
  type: TimeEntryType;
  startAt: string;
  endAt: string;
}

function toView(row: PrismaTimeEntry): TimeEntry {
  return {
    id: row.id as TimeEntryId,
    tenantId: row.tenantId as TenantId,
    employeeId: row.employeeId as EmployeeId,
    type: row.type as TimeEntryType,
    startAt: new Date(row.startAt).toISOString(),
    endAt: new Date(row.endAt).toISOString(),
    status: row.status as TimeEntryStatus,
    approvedBy: row.approvedBy ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function timeEntryRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewTimeEntry): Promise<TimeEntry> {
      const start = new Date(input.startAt);
      const end = new Date(input.endAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("Invalid startAt or endAt");
      }
      if (start >= end) {
        throw new Error("startAt must be before endAt");
      }
      const employee = await prisma.employee.findFirst({
        where: { id: input.employeeId, tenantId },
      });
      if (!employee) throw new Error("Employee not found in tenant");

      const created = await prisma.timeEntry.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          type: input.type,
          startAt: start,
          endAt: end,
          status: "pending",
        },
      });
      return toView(created);
    },

    async list(filter?: {
      employeeId?: string;
      status?: TimeEntryStatus;
    }): Promise<TimeEntry[]> {
      const where: Record<string, unknown> = { tenantId };
      if (filter?.employeeId) where.employeeId = filter.employeeId;
      if (filter?.status) where.status = filter.status;
      const rows = await prisma.timeEntry.findMany({
        where: where as never,
        orderBy: { startAt: "desc" },
      });
      return rows.map(toView);
    },

    async getById(id: TimeEntryId): Promise<TimeEntry | null> {
      const row = await prisma.timeEntry.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row) : null;
    },

    async approve(id: TimeEntryId, approverId: string): Promise<TimeEntry> {
      const row = await prisma.timeEntry.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("TimeEntry not found");
      const updated = await prisma.timeEntry.update({
        where: { id: id as string },
        data: { status: "approved", approvedBy: approverId },
      });
      return toView(updated);
    },

    async reject(id: TimeEntryId, approverId: string): Promise<TimeEntry> {
      const row = await prisma.timeEntry.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("TimeEntry not found");
      const updated = await prisma.timeEntry.update({
        where: { id: id as string },
        data: { status: "rejected", approvedBy: approverId },
      });
      return toView(updated);
    },

    async remove(id: TimeEntryId): Promise<void> {
      await prisma.timeEntry.deleteMany({
        where: { id: id as string, tenantId },
      });
    },
  };
}
