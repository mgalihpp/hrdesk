import type { TenantId } from "@/lib/types";

export type IntegrationConnectionId = string & {
  readonly __brand: "IntegrationConnectionId";
};
export type IntegrationSyncId = string & {
  readonly __brand: "IntegrationSyncId";
};

export const INTEGRATION_CATEGORIES = [
  "accounting",
  "calendar",
  "messaging",
  "productivity",
  "bank",
  "hr",
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_AUTH_TYPES = ["oauth2", "apiKey", "webhook"] as const;
export type IntegrationAuthType = (typeof INTEGRATION_AUTH_TYPES)[number];

export const CONNECTION_STATUS = [
  "disconnected",
  "pending",
  "connected",
  "error",
] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUS)[number];

export const SYNC_STATUS = ["pending", "running", "success", "failed"] as const;
export type SyncStatus = (typeof SYNC_STATUS)[number];

export const SYNC_DIRECTIONS = ["inbound", "outbound"] as const;
export type SyncDirection = (typeof SYNC_DIRECTIONS)[number];

export type IntegrationProvider =
  | "slack"
  | "google-calendar"
  | "quickbooks"
  | "xero"
  | "github"
  | "stripe"
  | "gusto"
  | "microsoft365"
  | "zapier"
  | "webhook-generic";

export interface IntegrationDef {
  provider: IntegrationProvider;
  name: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  description: string;
}

export interface IntegrationConnection {
  id: IntegrationConnectionId;
  tenantId: TenantId;
  provider: IntegrationProvider;
  status: ConnectionStatus;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionView extends IntegrationConnection {
  hasCredentials: boolean;
}

export interface IntegrationSync {
  id: IntegrationSyncId;
  tenantId: TenantId;
  connectionId: IntegrationConnectionId;
  provider: IntegrationProvider;
  direction: SyncDirection;
  status: SyncStatus;
  idempotencyKey: string | null;
  payload: Record<string, unknown> | null;
  error: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}
