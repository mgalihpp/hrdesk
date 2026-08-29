import type { Employee, PrismaClient } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import { cents } from "@/lib/money";
import type {
  Department,
  EmployeeId,
  EmployeeView,
  EmploymentType,
  TenantId,
} from "@/lib/types";

export interface NewEmployee {
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  bank: string;
  compensation: number;
  hireDate: string;
  status: EmployeeView["status"];
  department?: Department;
  position?: string;
  employmentType?: EmploymentType;
  avatarUrl?: string;
}

type StoredEmployee = Employee;

export function employeeRepo(prisma: PrismaClient, tenantId: TenantId) {
  const toView = (d: StoredEmployee): EmployeeView => ({
    id: d.id as EmployeeId,
    tenantId: d.tenantId as TenantId,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    ssn: decrypt(d.ssnEnc),
    bank: decrypt(d.bankEnc),
    compensation: d.compensation as EmployeeView["compensation"],
    hireDate: d.hireDate,
    status: d.status as EmployeeView["status"],
    department: (d.department as Department | null) ?? "Engineering",
    position: (d.position as string | null) ?? "Employee",
    employmentType: (d.employmentType as EmploymentType | null) ?? "Full Time",
    avatarUrl: (d.avatarUrl as string | null) ?? "",
    createdAt: new Date(d.createdAt).toISOString(),
  });

  return {
    async create(input: NewEmployee): Promise<EmployeeView> {
      const created = await prisma.employee.create({
        data: {
          tenantId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          ssnEnc: encrypt(input.ssn),
          bankEnc: encrypt(input.bank),
          compensation: cents(input.compensation),
          hireDate: input.hireDate,
          status: input.status,
          department: input.department ?? "Engineering",
          position: input.position ?? "Employee",
          employmentType: input.employmentType ?? "Full Time",
          avatarUrl: input.avatarUrl ?? "",
        },
      });
      return toView(created);
    },
    async list(): Promise<EmployeeView[]> {
      const rows = await prisma.employee.findMany({ where: { tenantId } });
      return rows.map(toView);
    },
    async getById(id: EmployeeId): Promise<EmployeeView | null> {
      const row = await prisma.employee.findFirst({ where: { id, tenantId } });
      return row ? toView(row) : null;
    },
    async update(id: EmployeeId, patch: Partial<NewEmployee>): Promise<void> {
      const data: Record<string, unknown> = {};
      if (patch.firstName !== undefined) data.firstName = patch.firstName;
      if (patch.lastName !== undefined) data.lastName = patch.lastName;
      if (patch.email !== undefined) data.email = patch.email;
      if (patch.hireDate !== undefined) data.hireDate = patch.hireDate;
      if (patch.status !== undefined) data.status = patch.status;
      if (patch.department !== undefined) data.department = patch.department;
      if (patch.position !== undefined) data.position = patch.position;
      if (patch.employmentType !== undefined)
        data.employmentType = patch.employmentType;
      if (patch.avatarUrl !== undefined) data.avatarUrl = patch.avatarUrl;
      if (patch.compensation !== undefined) {
        data.compensation = cents(patch.compensation);
      }
      if (patch.ssn !== undefined) data.ssnEnc = encrypt(patch.ssn);
      if (patch.bank !== undefined) data.bankEnc = encrypt(patch.bank);
      await prisma.employee.updateMany({ where: { id, tenantId }, data });
    },
    async remove(id: EmployeeId): Promise<void> {
      await prisma.employee.deleteMany({ where: { id, tenantId } });
    },
  };
}
