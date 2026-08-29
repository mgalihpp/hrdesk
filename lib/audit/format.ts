import type { AuditAction } from "@/lib/audit/types";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "payrun.create": "Payroll created",
  "payrun.lock": "Payroll locked",
  "billing.upsertSubscription": "Subscription updated",
  "billing.createInvoice": "Invoice created",
  "integration.connect": "Integration connected",
  "integration.disconnect": "Integration disconnected",
  "integration.trigger": "Integration triggered",
  "integration.ingestWebhook": "Webhook received",
  "integration.retrySync": "Sync retried",
  "reporting.export": "Report exported",
};

export function formatAuditLabel(
  action: AuditAction,
  metadata?: string | null,
): string {
  const base = AUDIT_ACTION_LABELS[action as AuditAction] ?? (action as string);
  if (!metadata) return base;
  const raw = metadata.trim();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      const provider =
        typeof parsed.provider === "string" ? parsed.provider : null;
      if (provider) return `${base} · ${provider}`;
      const plan = typeof parsed.plan === "string" ? parsed.plan : null;
      if (plan) return `${base} · ${plan}`;
      const connectionId =
        typeof parsed.connectionId === "string" ? parsed.connectionId : null;
      if (connectionId) return `${base} · ${connectionId.slice(0, 8)}`;
      const periodStart =
        typeof parsed.periodStart === "string" ? parsed.periodStart : null;
      const periodEnd =
        typeof parsed.periodEnd === "string" ? parsed.periodEnd : null;
      if (periodStart || periodEnd)
        return `${base} · ${periodStart ?? ""}${periodEnd ? ` – ${periodEnd}` : ""}`.trim();
      const from = typeof parsed.from === "string" ? parsed.from : null;
      const to = typeof parsed.to === "string" ? parsed.to : null;
      if (from || to)
        return `${base} · ${from ?? ""}${to ? ` – ${to}` : ""}`.trim();
    }
  } catch {}
  const snippet = raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
  return `${base} · ${snippet}`;
}

export function formatRelativeTime(date: Date, now?: Date): string {
  const base = now ?? new Date(Date.now());
  const diffMs = date.getTime() - base.getTime();
  if (diffMs > 0) return "just now";
  const absMs = -diffMs;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const sec = Math.round(diffMs / 1000);
  if (absMs < 60 * 1000) return rtf.format(sec, "second");
  const min = Math.round(diffMs / (60 * 1000));
  if (absMs < 60 * 60 * 1000) return rtf.format(min, "minute");
  const hour = Math.round(diffMs / (60 * 60 * 1000));
  if (absMs < 24 * 60 * 60 * 1000) return rtf.format(hour, "hour");
  const day = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (absMs < 7 * 24 * 60 * 60 * 1000) return rtf.format(day, "day");
  const week = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  if (absMs < 30 * 24 * 60 * 60 * 1000) return rtf.format(week, "week");
  const month = Math.round(diffMs / (30 * 24 * 60 * 60 * 1000));
  if (absMs < 365 * 24 * 60 * 60 * 1000) return rtf.format(month, "month");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0];
    if (w.length >= 2) return (w[0] + w[1]).toUpperCase();
    return w[0].toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
