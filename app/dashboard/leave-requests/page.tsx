import { LeaveRequestsClient } from "@/components/dashboard/leave-requests/leave-requests-client";

export default async function LeaveRequestsPage() {
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
      <LeaveRequestsClient />
    </div>
  );
}
