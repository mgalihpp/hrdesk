import { PayrollClient } from "@/components/dashboard/payroll/payroll-client";

export default async function PayrollPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Payroll Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage, process, and analyze comprehensive payroll data.
        </p>
      </div>
      <PayrollClient />
    </div>
  );
}
