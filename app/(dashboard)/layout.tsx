import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { sanitizeNext } from "@/lib/auth-errors";
import { getShellSession } from "@/lib/shell-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await getShellSession(h);

  if (session.kind === "noSession") {
    const safe = sanitizeNext("/dashboard") ?? "/dashboard";
    redirect(`/login?next=${encodeURIComponent(safe)}`);
  }

  if (session.kind === "noOrg") {
    redirect("/");
  }

  return (
    <DashboardShell user={session.user} org={session.org} orgs={session.orgs}>
      {children}
    </DashboardShell>
  );
}
