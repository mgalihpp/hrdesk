// Branded primitives. Illegal states are unrepresentable at the type level.

import type { PrismaClient } from "@prisma/client";
import type { Db } from "mongodb";
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
  mongo: Db;
  prisma: PrismaClient;
}

export type EmployeeId = string & { readonly __brand: "EmployeeId" };

export type EmployeeStatus = "active" | "on_leave" | "terminated";

// Stored shape. PII fields are ciphertext produced by lib/crypto.
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

// Read shape. PII is decrypted server-side before it leaves the repository.
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
