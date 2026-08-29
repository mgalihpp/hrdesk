import type { AuditAction } from "./types";

export const AUDIT_LABELS: Record<AuditAction, string> = {
  "payrun.create": "Payroll run created",
  "payrun.lock": "Payroll run locked",
  "billing.upsertSubscription": "Subscription updated",
  "billing.createInvoice": "Invoice created",
  "integration.connect": "Integration connected",
  "integration.disconnect": "Integration disconnected",
  "integration.trigger": "Integration triggered",
  "integration.ingestWebhook": "Webhook ingested",
  "integration.retrySync": "Integration sync retried",
  "reporting.export": "Report exported",
};

export function auditActionLabel(action: AuditAction): string {
  return AUDIT_LABELS[action] ?? action;
}
