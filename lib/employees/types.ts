export type EmploymentType = "Full Time" | "Contract" | "Part Time" | "Intern";

export type EmployeeStatusLabel = "Active" | "On Leave";

export type Department =
  | "Engineering"
  | "Marketing"
  | "Product"
  | "HR"
  | "Finance"
  | "Sales"
  | "Customer Support"
  | "Legal"
  | "Operations"
  | "Design"
  | "QA"
  | "Data";

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
