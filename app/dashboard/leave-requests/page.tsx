import { headers } from "next/headers";
import { LeaveRequestsClient } from "@/components/dashboard/leave-requests/leave-requests-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { leaveRepo } from "@/server/repo/leave";

export default async function LeaveRequestsPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Leave Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view organization leave requests.
          </p>
        </div>
        <LeaveRequestsClient initialLeaves={[]} />
      </div>
    );
  }
  const tenantId = session.user.tenantId as TenantId;
  const leaves = await leaveRepo(prisma, tenantId).list();
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Leave Request
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view organization leave requests.
        </p>
      </div>
      <LeaveRequestsClient initialLeaves={leaves} />
    </div>
  );
}
