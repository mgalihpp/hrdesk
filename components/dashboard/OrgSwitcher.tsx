"use client";

import { ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShell } from "@/components/dashboard/ShellProviders";
import { authClient } from "@/lib/auth-client";

export function OrgSwitcher() {
  const { org, orgs } = useShell();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (orgs.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {org.name}
        </span>
        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {org.plan}
        </span>
      </div>
    );
  }

  async function handleChange(nextId: string) {
    if (nextId === org.id || pending) return;
    setPending(true);
    try {
      await authClient.organization.setActive({ organizationId: nextId });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border bg-muted/50 px-2 py-1.5">
      <select
        value={org.id}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none disabled:opacity-50"
        aria-label="Organization"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} — {o.role}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </label>
  );
}
