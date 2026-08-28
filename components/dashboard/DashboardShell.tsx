import { ShellProviders } from "@/components/dashboard/ShellProviders";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import type { DashboardShellProps } from "@/lib/types";

export function DashboardShell({
  user,
  org,
  orgs,
  children,
}: DashboardShellProps) {
  return (
    <ShellProviders user={user} org={org} orgs={orgs}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar role={org.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-muted/30 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </ShellProviders>
  );
}
