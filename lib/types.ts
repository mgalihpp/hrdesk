// Branded primitives. Illegal states are unrepresentable at the type level.

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
}
