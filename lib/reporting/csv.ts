import { moneyToMajor } from "@/lib/money";
import type { PayrollSeriesPoint } from "./types";

function escapeField(value: string): string {
  if (
    value.includes('"') ||
    value.includes(",") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: PayrollSeriesPoint[]): string {
  const header = "period,gross,net,tax";
  if (rows.length === 0) return `${header}\n`;
  const lines = rows.map((r) => {
    const period = `${r.periodStart} - ${r.periodEnd}`;
    const gross = moneyToMajor(r.gross);
    const net = moneyToMajor(r.net);
    const tax = moneyToMajor(r.tax);
    return [period, gross, net, tax].map(escapeField).join(",");
  });
  return `${header}\n${lines.join("\n")}\n`;
}
