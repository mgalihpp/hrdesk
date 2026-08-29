import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AttendanceSummary } from "@/lib/reporting/types";

export function AttendanceCard({
  attendance,
}: {
  attendance: AttendanceSummary;
}) {
  if (attendance.total === 0) {
    return (
      <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No attendance records in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const approvalRate =
    attendance.total > 0
      ? Math.round((attendance.approved / attendance.total) * 100)
      : 0;

  const items = [
    {
      label: "Approved",
      count: attendance.approved,
      color: "#00acca",
      pct:
        attendance.total > 0
          ? Math.round((attendance.approved / attendance.total) * 100)
          : 0,
    },
    {
      label: "Pending",
      count: attendance.pending,
      color: "#2b2b46",
      pct:
        attendance.total > 0
          ? Math.round((attendance.pending / attendance.total) * 100)
          : 0,
    },
    {
      label: "Rejected",
      count: attendance.rejected,
      color: "#f4d4eb",
      pct:
        attendance.total > 0
          ? Math.round((attendance.rejected / attendance.total) * 100)
          : 0,
    },
  ];

  return (
    <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">
          Attendance
        </CardTitle>
        <CardDescription>
          {attendance.approved} of {attendance.total} approved
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-[32px] font-semibold leading-none tracking-tight text-[#2b2b46]">
            {approvalRate}%
          </span>
          <span className="pb-1 text-xs font-medium text-muted-foreground">
            {attendance.approvedHours}h approved
          </span>
        </div>

        <div className="flex h-2 overflow-hidden rounded-full">
          {items.map((a) => (
            <span
              key={a.label}
              style={{ width: `${a.pct}%`, background: a.color }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.label} className="flex items-center gap-3">
              <span
                className="size-2 rounded-full"
                style={{ background: a.color }}
              />
              <span className="flex-1 text-sm text-muted-foreground">
                {a.label}
              </span>
              <span className="text-sm font-semibold text-[#2b2b46]">
                {a.count} · {a.pct}%
              </span>
              <Progress
                value={a.pct}
                className="hidden h-1.5 w-20 [&>div]:rounded-full"
                style={
                  {
                    ["--progress-color" as string]: a.color,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
