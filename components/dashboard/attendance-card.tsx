import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ATTENDANCE } from "@/lib/dashboard-data";

export function AttendanceCard() {
  return (
    <Card className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold tracking-tight">
          Attendance Today
        </CardTitle>
        <CardDescription>1,284 of 1,362 expected</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <span className="text-[32px] font-semibold leading-none tracking-tight text-[#2b2b46]">
            94.2%
          </span>
          <span className="pb-1 text-xs font-medium text-emerald-600">
            +1.4% vs yesterday
          </span>
        </div>

        <div className="flex h-2 overflow-hidden rounded-full">
          {ATTENDANCE.map((a) => (
            <span
              key={a.label}
              style={{ width: `${a.value}%`, background: a.color }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {ATTENDANCE.map((a) => (
            <div key={a.label} className="flex items-center gap-3">
              <span
                className="size-2 rounded-full"
                style={{ background: a.color }}
              />
              <span className="flex-1 text-sm text-muted-foreground">
                {a.label}
              </span>
              <span className="text-sm font-semibold text-[#2b2b46]">
                {a.value}%
              </span>
              <Progress
                value={a.value}
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

        <div className="rounded-xl bg-[#fff3e6] px-3 py-2.5">
          <p className="text-xs font-semibold text-[#2b2b46]">
            2 late check-ins need review
          </p>
          <p className="text-xs text-[#6a6a7a]">
            Engineering · 08:42 and 09:18
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
