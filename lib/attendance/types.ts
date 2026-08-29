import type { Department } from "@/lib/employees/types";

export type { Department } from "@/lib/employees/types";
export type AttendanceStatus = "Active" | "Late" | "On Leave";

export type AttendanceRecord = {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    department: Department;
  };
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: AttendanceStatus;
};

export type DateRangePreset =
  | "All Time"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Month";
