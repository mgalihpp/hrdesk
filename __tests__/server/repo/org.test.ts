import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { TenantId } from "@/lib/types";
import { orgRepo } from "@/server/repo/org";

const TID = (s: string) => s as TenantId;

interface TenantRow {
  tenantId: string;
  plan: string;
  taxLocale: string;
  brandingName: string;
  brandingLogoUrl: string;
  updatedAt: Date;
}

function fakePrisma() {
  const tenants: TenantRow[] = [];
  const prisma = {
    tenant: {
      findUnique: async ({ where }: { where: { tenantId: string } }) =>
        tenants.find((t) => t.tenantId === where.tenantId) ?? null,
      create: async ({ data }: { data: TenantRow }) => {
        const r = { ...data, updatedAt: new Date() };
        tenants.push(r);
        return r;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { tenantId: string };
        create: TenantRow;
        update: Partial<TenantRow>;
      }) => {
        const i = tenants.findIndex((t) => t.tenantId === where.tenantId);
        if (i >= 0) {
          tenants[i] = { ...tenants[i], ...update } as TenantRow;
          return tenants[i];
        }
        const r = { ...create, updatedAt: new Date() };
        tenants.push(r);
        return r;
      },
    },
  };
  return { prisma: prisma as unknown as PrismaClient, tenants };
}

describe("orgRepo", () => {
  it("returns default settings and persists updates", async () => {
    const { prisma } = fakePrisma();
    const repo = orgRepo(prisma, TID("org_a"));
    const initial = await repo.get();
    expect(initial.plan).toBe("free");
    expect(initial.tenantId).toBe("org_a");

    const updated = await repo.update({ plan: "scale", brandingName: "Acme" });
    expect(updated.plan).toBe("scale");
    expect(updated.brandingName).toBe("Acme");

    const again = await repo.get();
    expect(again.plan).toBe("scale");
  });

  it("scopes settings to the tenant", async () => {
    const { prisma } = fakePrisma();
    await orgRepo(prisma, TID("org_a")).update({ plan: "growth" });
    const b = await orgRepo(prisma, TID("org_b")).get();
    expect(b.plan).toBe("free");
  });
});
