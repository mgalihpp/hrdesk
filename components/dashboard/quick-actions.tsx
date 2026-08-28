import { BarChart3, DollarSign, Plus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="rounded-[20px] border bg-white p-5 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
        Quick Actions
      </h3>
      <div className="mt-5 space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e2a5a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1e2a5a]/90"
        >
          <Plus className="size-5" />
          Add Employee
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-muted/50"
        >
          <Plus className="size-5" />
          Request Leave
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-muted/50"
        >
          <DollarSign className="size-5" />
          Run Payroll
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-muted/50"
        >
          <BarChart3 className="size-5" />
          View Reports
        </button>
      </div>
    </div>
  );
}
