import { DepartmentsClient } from "@/components/dashboard/departments/departments-client";

export default async function DepartmentsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Departments
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your organization departments.
        </p>
      </div>
      <DepartmentsClient />
    </div>
  );
}
