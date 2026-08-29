import { headers } from "next/headers";
import { DepartmentsClient } from "@/components/dashboard/departments/departments-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { departmentRepo } from "@/server/repo/department";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

export default async function DepartmentsPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Departments
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your organization departments.
          </p>
        </div>
        <DepartmentsClient initialDepartments={[]} />
      </div>
    );
  }
  const tenantId = session.user.tenantId as TenantId;
  const rows = await departmentRepo(prisma, tenantId).list();
  const initialDepartments = rows.map((r) => ({
    id: r.id as string,
    name: r.name,
    iconKey: r.iconKey,
    head: {
      name: r.headName,
      email: r.headEmail,
      avatarUrl: r.headAvatarUrl ?? "",
      initials: getInitials(r.headName),
    },
    location: (r.location as "HQ" | "Branch") ?? "HQ",
    activeEmployees: r.activeEmployees,
    budgetUtil: r.budgetUtil,
    status: r.status,
  }));
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Departments
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your organization departments.
        </p>
      </div>
      <DepartmentsClient initialDepartments={initialDepartments as never} />
    </div>
  );
}
