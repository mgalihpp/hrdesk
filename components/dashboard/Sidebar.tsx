"use client";

import {
  Building2,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";
import { UserMenu } from "@/components/dashboard/UserMenu";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["owner", "admin", "hr"],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: Wallet,
    roles: ["owner", "payrollAdmin"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["owner", "admin"],
  },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const visible = NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
  return (
    <SidebarPrimitive>
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 pt-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Saasdesk
          </span>
        </div>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visible.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname?.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="rounded-lg"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-0 py-2">
        <UserMenu />
        <div className="px-2 pt-2 text-center text-[10px] leading-none text-muted-foreground">
          © Saasdesk
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
