import { PayslipsClient } from "@/components/dashboard/payslips/payslips-client";

export default async function PayslipsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Payslips
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage all employee payslips
        </p>
      </div>
      <PayslipsClient />
    </div>
  );
}
