import {
  Building2,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";

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
  const visible = NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Saasdesk</span>
      </div>
      <div className="p-3">
        <OrgSwitcher />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        © Saasdesk
      </div>
    </aside>
  );
}
