import { Bell, Search } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="bg-[#fbfaf9]">
        <header className="sticky top-0 z-10 flex h-[64px] items-center gap-3 border-b bg-white/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 lg:px-6">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="hidden h-6 lg:block" />
          <div className="hidden items-center gap-2 lg:flex">
            <h1 className="text-sm font-semibold">Dashboard</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                className="h-9 w-[260px] rounded-xl bg-muted/50 pl-9"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#00acca] ring-2 ring-white" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 text-left hover:bg-muted/50"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[#2b2b46] text-white text-xs font-semibold">
                      GM
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden pr-1 text-sm font-medium lg:block">
                    Galih M.
                  </span>
                  <Badge
                    variant="secondary"
                    className="hidden bg-[#e6fff0] text-emerald-700 border-0 lg:inline-flex"
                  >
                    Pro
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Acme Inc — Owner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
