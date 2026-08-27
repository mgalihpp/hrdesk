import type { PrismaClient, Tenant } from "@prisma/client";
import type { TenantId, TenantSettings } from "@/lib/types";

type StoredTenant = Tenant;
type SettingsPatch = Partial<Omit<TenantSettings, "tenantId">>;

function base(tenantId: TenantId) {
  return {
    tenantId,
    plan: "free" as const,
    taxLocale: "US" as const,
    brandingName: "",
    brandingLogoUrl: "",
  };
}

export function orgRepo(prisma: PrismaClient, tenantId: TenantId) {
  const toSettings = (d: StoredTenant): TenantSettings => ({
    tenantId: d.tenantId as TenantId,
    plan: d.plan as TenantSettings["plan"],
    taxLocale: d.taxLocale as TenantSettings["taxLocale"],
    brandingName: d.brandingName,
    brandingLogoUrl: d.brandingLogoUrl,
    updatedAt: new Date(d.updatedAt).toISOString(),
  });

  const get = async (): Promise<TenantSettings> => {
    const existing = await prisma.tenant.findUnique({ where: { tenantId } });
    if (existing) return toSettings(existing);
    const created = await prisma.tenant.create({ data: base(tenantId) });
    return toSettings(created);
  };

  return {
    get,
    async update(patch: SettingsPatch): Promise<TenantSettings> {
      const updated = await prisma.tenant.upsert({
        where: { tenantId },
        create: { ...base(tenantId), ...patch, updatedAt: new Date() },
        update: { ...patch, updatedAt: new Date() },
      });
      return toSettings(updated);
    },
  };
}
