export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }
  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, "day");
  }
  const diffWeek = Math.round(diffSec / 604800);
  if (Math.abs(diffWeek) < 5) {
    return rtf.format(diffWeek, "week");
  }
  const diffMonth = Math.round(diffSec / 2629800);
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }
  const diffYear = Math.round(diffSec / 31536000);
  return rtf.format(diffYear, "year");
}

export function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const first = parts[0];
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}
