"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useShell } from "@/components/dashboard/ShellProviders";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const { user, org } = useShell();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right md:block">
        <div className="text-sm font-medium leading-none">
          {user.name || user.email}
        </div>
        <div className="text-xs text-muted-foreground">
          {org.name} · {user.roles[0] ?? "member"}
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
