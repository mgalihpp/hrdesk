import { headers } from "next/headers";
import { AttendanceClient } from "@/components/dashboard/attendance/attendance-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { timeEntryRepo } from "@/server/repo/timeEntry";

export default async function AttendancePage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your organization attendance.
          </p>
        </div>
        <AttendanceClient initialEntries={[]} />
      </div>
    );
  }
  const tenantId = session.user.tenantId as TenantId;
  const entries = await timeEntryRepo(prisma, tenantId).list();
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your organization attendance.
        </p>
      </div>
      <AttendanceClient initialEntries={entries} />
    </div>
  );
}
