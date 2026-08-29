"use client";

import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarClock,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Search,
  Settings,
  User,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { authClient } from "@/lib/auth-client";
import type { OrgSummary, ShellUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Employees", icon: Users, href: "/dashboard/employees" },
      { label: "Departments", icon: Building2, href: "/dashboard/departments" },
    ],
  },
  {
    label: "TIME",
    items: [
      { label: "Attendance", icon: Clock3, href: "/dashboard/attendance" },
      {
        label: "Leave Requests",
        icon: CalendarClock,
        href: "/dashboard/leave-requests",
      },
    ],
  },
  {
    label: "PAYROLL",
    items: [
      {
        label: "Payroll",
        icon: Wallet,
        href: "/dashboard/payroll",
        badge: "3",
      },
      { label: "Payslips", icon: ScrollText, href: "/dashboard#payslips" },
    ],
  },
  {
    label: "HIRING",
    items: [
      { label: "Candidates", icon: UserCheck, href: "/dashboard#candidates" },
      { label: "Interviews", icon: Briefcase, href: "/dashboard#interviews" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Reports", icon: BarChart3, href: "/dashboard#reports" },
      { label: "Analytics", icon: FileText, href: "/dashboard#analytics" },
    ],
  },
] as const;

const SECONDARY = [
  { label: "Settings", icon: Settings, href: "/dashboard#settings" },
  { label: "Help & Support", icon: HelpCircle, href: "/dashboard#help" },
] as const;

function getInitials(name: string, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    return (first + last).toUpperCase();
  }
  if (email) return (email[0] ?? "U").toUpperCase();
  return "U";
}

function formatRole(role: string): string {
  if (!role) return "Member";
  if (role === "payrollAdmin") return "Payroll Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const GENERIC_ORGS = new Set([
  "gmail",
  "googlemail",
  "yahoo",
  "outlook",
  "hotmail",
  "icloud",
  "proton",
  "protonmail",
  "aol",
  "zoho",
]);

function getDisplayOrgName(
  raw: string | null,
  displayName: string | null,
  email: string | null,
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (GENERIC_ORGS.has(trimmed.toLowerCase())) {
    const base = displayName?.trim() || email?.split("@")[0] || "";
    if (base && base.length >= 2)
      return `${base.charAt(0).toUpperCase() + base.slice(1)}'s Workspace`;
    return "Personal Workspace";
  }
  return trimmed;
}

export function AppSidebar({
  user,
  org,
}: {
  user: ShellUser | null;
  org: OrgSummary | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const rawDisplayName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : null) ||
    null;
  const displayName = rawDisplayName
    ? rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1)
    : null;
  const initials = user ? getInitials(user.name, user.email) : "U";
  const roleRaw = (org?.role ?? user?.roles[0] ?? "member") as string;
  const roleLabel = formatRole(roleRaw);
  const rawOrgName = org?.name ?? null;
  const orgName = getDisplayOrgName(
    rawOrgName,
    rawDisplayName,
    user?.email ?? null,
  );
  const sidebarSubtitle = user?.email ?? (orgName ? orgName : roleLabel);
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
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-widest text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : item.href.startsWith("/dashboard/employees") ||
                          item.href.startsWith("/dashboard/departments")
                        ? pathname === item.href ||
                          pathname.startsWith(`${item.href}/`) ||
                          pathname.startsWith(`${item.href}#`)
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}#`) ||
                          pathname.startsWith(`${item.href}/`);
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
                          {(() => {
                            if (!("badge" in item)) return null;
                            const badge = item.badge;
                            if (!badge) return null;
                            return (
                              <span className="ml-auto rounded-full bg-[#00acca] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                {badge}
                              </span>
                            );
                          })()}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

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
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-3 p-3">
        <div className="rounded-2xl bg-[#2b2b46] p-4 text-white">
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

        {user && displayName ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border-0 bg-card px-3 py-3 text-left hover:bg-muted/50"
              >
                <Avatar className="size-9">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={displayName ?? "User"} />
                  ) : null}
                  <AvatarFallback className="bg-[#e6fbff] text-[#2b2b46] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-none">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {sidebarSubtitle}
                  </p>
                </div>
                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-72 p-0">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {user.image ? (
                      <AvatarImage
                        src={user.image}
                        alt={displayName ?? "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-[#2b2b46] text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              {orgName ? (
                <div className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                      Workspace
                    </p>
                    <p className="truncate text-sm font-semibold leading-tight">
                      {orgName}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 border bg-white text-[11px] font-medium capitalize shadow-sm"
                  >
                    {roleLabel}
                  </Badge>
                </div>
              ) : (
                <div className="mx-3 mb-3 rounded-xl border border-dashed bg-muted/20 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    No workspace —{" "}
                    <Link
                      href="/dashboard"
                      className="font-medium text-foreground underline underline-offset-2"
                    >
                      Create one
                    </Link>
                  </p>
                </div>
              )}
              <DropdownMenuSeparator className="mx-0" />
              <div className="p-1.5">
                <DropdownMenuItem className="gap-2.5 rounded-lg py-2.5">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2.5 rounded-lg py-2.5">
                  <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                  Billing
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="mx-0" />
              <div className="p-1.5">
                <DropdownMenuItem
                  className="gap-2.5 rounded-lg py-2.5 text-destructive focus:text-destructive"
                  onSelect={async (event) => {
                    event.preventDefault();
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => router.push("/login"),
                      },
                    });
                  }}
                >
                  <LogOut className="size-4 shrink-0" />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border-0 bg-card px-3 py-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-[#e6fbff] text-[#2b2b46] font-semibold">
                ?
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-none">
                Not signed in
              </p>
              <p className="truncate text-xs text-muted-foreground">
                <Link href="/login" className="hover:underline">
                  Sign in
                </Link>{" "}
                to view profile
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
