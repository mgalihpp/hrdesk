export type DepartmentLocation = "HQ" | "Branch";

export type DepartmentStatus = "Active" | "Inactive";

export type DepartmentIconKey =
  | "engineering"
  | "marketing"
  | "product"
  | "hr"
  | "finance"
  | "sales"
  | "support"
  | "legal"
  | "operations"
  | "design"
  | "qa"
  | "data";

export type DepartmentHead = {
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
};

export type DepartmentDisplay = {
  id: string;
  name: string;
  iconKey: DepartmentIconKey;
  head: DepartmentHead;
  location: DepartmentLocation;
  activeEmployees: number;
  budgetUtil: number;
  status: DepartmentStatus;
};

export type DepartmentFilters = {
  q: string;
  status: string;
  location: string;
};

export type DepartmentStats = {
  total: number;
  totalEmployees: number;
  activeCount: number;
  avgBudget: number;
};
