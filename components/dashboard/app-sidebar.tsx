"use client";

import {
  BarChart3,
  Briefcase,
  Clock3,
  HelpCircle,
  LayoutDashboard,
  Puzzle,
  Search,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  { label: "Employees", icon: Users, href: "/dashboard#employees" },
  { label: "Payroll", icon: Wallet, href: "/dashboard#payroll", badge: "3" },
  { label: "Attendance", icon: Clock3, href: "/dashboard#attendance" },
  { label: "Recruitment", icon: Briefcase, href: "/dashboard#recruitment" },
  { label: "Integrations", icon: Puzzle, href: "/dashboard#integrations" },
  { label: "Reports", icon: BarChart3, href: "/dashboard#reports" },
] as const;

const SECONDARY = [
  { label: "Settings", icon: Settings, href: "/dashboard#settings" },
  { label: "Help & Support", icon: HelpCircle, href: "/dashboard#help" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar className="border-r border-border/60">
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#2b2b46] text-white text-[13px] font-semibold tracking-tight">
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#2b2b46]">
            Saasdesk
          </span>
          <Badge
            variant="secondary"
            className="ml-1 bg-[#e6fbff] text-[#00acca] text-[10px] font-semibold border-0 px-1.5 py-0"
          >
            HR
          </Badge>
        </Link>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <span className="truncate">Search employees, runs…</span>
          <span className="ml-auto hidden lg:inline-flex items-center gap-1 text-[11px]">
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
              ⌘
            </kbd>
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
              K
            </kbd>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-widest text-muted-foreground/70">
            MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : false;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "rounded-xl",
                        isActive &&
                          "bg-[#2b2b46] text-white hover:bg-[#2b2b46] hover:text-white data-[active=true]:bg-[#2b2b46] data-[active=true]:text-white",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                        {"badge" in item && item.badge ? (
                          <span className="ml-auto rounded-full bg-[#00acca] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-widest text-muted-foreground/70">
            GENERAL
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="rounded-xl">
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-2 mt-2 rounded-2xl bg-[#2b2b46] p-4 text-white">
          <p className="text-sm font-semibold">Upgrade to Pro</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            Get advanced payroll rules and 100+ integrations.
          </p>
          <Link
            href="/#pricing"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#2b2b46] hover:bg-white/90"
          >
            View plans
          </Link>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-[#e6fbff] text-[#2b2b46] font-semibold">
              GM
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none">
              Galih M.
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Owner · Acme Inc
            </p>
          </div>
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
