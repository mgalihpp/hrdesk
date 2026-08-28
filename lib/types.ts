import type { PrismaClient } from "@prisma/client";
import type { Cents } from "@/lib/money";

export type TenantId = string & { readonly __brand: "TenantId" };

export type Role =
  | "owner"
  | "admin"
  | "manager"
  | "hr"
  | "employee"
  | "payrollAdmin";

export interface SessionUser {
  id: string;
  tenantId: TenantId;
  roles: Role[];
}

export interface TRPCContext {
  session: SessionUser | null;
  prisma: PrismaClient;
}

export type EmployeeId = string & { readonly __brand: "EmployeeId" };

export type EmployeeStatus = "active" | "on_leave" | "terminated";

export interface Employee {
  id: EmployeeId;
  tenantId: TenantId;
  firstName: string;
  lastName: string;
  email: string;
  ssnEnc: string;
  bankEnc: string;
  compensation: Cents;
  hireDate: string;
  status: EmployeeStatus;
  createdAt: string;
}

export interface EmployeeView {
  id: EmployeeId;
  tenantId: TenantId;
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  bank: string;
  compensation: Cents;
  hireDate: string;
  status: EmployeeStatus;
  createdAt: string;
}

export interface TenantSettings {
  tenantId: TenantId;
  plan: "free" | "growth" | "scale";
  taxLocale: "US" | "ID";
  brandingName: string;
  brandingLogoUrl: string;
  updatedAt: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: Role;
  plan: string;
}

export type ShellUser = SessionUser & {
  name: string;
  email: string;
  image: string | null;
};

export interface DashboardShellProps {
  user: ShellUser;
  org: OrgSummary;
  orgs: OrgSummary[];
  children: React.ReactNode;
}

export type ShellSession =
  | {
      kind: "authenticated";
      user: ShellUser;
      org: OrgSummary;
      orgs: OrgSummary[];
    }
  | { kind: "noSession" }
  | { kind: "noOrg"; user: ShellUser; orgs: [] };
