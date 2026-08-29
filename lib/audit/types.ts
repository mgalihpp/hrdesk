export type AuditLogId = string & { readonly __brand: "AuditLogId" };

export const AUDIT_ACTIONS = [
  "payrun.create",
  "payrun.lock",
  "payroll.run",
  "billing.upsertSubscription",
  "billing.createInvoice",
  "integration.connect",
  "integration.disconnect",
  "integration.trigger",
  "integration.ingestWebhook",
  "integration.retrySync",
  "reporting.export",
  "employee.create",
  "tenant.update",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const AUDIT_ACTION_MAP: Record<string, true> = {
  "payrun.create": true,
  "payrun.lock": true,
  "payroll.run": true,
  "billing.upsertSubscription": true,
  "billing.createInvoice": true,
  "integration.connect": true,
  "integration.disconnect": true,
  "integration.trigger": true,
  "integration.ingestWebhook": true,
  "integration.retrySync": true,
  "reporting.export": true,
  "employee.create": true,
  "tenant.update": true,
};

export function parseAuditAction(value: string): AuditAction {
  if (!AUDIT_ACTION_MAP[value]) {
    throw new Error(`Invalid audit action: ${value}`);
  }
  return value as AuditAction;
}

export function isAuditAction(value: string): value is AuditAction {
  return Boolean(AUDIT_ACTION_MAP[value]);
}

export interface AuditView {
  id: AuditLogId;
  tenantId: string;
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata: string | null;
  createdAt: Date;
}

export interface AuditCreateInput {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: string | null;
}
