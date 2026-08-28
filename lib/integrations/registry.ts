import type {
  IntegrationCategory,
  IntegrationDef,
  IntegrationProvider,
} from "@/lib/integrations/types";

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  {
    provider: "slack",
    name: "Slack",
    category: "messaging",
    authType: "oauth2",
    description: "Team messaging and notifications",
  },
  {
    provider: "github",
    name: "GitHub",
    category: "productivity",
    authType: "oauth2",
    description: "Code and hiring pipeline",
  },
  {
    provider: "google-calendar",
    name: "Google Calendar",
    category: "calendar",
    authType: "oauth2",
    description: "Calendar and leave sync",
  },
  {
    provider: "microsoft365",
    name: "Microsoft 365",
    category: "calendar",
    authType: "oauth2",
    description: "Outlook calendar and identity",
  },
  {
    provider: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    authType: "oauth2",
    description: "Accounting and payroll export",
  },
  {
    provider: "xero",
    name: "Xero",
    category: "accounting",
    authType: "oauth2",
    description: "Accounting and invoicing",
  },
  {
    provider: "stripe",
    name: "Stripe",
    category: "bank",
    authType: "apiKey",
    description: "Billing and payouts",
  },
  {
    provider: "gusto",
    name: "Gusto",
    category: "hr",
    authType: "oauth2",
    description: "Payroll and benefits",
  },
  {
    provider: "zapier",
    name: "Zapier",
    category: "productivity",
    authType: "webhook",
    description: "Automation via webhooks",
  },
  {
    provider: "webhook-generic",
    name: "Generic Webhook",
    category: "productivity",
    authType: "webhook",
    description: "Catch any webhook event",
  },
];

const BY_PROVIDER = new Map<IntegrationProvider, IntegrationDef>(
  INTEGRATION_CATALOG.map((d) => [d.provider, d]),
);

export function isKnownProvider(v: string): v is IntegrationProvider {
  return BY_PROVIDER.has(v as IntegrationProvider);
}
export function getProvider(provider: IntegrationProvider): IntegrationDef {
  const def = BY_PROVIDER.get(provider);
  if (!def) throw new Error(`Unknown provider: ${provider}`);
  return def;
}
export function listByCategory(
  category: IntegrationCategory,
): IntegrationDef[] {
  return INTEGRATION_CATALOG.filter((d) => d.category === category);
}
export function searchProviders(q: string): IntegrationDef[] {
  const needle = q.toLowerCase();
  return INTEGRATION_CATALOG.filter(
    (d) => d.name.toLowerCase().includes(needle) || d.provider.includes(needle),
  );
}
