import { headers } from "next/headers";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  formatAuditLabel,
  formatRelativeTime,
  getInitials,
} from "@/lib/audit/format";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { auditRepo } from "@/server/repo/audit";

export default async function AuditPage() {
  const h = await headers();
  const session = await getShellSession(h);

  if (session.kind === "noSession") {
    return (
      <div className="space-y-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Audit log
        </h2>
        <div className="rounded-2xl border bg-white p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            You are not signed in. Please sign in to continue.
          </p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (session.kind === "noOrg") {
    return (
      <div className="space-y-6">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Audit log
        </h2>
        <p className="text-sm text-muted-foreground">
          Create a workspace to view audit logs.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const tenantId = session.user.tenantId as TenantId;
  const { items } = await auditRepo(prisma, tenantId).list({ limit: 20 });
  const actorIds = [...new Set(items.map((a) => a.actorId))];
  const users =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
          Audit log
        </h2>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          {items.map((a) => {
            const actorName = nameById.get(a.actorId) ?? "Unknown";
            const label = formatAuditLabel(a.action, a.metadata);
            const timeAgo = formatRelativeTime(a.createdAt);
            return (
              <div key={a.id as string} className="flex items-start gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[#f1f5f9] text-xs font-semibold text-[#1e2a4a]">
                    {getInitials(actorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight text-[#1e2a4a]">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {actorName} · {timeAgo}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {a.createdAt.toLocaleDateString("en-US")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
