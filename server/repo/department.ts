import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type {
  DepartmentIconKey,
  DepartmentLocation,
  DepartmentStatus,
} from "@/lib/departments/types";
import type { DepartmentId, TenantId } from "@/lib/types";

type StoredDepartment = {
  id: string;
  tenantId: string;
  name: string;
  iconKey: string;
  headName: string;
  headEmail: string;
  headAvatarUrl: string | null;
  location: string;
  activeEmployees: number;
  budgetUtil: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface Department {
  id: DepartmentId;
  tenantId: TenantId;
  name: string;
  iconKey: DepartmentIconKey;
  headName: string;
  headEmail: string;
  headAvatarUrl: string | null;
  location: DepartmentLocation | "Remote";
  activeEmployees: number;
  budgetUtil: number;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewDepartment {
  name: string;
  iconKey: DepartmentIconKey;
  headName: string;
  headEmail: string;
  headAvatarUrl?: string | null;
  location: DepartmentLocation | "Remote";
  activeEmployees?: number;
  budgetUtil?: number;
  status?: DepartmentStatus;
}

function toView(d: StoredDepartment): Department {
  return {
    id: d.id as DepartmentId,
    tenantId: d.tenantId as TenantId,
    name: d.name,
    iconKey: d.iconKey as DepartmentIconKey,
    headName: d.headName,
    headEmail: d.headEmail,
    headAvatarUrl: d.headAvatarUrl,
    location: d.location as DepartmentLocation | "Remote",
    activeEmployees: d.activeEmployees,
    budgetUtil: d.budgetUtil,
    status: d.status as DepartmentStatus,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

function assertBudgetUtil(v: number) {
  if (!Number.isInteger(v) || v < 0 || v > 100) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "budgetUtil must be between 0 and 100",
    });
  }
}

export function departmentRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    async create(input: NewDepartment): Promise<Department> {
      if (input.budgetUtil !== undefined) assertBudgetUtil(input.budgetUtil);
      if (
        input.activeEmployees !== undefined &&
        (!Number.isInteger(input.activeEmployees) || input.activeEmployees < 0)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "activeEmployees must be >= 0",
        });
      }
      const created = await prisma.department.create({
        data: {
          tenantId,
          name: input.name,
          iconKey: input.iconKey,
          headName: input.headName,
          headEmail: input.headEmail,
          headAvatarUrl: input.headAvatarUrl ?? null,
          location: input.location,
          activeEmployees: input.activeEmployees ?? 0,
          budgetUtil: input.budgetUtil ?? 0,
          status: input.status ?? "Active",
        },
      });
      return toView(created as unknown as StoredDepartment);
    },

    async list(): Promise<Department[]> {
      const rows = await prisma.department.findMany({ where: { tenantId } });
      return (rows as unknown as StoredDepartment[]).map(toView);
    },

    async getById(id: DepartmentId): Promise<Department | null> {
      const row = await prisma.department.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row as unknown as StoredDepartment) : null;
    },

    async update(
      id: DepartmentId,
      patch: Partial<NewDepartment>,
    ): Promise<void> {
      if (patch.budgetUtil !== undefined) assertBudgetUtil(patch.budgetUtil);
      if (
        patch.activeEmployees !== undefined &&
        (!Number.isInteger(patch.activeEmployees) || patch.activeEmployees < 0)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "activeEmployees must be >= 0",
        });
      }
      const data: Record<string, unknown> = {};
      if (patch.name !== undefined) data.name = patch.name;
      if (patch.iconKey !== undefined) data.iconKey = patch.iconKey;
      if (patch.headName !== undefined) data.headName = patch.headName;
      if (patch.headEmail !== undefined) data.headEmail = patch.headEmail;
      if (patch.headAvatarUrl !== undefined)
        data.headAvatarUrl = patch.headAvatarUrl;
      if (patch.location !== undefined) data.location = patch.location;
      if (patch.activeEmployees !== undefined)
        data.activeEmployees = patch.activeEmployees;
      if (patch.budgetUtil !== undefined) data.budgetUtil = patch.budgetUtil;
      if (patch.status !== undefined) data.status = patch.status;
      if (Object.keys(data).length === 0) return;
      await prisma.department.updateMany({
        where: { id: id as string, tenantId },
        data,
      });
    },

    async remove(id: DepartmentId): Promise<void> {
      await prisma.department.deleteMany({
        where: { id: id as string, tenantId },
      });
    },
  };
}
