"use client";

import { createContext, useContext } from "react";
import type { OrgSummary, ShellUser } from "@/lib/types";

type ShellContextValue = {
  user: ShellUser;
  org: OrgSummary;
  orgs: OrgSummary[];
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProviders({
  user,
  org,
  orgs,
  children,
}: ShellContextValue & { children: React.ReactNode }) {
  return (
    <ShellContext.Provider value={{ user, org, orgs }}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProviders");
  return ctx;
}
