import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { moneyToMajor } from "@/lib/money";
import type { NextPayrollData } from "@/server/repo/payrun";

export function NextPayroll({ data }: { data: NextPayrollData | null }) {
  if (!data) {
    return (
      <div className="overflow-hidden rounded-[20px] border bg-white shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
        <div className="p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
            Next Payroll
          </h3>
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No payroll scheduled
          </div>
        </div>
        <Link
          href="#payroll"
          className="flex items-center justify-between border-t px-5 py-3.5 text-sm font-semibold text-[#2563eb] hover:bg-muted/40"
        >
          View Payroll
          <ChevronRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border bg-white shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <div className="p-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
          Next Payroll
        </h3>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#f1f5ff] px-5 py-5">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <CalendarClock className="size-8" />
            <span className="text-[36px] font-bold leading-none tracking-tight">
              {data.daysUntil}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1e2a4a]">
              {data.periodLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.daysUntil} days to go
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Estimated Payroll</p>
          <p className="mt-1 text-[22px] font-bold tracking-tight text-[#1e2a4a]">
            $
            {Number(moneyToMajor(data.estimatedGross)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.employeeCount} employees
          </p>
        </div>
      </div>
      <Link
        href="#payroll"
        className="flex items-center justify-between border-t px-5 py-3.5 text-sm font-semibold text-[#2563eb] hover:bg-muted/40"
      >
        View Payroll
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
