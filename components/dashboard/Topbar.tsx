import { UserMenu } from "@/components/dashboard/UserMenu";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="text-sm font-medium">Dashboard</div>
      <UserMenu />
    </header>
  );
}
