import type { AuditAction } from "./types";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "payrun.create": "Payroll created",
  "payrun.lock": "Payroll locked",
  "payroll.run": "Payroll run",
  "billing.upsertSubscription": "Subscription updated",
  "billing.createInvoice": "Invoice created",
  "integration.connect": "Integration connected",
  "integration.disconnect": "Integration disconnected",
  "integration.trigger": "Integration triggered",
  "integration.ingestWebhook": "Webhook received",
  "integration.retrySync": "Sync retried",
  "reporting.export": "Report exported",
  "employee.create": "Employee created",
  "tenant.update": "Workspace updated",
};

function fallbackLabel(action: string): string {
  const spaced = action
    .replaceAll(".", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getAuditLabel(
  action: AuditAction | (string & {}),
  _metadata?: string | null,
): string {
  return (
    (AUDIT_ACTION_LABELS as Record<string, string>)[action] ??
    fallbackLabel(action)
  );
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = date.getTime() - now.getTime();
  const seconds = Math.round(diff / 1000);
  if (Math.abs(seconds) < 30) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(diff / (60 * 1000));
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(diff / (60 * 60 * 1000));
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  if (Math.abs(days) < 30) {
    const weeks = Math.round(days / 7);
    return rtf.format(weeks, "week");
  }
  if (Math.abs(days) < 365) {
    const months = Math.round(days / 30);
    return rtf.format(months, "month");
  }
  const years = Math.round(days / 365);
  return rtf.format(years, "year");
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const initials = `${first}${second}`.toUpperCase();
  return initials || "?";
}
