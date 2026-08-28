import type { PrismaClient, Leave as PrismaLeave } from "@prisma/client";
import type {
  EmployeeId,
  Leave,
  LeaveId,
  LeaveStatus,
  LeaveType,
  TenantId,
} from "@/lib/types";

export interface NewLeave {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

function toView(row: PrismaLeave): Leave {
  return {
    id: row.id as LeaveId,
    tenantId: row.tenantId as TenantId,
    employeeId: row.employeeId as EmployeeId,
    type: row.type as LeaveType,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as LeaveStatus,
    reason: row.reason ?? null,
    approvedBy: row.approvedBy ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function leaveRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewLeave): Promise<Leave> {
      if (input.startDate > input.endDate) {
        throw new Error("startDate must be <= endDate");
      }
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)
      ) {
        throw new Error("startDate/endDate must be YYYY-MM-DD");
      }
      const employee = await prisma.employee.findFirst({
        where: { id: input.employeeId, tenantId },
      });
      if (!employee) throw new Error("Employee not found in tenant");

      const created = await prisma.leave.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "pending",
          reason: input.reason ?? null,
        },
      });
      return toView(created);
    },

    async list(filter?: {
      employeeId?: string;
      status?: LeaveStatus;
    }): Promise<Leave[]> {
      const where: Record<string, unknown> = { tenantId };
      if (filter?.employeeId) where.employeeId = filter.employeeId;
      if (filter?.status) where.status = filter.status;
      const rows = await prisma.leave.findMany({
        where: where as never,
        orderBy: { startDate: "desc" },
      });
      return rows.map(toView);
    },

    async getById(id: LeaveId): Promise<Leave | null> {
      const row = await prisma.leave.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row) : null;
    },

    async approve(id: LeaveId, approverId: string): Promise<Leave> {
      const row = await prisma.leave.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Leave not found");
      const updated = await prisma.leave.update({
        where: { id: id as string },
        data: { status: "approved", approvedBy: approverId },
      });
      return toView(updated);
    },

    async reject(id: LeaveId, approverId: string): Promise<Leave> {
      const row = await prisma.leave.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Leave not found");
      const updated = await prisma.leave.update({
        where: { id: id as string },
        data: { status: "rejected", approvedBy: approverId },
      });
      return toView(updated);
    },

    async cancel(id: LeaveId): Promise<Leave> {
      const row = await prisma.leave.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Leave not found");
      const updated = await prisma.leave.update({
        where: { id: id as string },
        data: { status: "cancelled" },
      });
      return toView(updated);
    },

    async remove(id: LeaveId): Promise<void> {
      await prisma.leave.deleteMany({
        where: { id: id as string, tenantId },
      });
    },
  };
}
