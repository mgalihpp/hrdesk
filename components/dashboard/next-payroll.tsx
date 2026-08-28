import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";

export function NextPayroll() {
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
              3
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1e2a4a]">September 2025</p>
            <p className="text-sm text-muted-foreground">5 days to go</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Estimated Payroll</p>
          <p className="mt-1 text-[22px] font-bold tracking-tight text-[#1e2a4a]">
            Rp 428.500.000
          </p>
          <p className="mt-1 text-sm text-muted-foreground">128 employees</p>
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
