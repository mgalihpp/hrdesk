import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCsv } from "@/lib/reporting/csv";
import type { TenantId } from "@/lib/types";
import { auditRepo } from "@/server/repo/audit";
import { reportingRepo } from "@/server/repo/reporting";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from !== null && !dateRegex.test(from)) {
    return new Response(JSON.stringify({ error: "Invalid from date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (to !== null && !dateRegex.test(to)) {
    return new Response(JSON.stringify({ error: "Invalid to date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (from && to && from > to) {
    return new Response(JSON.stringify({ error: "from must be <= to" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionData = (await auth.api.getSession({
    headers: request.headers,
  })) as unknown;

  let activeOrganizationId: string | null = null;
  if (
    sessionData &&
    typeof sessionData === "object" &&
    "session" in sessionData
  ) {
    const sess = sessionData.session;
    if (
      sess &&
      typeof sess === "object" &&
      "activeOrganizationId" in sess &&
      typeof sess.activeOrganizationId === "string"
    ) {
      activeOrganizationId = sess.activeOrganizationId;
    }
  }

  if (!sessionData || !activeOrganizationId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const tenantId = activeOrganizationId as TenantId;
  const range = from && to ? { from, to } : from || to ? undefined : undefined;

  let effectiveRange: { from: string; to: string } | undefined;
  if (from && to) effectiveRange = { from, to };
  else if (from || to) {
    return new Response(
      JSON.stringify({ error: "Both from and to required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const repo = reportingRepo(prisma, tenantId);
  const series = await repo.getPayrollSeries(effectiveRange ?? range);
  const csv = buildCsv(series);

  let actorId: string | null = null;
  if (sessionData && typeof sessionData === "object" && "user" in sessionData) {
    const user = (sessionData as { user?: unknown }).user;
    if (
      user &&
      typeof user === "object" &&
      "id" in user &&
      typeof (user as { id: unknown }).id === "string"
    ) {
      actorId = (user as { id: string }).id;
    }
  }
  if (actorId) {
    try {
      await auditRepo(prisma, tenantId).create({
        actorId,
        action: "reporting.export",
        targetType: "reporting",
        targetId: `export:${from ?? ""}:${to ?? ""}`,
        metadata: JSON.stringify({
          from: from ?? null,
          to: to ?? null,
          rows: series.length,
        }),
      });
    } catch {}
  }

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reporting.csv"',
    },
  });
}
