import { Sidebar } from "@/components/dashboard/Sidebar";
import { ShellProviders } from "@/components/dashboard/ShellProviders";
import { Topbar } from "@/components/dashboard/Topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DashboardShellProps } from "@/lib/types";

export function DashboardShell({
  user,
  org,
  orgs,
  children,
}: DashboardShellProps) {
  return (
    <ShellProviders user={user} org={org} orgs={orgs}>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <Sidebar role={org.role} />
          <SidebarInset>
            <Topbar />
            <div className="flex flex-1 flex-col bg-background p-6 md:p-8">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ShellProviders>
  );
}
