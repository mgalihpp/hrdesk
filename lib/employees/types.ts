import type { Department, EmploymentType } from "@/lib/types";

export type { Department, EmploymentType };

export type EmployeeStatusLabel = "Active" | "On Leave";
export type EmployeeDisplay = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
  department: Department;
  position: string;
  status: EmployeeStatusLabel;
  employmentType: EmploymentType;
  joinedDate: string;
  avatarFallback?: string;
};

export type EmployeeFilters = {
  q: string;
  department: string;
  status: string;
  employmentType: string;
};

export type EmployeeStats = {
  total: number;
  active: number;
  onLeave: number;
  departments: number;
};
