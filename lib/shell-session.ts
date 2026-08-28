import "server-only";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  OrgSummary,
  Role,
  ShellSession,
  ShellUser,
  TenantId,
} from "@/lib/types";

type RawOrg = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

function toRole(value: unknown): Role {
  const allowed: Role[] = [
    "owner",
    "admin",
    "manager",
    "hr",
    "employee",
    "payrollAdmin",
  ];
  if (typeof value === "string" && (allowed as string[]).includes(value))
    return value as Role;
  return "employee";
}

async function getShellSessionUncached(
  headers: Headers,
): Promise<ShellSession> {
  try {
    const data = await auth.api.getSession({ headers });
    if (!data || typeof data !== "object") return { kind: "noSession" };
    if (!("user" in data) || !("session" in data)) return { kind: "noSession" };
    const user = (data as { user: unknown }).user;
    const sess = (data as { session: unknown }).session;
    if (!user || typeof user !== "object") return { kind: "noSession" };
    if (!sess || typeof sess !== "object") return { kind: "noSession" };
    const userId = (user as { id?: unknown }).id;
    if (typeof userId !== "string") return { kind: "noSession" };

    const activeOrganizationId =
      typeof (sess as { activeOrganizationId?: unknown })
        .activeOrganizationId === "string"
        ? ((sess as { activeOrganizationId: string }).activeOrganizationId ??
          null)
        : null;

    const tenantId = (activeOrganizationId ?? "") as TenantId;
    const imageValue =
      "image" in (user as Record<string, unknown>) &&
      typeof (user as { image?: unknown }).image === "string"
        ? ((user as { image: string }).image ?? null)
        : null;
    const nameValue =
      "name" in (user as Record<string, unknown>) &&
      typeof (user as { name?: unknown }).name === "string"
        ? (user as { name: string }).name
        : "";
    const emailValue =
      "email" in (user as Record<string, unknown>) &&
      typeof (user as { email?: unknown }).email === "string"
        ? (user as { email: string }).email
        : "";

    const baseUser: ShellUser = {
      id: userId,
      tenantId,
      name: nameValue,
      email: emailValue,
      image: imageValue,
      roles: [],
    };

    if (!activeOrganizationId) {
      return { kind: "noOrg", user: baseUser, orgs: [] };
    }

    let activeRole: Role = "employee";
    try {
      const roleRes = await auth.api.getActiveMemberRole({ headers });
      const roleVal =
        roleRes && typeof roleRes === "object" && "role" in roleRes
          ? (roleRes as { role: unknown }).role
          : null;
      activeRole = toRole(roleVal);
    } catch {
      activeRole = "employee";
    }

    let rawOrgs: RawOrg[] = [];
    try {
      const list = await auth.api.listOrganizations({ headers });
      if (Array.isArray(list)) rawOrgs = list as RawOrg[];
      else if (
        list &&
        typeof list === "object" &&
        "organizations" in (list as Record<string, unknown>)
      ) {
        const maybe = (list as { organizations?: unknown }).organizations;
        if (Array.isArray(maybe)) rawOrgs = maybe as RawOrg[];
      }
    } catch {
      rawOrgs = [];
    }

    const shellUser: ShellUser = {
      ...baseUser,
      tenantId: activeOrganizationId as TenantId,
      roles: [activeRole],
    };

    if (rawOrgs.length === 0) {
      try {
        const single = await auth.api.getFullOrganization({
          headers,
          query: { organizationId: activeOrganizationId },
        } as unknown as { headers: Headers });
        if (
          single &&
          typeof single === "object" &&
          "id" in (single as Record<string, unknown>)
        ) {
          const org = single as unknown as RawOrg;
          if (typeof org.id === "string") {
            const tenant = await prisma.tenant.findUnique({
              where: { tenantId: org.id },
            });
            const summary: OrgSummary = {
              id: org.id,
              name: org.name,
              slug: org.slug,
              logo: org.logo ?? null,
              role: activeRole,
              plan: tenant?.plan ?? "free",
            };
            return {
              kind: "authenticated",
              user: shellUser,
              org: summary,
              orgs: [summary],
            };
          }
        }
      } catch {
        return { kind: "noOrg", user: shellUser, orgs: [] };
      }
      return { kind: "noOrg", user: shellUser, orgs: [] };
    }

    const orgSummaries: OrgSummary[] = await Promise.all(
      rawOrgs.map(async (org) => {
        let role: Role = activeRole;
        if (org.id !== activeOrganizationId) {
          try {
            const r = await auth.api.getActiveMemberRole({
              headers,
              query: { organizationId: org.id },
            } as unknown as {
              headers: Headers;
              query: { organizationId: string };
            });
            const rv =
              r && typeof r === "object" && "role" in r
                ? (r as { role: unknown }).role
                : null;
            role = toRole(rv);
          } catch {
            role = "employee";
          }
        }
        let plan = "free";
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { tenantId: org.id },
          });
          if (tenant?.plan) plan = tenant.plan;
        } catch {
          plan = "free";
        }
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo ?? null,
          role,
          plan,
        };
      }),
    );

    const activeOrg = orgSummaries.find((o) => o.id === activeOrganizationId);
    if (!activeOrg) return { kind: "noOrg", user: shellUser, orgs: [] };

    return {
      kind: "authenticated",
      user: shellUser,
      org: activeOrg,
      orgs: orgSummaries,
    };
  } catch {
    return { kind: "noSession" };
  }
}

export const getShellSession = cache(getShellSessionUncached);
