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

export type SubscriptionId = string & { readonly __brand: "SubscriptionId" };
export type InvoiceId = string & { readonly __brand: "InvoiceId" };

export type Plan = "free" | "starter" | "professional" | "business";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";
export type InvoiceStatus = "draft" | "open" | "paid" | "void";

export interface SubscriptionView {
  id: SubscriptionId;
  tenantId: TenantId;
  plan: Plan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceView {
  id: InvoiceId;
  tenantId: TenantId;
  subscriptionId: SubscriptionId | null;
  amount: Cents;
  status: InvoiceStatus;
  billingInterval: BillingInterval;
  periodStart: string;
  periodEnd: string;
  idempotencyKey: string;
  createdAt: string;
}

export type EventId = string & { readonly __brand: "EventId" };
export type EmployeeId = string & { readonly __brand: "EmployeeId" };
export type PayRunId = string & { readonly __brand: "PayRunId" };
export type PayslipId = string & { readonly __brand: "PayslipId" };
export type TimeEntryId = string & { readonly __brand: "TimeEntryId" };
export type LeaveId = string & { readonly __brand: "LeaveId" };
export type JobId = string & { readonly __brand: "JobId" };
export type CandidateId = string & { readonly __brand: "CandidateId" };
export type InterviewId = string & { readonly __brand: "InterviewId" };
export type DepartmentId = string & { readonly __brand: "DepartmentId" };
export type IntegrationConnectionId = string & {
  readonly __brand: "IntegrationConnectionId";
};
export type IntegrationSyncId = string & {
  readonly __brand: "IntegrationSyncId";
};

export type EventType = "meeting" | "interview" | "payroll";

export interface Event {
  id: EventId;
  tenantId: TenantId;
  title: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  type: EventType;
  createdAt: string;
}

export type ReportId = string & { readonly __brand: "ReportId" };

export type TimeEntryType = "clock" | "shift" | "manual";
export type TimeEntryStatus = "pending" | "approved" | "rejected";
export type LeaveType = "vacation" | "sick" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TimeEntry {
  id: TimeEntryId;
  tenantId: TenantId;
  employeeId: EmployeeId;
  type: TimeEntryType;
  startAt: string;
  endAt: string;
  status: TimeEntryStatus;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  id: LeaveId;
  tenantId: TenantId;
  employeeId: EmployeeId;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeStatus = "active" | "on_leave" | "terminated";

export type EmploymentType = "Full Time" | "Part Time" | "Contract" | "Intern";

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
  department: Department;
  position: string;
  employmentType: EmploymentType;
  avatarUrl: string;
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
  department: Department;
  position: string;
  employmentType: EmploymentType;
  avatarUrl: string;
  createdAt: string;
}
export interface TenantSettings {
  tenantId: TenantId;
  plan: Plan | "growth" | "scale";
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
