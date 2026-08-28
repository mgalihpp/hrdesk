"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShell } from "@/components/dashboard/ShellProviders";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

export function OrgSwitcher() {
  const { org, orgs } = useShell();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (orgs.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-xs">
        <span className="min-w-0 flex-1 truncate text-sm font-medium leading-none">
          {org.name}
        </span>
        <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
          {org.plan}
        </Badge>
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
    <Select
      value={org.id}
      onValueChange={handleChange}
      disabled={pending}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {orgs.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name} — {o.role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
