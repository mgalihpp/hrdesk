import { Bell, ChevronDown, CreditCard, Search, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SignOutItem } from "@/components/dashboard/sign-out-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { getShellSession } from "@/lib/shell-session";

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

function formatPlan(plan: string | undefined): string | null {
  if (!plan || plan === "free") return null;
  if (plan === "professional") return "Pro";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await getShellSession(h);

  const user =
    session.kind === "authenticated" || session.kind === "noOrg"
      ? session.user
      : null;
  const org = session.kind === "authenticated" ? session.org : null;

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
  const planBadge = org ? formatPlan(org.plan) : null;

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar user={user} org={org} />
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

            {user && displayName ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border-0 bg-transparent px-2 py-1.5 pr-2.5 text-left hover:bg-muted/50"
                  >
                    <Avatar className="size-8">
                      {user.image ? (
                        <AvatarImage
                          src={user.image}
                          alt={displayName ?? "User"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-[#2b2b46] text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden pr-1 text-sm font-medium lg:block">
                      {displayName}
                    </span>
                    {planBadge ? (
                      <Badge
                        variant="secondary"
                        className="hidden bg-[#e6fff0] text-emerald-700 border-0 lg:inline-flex"
                      >
                        {planBadge}
                      </Badge>
                    ) : null}
                    <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0">
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
                    <SignOutItem />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
