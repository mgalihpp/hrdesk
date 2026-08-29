import { AttendanceClient } from "@/components/dashboard/attendance/attendance-client";

export default async function AttendancePage() {
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
      <AttendanceClient />
    </div>
  );
}
