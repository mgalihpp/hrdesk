import { headers } from "next/headers";
import { EmployeesClient } from "@/components/dashboard/employees/employees-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { employeeRepo } from "@/server/repo/employee";

export default async function EmployeesPage() {
  const h = await headers();
  const session = await getShellSession(h);

  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Employees
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your organization employees.
          </p>
        </div>
        <EmployeesClient initialEmployees={[]} />
      </div>
    );
  }

  const tenantId = session.user.tenantId as TenantId;
  const rows = await employeeRepo(prisma, tenantId).list();

  const initialEmployees = rows.map((r) => ({
    id: r.id as string,
    name: `${r.firstName} ${r.lastName}`,
    email: r.email,
    avatarUrl: r.avatarUrl,
    initials: `${r.firstName[0] ?? ""}${r.lastName[0] ?? ""}`.toUpperCase(),
    department: r.department,
    position: r.position,
    status: (r.status === "active" ? "Active" : "On Leave") as
      | "Active"
      | "On Leave",
    employmentType: r.employmentType,
    joinedDate: r.hireDate,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Employees
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your organization employees.
        </p>
      </div>
      <EmployeesClient initialEmployees={initialEmployees} />
    </div>
  );
}
