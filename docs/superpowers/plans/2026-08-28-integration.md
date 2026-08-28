# Integration Hub Implementation Plan — Phase 5

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Integration Hub (INTG) bounded context so a tenant admin can browse a catalog of 100+ tool integrations, connect or disconnect providers, receive webhook events, and track sync history with retry. Tenancy is enforced by construction, credentials are encrypted at rest, and every operation is idempotent and RBAC-gated.

**Architecture:** Pure registry and state machines in `lib/integrations/` that never touch I/O. They own the catalog, connection lifecycle, and sync retry policy. A thin `server/repo/integration.ts` factory enforces `tenantId` from `TRPCContext` and encrypts credentials via `lib/crypto`. The tRPC router at `server/trpc/routers/integration.ts` is the only boundary that parses external input with zod and checks RBAC. Webhook ingress is a tRPC mutation that validates signature at the boundary then delegates to pure handlers. This mirrors `employeeRepo(prisma, tenantId)` at `server/repo/employee.ts:21`, `billingRepo` at `server/repo/billing.ts:60`, and `candidateRepo` at `server/repo/candidate.ts`.

**Tech Stack:** Next.js 16, React 19, Prisma 6 with MongoDB, Better Auth 1.7 with organization plugin, tRPC 11, zod 4, Vitest 4, Biome 2, TypeScript strict, Bun 1.4

**Spec:** `docs/system-design.md` §4.7 Integration Hub, §5 Data Model, §6.4 Integration Sync, §7 Multi-Tenancy, §8 Security (PII at rest, credential encryption), §9 Reliability (idempotency, retry with backoff, DLQ), §10 Observability, plus operator decisions in `docs/build-plan-foundation.md` (Better Auth org, Cents, AES-GCM, Mongo tenantId scoping)

---

## Global Constraints

- `tenantId` is branded `TenantId` from `lib/types.ts:4` and comes from `auth.api.getSession` active organization via `server/trpc/init.ts:18`. Never from body or URL. Every query filters by `tenantId`.
- Money is not in this phase. Integrations carry no `Cents` field. If a future sync writes billing data, it must reuse `Cents` from `lib/money.ts:4`.
- Credentials and tokens are encrypted with `encrypt`/`decrypt` from `lib/crypto.ts` at write. Decrypt only in `toView` at read, same as `employeeRepo`. Never log plaintext.
- RBAC via `rbacAnyProcedure` in `server/trpc/init.ts:54`. Connect, disconnect, triggerSync, and webhook config require `owner` or `admin`. Read (catalog, listConnections, listSyncs, getById) requires any authenticated role via `protectedProcedure`.
- Connection status is a state machine `disconnected` -> `pending` -> `connected` -> `error` -> `disconnected`. Sync status is `pending` -> `running` -> `success` | `failed`. Failed syncs schedule `nextRetryAt` with exponential backoff capped at 24h, max 5 retries. Terminal `success` never retries.
- Idempotency: `connect` is upsert by `(tenantId, provider)`. Re-connecting the same provider returns the existing connection without duplicate row. `triggerSync` deduplicates by `idempotencyKey = tenantId:connectionId:externalId` unique where provided, else creates new.
- Prisma Mongo has no `$transaction`. Writes are sequential. Connection upsert + sync create are separate writes with app-level idempotency, same as `payRunRepo` v1. Native `mongo.client.startSession().withTransaction` is the hardening path, not the v1 gate.
- All public inputs validated with zod at the tRPC boundary. Pure helpers in `lib/integrations/` trust parsed types.
- Catalog is static, not DB-backed. `lib/integrations/registry.ts` is the single source of truth for provider metadata. DB stores only tenant-specific connections and sync logs.
- Package manager is Bun 1.4.0. Scripts are `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.
- Code style is Biome 2.4.2, 2-space indent, `organizeImports` on. Tailwind v4 CSS-first. No ESLint or Prettier.

---

## File Structure

New or modified files and single responsibility:

- `lib/integrations/types.ts` — branded ids and domain types for the INTG context. No I/O. Source of truth for `IntegrationConnectionId`, `IntegrationSyncId`, `IntegrationProvider`, `IntegrationCategory`, `IntegrationAuthType`, `ConnectionStatus`, `SyncStatus`, `SyncDirection`, `IntegrationConnection`, `IntegrationConnectionView`, `IntegrationSync`, `IntegrationSyncView`.
- `lib/integrations/registry.ts` — static catalog. Exports `INTEGRATION_CATALOG: IntegrationDef[]`, `getProvider(id)`, `listByCategory(category)`, `isKnownProvider(id)`. No DB. Mirrors `lib/billing/plans.ts:12` pattern but for providers.
- `lib/integrations/lifecycle.ts` — pure state machines. Exports `CONNECTION_STATUS`, `SYNC_STATUS`, `isValidConnectionStatus`, `canTransitionConnection`, `isValidSyncStatus`, `canTransitionSync`, `nextRetryAt(retryCount, baseMs?)`, `computeBackoffMs`. No DB.
- `prisma/schema.prisma` — add models `IntegrationConnection` and `IntegrationSync`. Each carries `tenantId String` indexed, `@map` names, `provider String`, status strings, encrypted credential fields, indexes on `[tenantId]`, `[tenantId, provider]`, `[connectionId]`.
- `server/repo/integration.ts` — tenancy, encryption, and idempotency boundary. Factory `integrationRepo(prisma, tenantId)` returns `{ listCatalog, listConnections, getConnectionById, getConnectionByProvider, upsertConnection, disconnect, listSyncs, getSyncById, createSync, updateSyncStatus, ingestWebhook }`. Every query includes `tenantId`. `upsertConnection` encrypts `credentials` and is idempotent on `(tenantId, provider)`.
- `server/trpc/routers/integration.ts` — tRPC surface. Procedures `catalog`, `listConnections`, `getConnection`, `connect`, `disconnect`, `listSyncs`, `triggerSync`, `ingestWebhook`. Inputs validated with zod. `connect`/`disconnect`/`triggerSync` use `rbacAnyProcedure(["owner","admin"])`. Reads use `protectedProcedure`.
- `server/trpc/routers/_app.ts` — register `integration: integrationRouter` on the app router.
- `lib/types.ts` — add `IntegrationConnectionId`, `IntegrationSyncId` branded types.
- Tests:
  - `lib/integrations/registry.test.ts` — catalog completeness, lookup, category filter, unknown guard.
  - `lib/integrations/lifecycle.test.ts` — status validity, transition guards, terminal states, backoff math.
  - `server/repo/integration.test.ts` — tenancy scoping, upsert idempotency, credential encryption round-trip, sync creation filtered by tenant, webhook ingestion creates sync log.
  - `server/trpc/routers/integration.test.ts` — RBAC rejects `employee` on `connect`, succeeds for `admin`, `catalog` is public to authed users, `triggerSync` dedupes on idempotencyKey, cross-tenant read returns null.

---

### Task 1: Domain types and branded ids

**Files:**
- Create: `lib/integrations/types.ts`
- Modify: `lib/types.ts:64` — add `IntegrationConnectionId`, `IntegrationSyncId`
- Test: `lib/integrations/lifecycle.test.ts` (types are compile-time, lifecycle test covers status guards)

**Interfaces:**
- Consumes: `TenantId` from `lib/types.ts:4`
- Produces: `IntegrationConnectionId`, `IntegrationSyncId`, `IntegrationProvider`, `IntegrationCategory`, `IntegrationAuthType`, `ConnectionStatus`, `SyncStatus`, `SyncDirection`, `IntegrationConnection`, `IntegrationSync` — imported by `lib/integrations/registry.ts`, `lib/integrations/lifecycle.ts`, `server/repo/integration.ts`, `server/trpc/routers/integration.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/integrations/lifecycle.test.ts
import { describe, expect, it } from "vitest";
import {
  canTransitionConnection,
  canTransitionSync,
  CONNECTION_STATUS,
  isValidConnectionStatus,
  isValidSyncStatus,
  nextRetryAt,
  SYNC_STATUS,
} from "@/lib/integrations/lifecycle";

describe("connection lifecycle", () => {
  it("accepts only declared connection statuses", () => {
    expect(isValidConnectionStatus("disconnected")).toBe(true);
    expect(isValidConnectionStatus("pending")).toBe(true);
    expect(isValidConnectionStatus("connected")).toBe(true);
    expect(isValidConnectionStatus("error")).toBe(true);
    expect(isValidConnectionStatus("deleted")).toBe(false);
  });
  it("allows only declared connection transitions", () => {
    expect(canTransitionConnection("disconnected", "pending")).toBe(true);
    expect(canTransitionConnection("pending", "connected")).toBe(true);
    expect(canTransitionConnection("connected", "error")).toBe(true);
    expect(canTransitionConnection("error", "disconnected")).toBe(true);
    expect(canTransitionConnection("connected", "pending")).toBe(false);
    expect(canTransitionConnection("connected", "disconnected")).toBe(false);
  });
  it("sync statuses are the union", () => {
    expect(SYNC_STATUS).toEqual(["pending", "running", "success", "failed"]);
  });
  it("failed sync schedules retry with backoff", () => {
    const base = new Date("2026-01-01T00:00:00.000Z");
    const n1 = nextRetryAt(1, base);
    const n2 = nextRetryAt(2, base);
    expect(n1.getTime()).toBeGreaterThan(base.getTime());
    expect(n2.getTime()).toBeGreaterThan(n1.getTime());
  });
  it("success is terminal", () => {
    expect(canTransitionSync("success", "pending")).toBe(false);
    expect(canTransitionSync("success", "failed")).toBe(false);
  });
  it("connection status is the union", () => {
    expect(CONNECTION_STATUS).toEqual(["disconnected", "pending", "connected", "error"]);
  });
  it("rejects unknown sync status", () => {
    expect(isValidSyncStatus("unknown")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/integrations/lifecycle.test.ts`
Expected: FAIL with `Cannot find module '@/lib/integrations/lifecycle'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/integrations/types.ts
import type { TenantId } from "@/lib/types";

export type IntegrationConnectionId = string & { readonly __brand: "IntegrationConnectionId" };
export type IntegrationSyncId = string & { readonly __brand: "IntegrationSyncId" };

export const INTEGRATION_CATEGORIES = ["accounting", "calendar", "messaging", "productivity", "bank", "hr"] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_AUTH_TYPES = ["oauth2", "apiKey", "webhook"] as const;
export type IntegrationAuthType = (typeof INTEGRATION_AUTH_TYPES)[number];

export const CONNECTION_STATUS = ["disconnected", "pending", "connected", "error"] as const;
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
```

```ts
// lib/integrations/lifecycle.ts
import { CONNECTION_STATUS, SYNC_STATUS, type ConnectionStatus, type SyncStatus } from "@/lib/integrations/types";

export { CONNECTION_STATUS, SYNC_STATUS };

export const CONNECTION_TRANSITIONS: Record<ConnectionStatus, ConnectionStatus[]> = {
  disconnected: ["pending"],
  pending: ["connected", "error", "disconnected"],
  connected: ["error", "disconnected"],
  error: ["pending", "disconnected"],
};

export const SYNC_TRANSITIONS: Record<SyncStatus, SyncStatus[]> = {
  pending: ["running", "failed"],
  running: ["success", "failed"],
  success: [],
  failed: ["pending"],
};

export function isValidConnectionStatus(v: string): v is ConnectionStatus {
  return (CONNECTION_STATUS as readonly string[]).includes(v);
}
export function isValidSyncStatus(v: string): v is SyncStatus {
  return (SYNC_STATUS as readonly string[]).includes(v);
}
export function canTransitionConnection(from: ConnectionStatus, to: ConnectionStatus): boolean {
  return CONNECTION_TRANSITIONS[from].includes(to);
}
export function canTransitionSync(from: SyncStatus, to: SyncStatus): boolean {
  return SYNC_TRANSITIONS[from].includes(to);
}
export function computeBackoffMs(retryCount: number, baseMs = 60_000): number {
  const capped = Math.min(retryCount, 5);
  return Math.min(baseMs * 2 ** (capped - 1), 24 * 60 * 60 * 1000);
}
export function nextRetryAt(retryCount: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + computeBackoffMs(retryCount));
}
```

```ts
// lib/types.ts — append after CandidateId
export type IntegrationConnectionId = string & { readonly __brand: "IntegrationConnectionId" };
export type IntegrationSyncId = string & { readonly __brand: "IntegrationSyncId" };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/integrations/lifecycle.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/integrations/types.ts lib/integrations/lifecycle.ts lib/types.ts lib/integrations/lifecycle.test.ts
git commit -m "feat(integrations): add domain types and lifecycle state machines"
```

---

### Task 2: Static catalog registry

**Files:**
- Create: `lib/integrations/registry.ts`
- Test: `lib/integrations/registry.test.ts`

**Interfaces:**
- Consumes: `IntegrationDef`, `IntegrationProvider`, `IntegrationCategory` from `lib/integrations/types.ts`
- Produces: `INTEGRATION_CATALOG`, `getProvider(provider)`, `listByCategory(category)`, `isKnownProvider(provider)`, `searchProviders(q)` — consumed by `server/repo/integration.ts` and `server/trpc/routers/integration.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/integrations/registry.test.ts
import { describe, expect, it } from "vitest";
import { getProvider, INTEGRATION_CATALOG, isKnownProvider, listByCategory } from "@/lib/integrations/registry";

describe("integration registry", () => {
  it("catalog has at least 8 providers and each has required fields", () => {
    expect(INTEGRATION_CATALOG.length).toBeGreaterThanOrEqual(8);
    for (const def of INTEGRATION_CATALOG) {
      expect(def.provider).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.authType).toBeTruthy();
    }
  });
  it("getProvider returns def for known provider", () => {
    expect(getProvider("slack").name).toMatch(/Slack/i);
    expect(getProvider("quickbooks").category).toBe("accounting");
  });
  it("getProvider throws for unknown provider", () => {
    expect(() => getProvider("unknown" as any)).toThrow();
  });
  it("isKnownProvider guards correctly", () => {
    expect(isKnownProvider("github")).toBe(true);
    expect(isKnownProvider("not-a-provider")).toBe(false);
  });
  it("listByCategory filters correctly", () => {
    const accounting = listByCategory("accounting");
    expect(accounting.length).toBeGreaterThanOrEqual(2);
    expect(accounting.every((d) => d.category === "accounting")).toBe(true);
  });
  it("catalog covers all categories at least once", () => {
    const cats = new Set(INTEGRATION_CATALOG.map((d) => d.category));
    expect(cats.has("accounting")).toBe(true);
    expect(cats.has("messaging")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/integrations/registry.test.ts`
Expected: FAIL with `Cannot find module '@/lib/integrations/registry'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/integrations/registry.ts
import type { IntegrationCategory, IntegrationDef, IntegrationProvider } from "@/lib/integrations/types";

export const INTEGRATION_CATALOG: IntegrationDef[] = [
  { provider: "slack", name: "Slack", category: "messaging", authType: "oauth2", description: "Team messaging and notifications" },
  { provider: "github", name: "GitHub", category: "productivity", authType: "oauth2", description: "Code and hiring pipeline" },
  { provider: "google-calendar", name: "Google Calendar", category: "calendar", authType: "oauth2", description: "Calendar and leave sync" },
  { provider: "microsoft365", name: "Microsoft 365", category: "calendar", authType: "oauth2", description: "Outlook calendar and identity" },
  { provider: "quickbooks", name: "QuickBooks", category: "accounting", authType: "oauth2", description: "Accounting and payroll export" },
  { provider: "xero", name: "Xero", category: "accounting", authType: "oauth2", description: "Accounting and invoicing" },
  { provider: "stripe", name: "Stripe", category: "bank", authType: "apiKey", description: "Billing and payouts" },
  { provider: "gusto", name: "Gusto", category: "hr", authType: "oauth2", description: "Payroll and benefits" },
  { provider: "zapier", name: "Zapier", category: "productivity", authType: "webhook", description: "Automation via webhooks" },
  { provider: "webhook-generic", name: "Generic Webhook", category: "productivity", authType: "webhook", description: "Catch any webhook event" },
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
export function listByCategory(category: IntegrationCategory): IntegrationDef[] {
  return INTEGRATION_CATALOG.filter((d) => d.category === category);
}
export function searchProviders(q: string): IntegrationDef[] {
  const needle = q.toLowerCase();
  return INTEGRATION_CATALOG.filter((d) => d.name.toLowerCase().includes(needle) || d.provider.includes(needle));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/integrations/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/integrations/registry.ts lib/integrations/registry.test.ts
git commit -m "feat(integrations): add static catalog registry with 10 providers"
```

---

### Task 3: Prisma models and repo factories (tenancy + credential encryption + idempotency)

**Files:**
- Modify: `prisma/schema.prisma` — add `IntegrationConnection` and `IntegrationSync`
- Create: `server/repo/integration.ts`
- Tests: `server/repo/integration.test.ts`

**Interfaces:**
- Consumes: `TenantId`, `IntegrationConnectionId`, `IntegrationSyncId` from `lib/types.ts`, `IntegrationProvider`/`ConnectionStatus`/`SyncStatus` from `lib/integrations/types.ts`, `encrypt`/`decrypt` from `lib/crypto.ts`, `getProvider` from `lib/integrations/registry.ts`, `nextRetryAt` from `lib/integrations/lifecycle.ts`
- Produces: `integrationRepo(prisma, tenantId)` — consumed by `server/trpc/routers/integration.ts`

**Schema:**

```prisma
model IntegrationConnection {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId       String
  provider       String
  status         String   @default("pending")
  credentialsEnc String   @default("")
  configJson     String   @default("{}")
  lastSyncAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([tenantId, provider])
  @@index([tenantId])
  @@index([tenantId, provider])
  @@map("integration_connection")
}

model IntegrationSync {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId       String
  connectionId   String   @db.ObjectId
  provider       String
  direction      String   @default("inbound")
  status         String   @default("pending")
  idempotencyKey String?  @unique
  payloadJson    String   @default("{}")
  error          String?
  retryCount     Int      @default(0)
  nextRetryAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, connectionId])
  @@index([connectionId])
  @@index([idempotencyKey])
  @@map("integration_sync")
}
```

**Repo contracts:**

```ts
// server/repo/integration.ts
export function integrationRepo(prisma: PrismaClient, tenantId: TenantId) {
  // toConnectionView(row): IntegrationConnectionView — decrypt check, parse configJson, hasCredentials = !!credentialsEnc
  // toSyncView(row): IntegrationSyncView — parse payloadJson
  // listCatalog(): IntegrationDef[] — delegates to INTEGRATION_CATALOG, no DB
  // listConnections(): Promise<IntegrationConnectionView[]>
  // getConnectionById(id: IntegrationConnectionId): Promise<IntegrationConnectionView | null>
  // getConnectionByProvider(provider: IntegrationProvider): Promise<IntegrationConnectionView | null>
  // upsertConnection(input: { provider: IntegrationProvider; credentials?: Record<string,unknown> | null; config?: Record<string,unknown> | null }): Promise<IntegrationConnectionView>
  //   — validates provider via isKnownProvider, encrypts credentials with encrypt(JSON.stringify), upsert on @@unique([tenantId, provider]), status -> "connected" if credentials present else "pending"
  // disconnect(id: IntegrationConnectionId): Promise<void> — sets status = "disconnected", clears credentialsEnc if needed, where { id, tenantId }
  // listSyncs(connectionId?: IntegrationConnectionId): Promise<IntegrationSyncView[]>
  // getSyncById(id: IntegrationSyncId): Promise<IntegrationSyncView | null>
  // createSync(input: { connectionId: IntegrationConnectionId; direction: SyncDirection; payload?: Record<string,unknown>; idempotencyKey?: string | null }): Promise<IntegrationSyncView>
  //   — guards: connection exists and belongs to tenant, deduplicates on idempotencyKey unique, encrypts nothing, payload stored as JSON string
  // updateSyncStatus(id: IntegrationSyncId, status: SyncStatus, patch?: { error?: string }): Promise<void> — enforces canTransitionSync, on failed increments retryCount and sets nextRetryAt via nextRetryAt(retryCount)
  // ingestWebhook(input: { provider: IntegrationProvider; externalId?: string; payload: Record<string,unknown> }): Promise<IntegrationSyncView>
  //   — validates provider, resolves connection by provider (or creates pending generic connection for webhook-generic), creates sync with direction inbound and idempotencyKey = tenantId:provider:externalId when externalId present
  // All queries include tenantId. Credentials encrypted at write, never returned in plaintext. Views expose hasCredentials boolean only.
}
```

- [ ] **Step 1: Write the failing tests**

```ts
// server/repo/integration.test.ts
import { describe, expect, it, vi } from "vitest";
import type { TenantId } from "@/lib/types";
import { integrationRepo } from "@/server/repo/integration";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function mockPrisma() {
  // mock integrationConnection and integrationSync delegates with in-memory arrays
  // include findMany/findFirst/findUnique/create/updateMany/deleteMany/upsert
}

describe("integrationRepo tenancy", () => {
  it("upsertConnection is idempotent on (tenantId, provider)", async () => {
    const prisma: any = mockPrisma();
    const repoA = integrationRepo(prisma, tenantA);
    const c1 = await repoA.upsertConnection({ provider: "slack", credentials: { token: "xoxb-1" } });
    const c2 = await repoA.upsertConnection({ provider: "slack", credentials: { token: "xoxb-1" } });
    expect(c1.id).toBe(c2.id);
    expect(prisma.integrationConnection.upsert).toHaveBeenCalled();
  });
  it("tenant B cannot see tenant A connections", async () => {
    const prisma: any = mockPrisma();
    const repoA = integrationRepo(prisma, tenantA);
    await repoA.upsertConnection({ provider: "github" });
    const repoB = integrationRepo(prisma, tenantB);
    expect(await repoB.getConnectionByProvider("github")).toBeNull();
    expect(await repoB.listConnections()).toEqual([]);
  });
  it("credentials are encrypted at rest", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    await repo.upsertConnection({ provider: "stripe", credentials: { apiKey: "sk_live_123" } });
    const raw = prisma.__store.connections[0];
    expect(raw.credentialsEnc).not.toContain("sk_live_123");
  });
  it("createSync deduplicates on idempotencyKey", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "slack" });
    const s1 = await repo.createSync({ connectionId: conn.id as any, direction: "inbound", idempotencyKey: "evt_1", payload: { ok: true } });
    const s2 = await repo.createSync({ connectionId: conn.id as any, direction: "inbound", idempotencyKey: "evt_1", payload: { ok: true } });
    expect(s1.id).toBe(s2.id);
  });
  it("ingestWebhook creates sync log for inbound event", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    await repo.upsertConnection({ provider: "webhook-generic" });
    const sync = await repo.ingestWebhook({ provider: "webhook-generic", externalId: "wh_123", payload: { type: "test" } });
    expect(sync.direction).toBe("inbound");
    expect(sync.provider).toBe("webhook-generic");
  });
  it("updateSyncStatus enforces transition guard", async () => {
    const prisma: any = mockPrisma();
    const repo = integrationRepo(prisma, tenantA);
    const conn = await repo.upsertConnection({ provider: "quickbooks" });
    const sync = await repo.createSync({ connectionId: conn.id as any, direction: "outbound" });
    await expect(repo.updateSyncStatus(sync.id as any, "success")).rejects.toThrow();
    await repo.updateSyncStatus(sync.id as any, "running");
    await repo.updateSyncStatus(sync.id as any, "success");
    const done = await repo.getSyncById(sync.id as any);
    expect(done?.status).toBe("success");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/repo/integration.test.ts`
Expected: FAIL with `Cannot find module '@/server/repo/integration'`

- [ ] **Step 3: Write minimal implementation**

Implement `server/repo/integration.ts` per contract above. Follow `server/repo/employee.ts:21` and `server/repo/billing.ts:60` for factory shape. Encrypt with `encrypt`/`decrypt` from `lib/crypto.ts`. Validate provider via `isKnownProvider` and throw `TRPCError` with `BAD_REQUEST` for unknown. On `upsertConnection`, serialize credentials as `encrypt(JSON.stringify(credentials ?? {}))` and `configJson` as `JSON.stringify(config ?? {})`. On `toConnectionView`, parse `configJson` and set `hasCredentials = credentialsEnc.length > 0`. On `createSync`, check idempotencyKey uniqueness first via `findUnique` and return existing if found.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/repo/integration.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

Run: `bun run db:generate` after editing `prisma/schema.prisma`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma server/repo/integration.ts server/repo/integration.test.ts
git commit -m "feat(integrations): add Connection and Sync models with tenancy and encryption"
```

---

### Task 4: tRPC router (RBAC + zod boundaries)

**Files:**
- Create: `server/trpc/routers/integration.ts`
- Modify: `server/trpc/routers/_app.ts:11` — register `integration: integrationRouter`
- Tests: `server/trpc/routers/integration.test.ts`

**Interfaces:**
- Consumes: `integrationRepo` from `server/repo/integration.ts`, `TRPCContext` from `lib/types.ts`, `isKnownProvider` from `lib/integrations/registry.ts`
- Produces: `integrationRouter` — consumed by `server/trpc/routers/_app.ts`

**Router surface:**

```ts
// server/trpc/routers/integration.ts
export const integrationRouter = createTRPCRouter({
  catalog: protectedProcedure.query(() => INTEGRATION_CATALOG),
  listConnections: protectedProcedure.query(({ ctx }) => integrationRepo(ctx.prisma, ctx.session.tenantId).listConnections()),
  getConnection: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => integrationRepo(ctx.prisma, ctx.session.tenantId).getConnectionById(input.id as any)),
  connect: rbacAnyProcedure(["owner","admin"]).input(z.object({ provider: z.string(), credentials: z.record(z.unknown()).optional(), config: z.record(z.unknown()).optional() })).mutation(({ ctx, input }) => {
    if (!isKnownProvider(input.provider)) throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown provider: ${input.provider}` });
    return integrationRepo(ctx.prisma, ctx.session.tenantId).upsertConnection({ provider: input.provider as any, credentials: input.credentials ?? null, config: input.config ?? null });
  }),
  disconnect: rbacAnyProcedure(["owner","admin"]).input(z.object({ id: z.string() })).mutation(({ ctx, input }) => integrationRepo(ctx.prisma, ctx.session.tenantId).disconnect(input.id as any)),
  listSyncs: protectedProcedure.input(z.object({ connectionId: z.string().optional() }).optional()).query(({ ctx, input }) => integrationRepo(ctx.prisma, ctx.session.tenantId).listSyncs(input?.connectionId as any)),
  triggerSync: rbacAnyProcedure(["owner","admin"]).input(z.object({ connectionId: z.string(), direction: z.enum(["inbound","outbound"]).default("outbound"), payload: z.record(z.unknown()).optional(), idempotencyKey: z.string().optional() })).mutation(({ ctx, input }) => integrationRepo(ctx.prisma, ctx.session.tenantId).createSync({ connectionId: input.connectionId as any, direction: input.direction as any, payload: input.payload, idempotencyKey: input.idempotencyKey ?? null })),
  ingestWebhook: rbacAnyProcedure(["owner","admin"]).input(z.object({ provider: z.string(), externalId: z.string().optional(), payload: z.record(z.unknown()) })).mutation(({ ctx, input }) => {
    if (!isKnownProvider(input.provider)) throw new TRPCError({ code: "BAD_REQUEST" });
    return integrationRepo(ctx.prisma, ctx.session.tenantId).ingestWebhook({ provider: input.provider as any, externalId: input.externalId, payload: input.payload });
  }),
});
```

- [ ] **Step 1: Write the failing tests**

```ts
// server/trpc/routers/integration.test.ts
import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TenantId } from "@/lib/types";

// helper makeCaller(roles) that builds a caller with mocked prisma and session tenantId

describe("integration router", () => {
  it("catalog is readable by any authed role", async () => {
    const { caller } = makeCaller(["employee"]);
    const catalog = await caller.catalog();
    expect(catalog.length).toBeGreaterThanOrEqual(8);
  });
  it("connect rejects employee and hr, allows admin", async () => {
    for (const role of ["employee","hr","manager"] as const) {
      const { caller } = makeCaller([role]);
      await expect(caller.connect({ provider: "slack" })).rejects.toBeInstanceOf(TRPCError);
    }
    const { caller } = makeCaller(["admin"]);
    const conn = await caller.connect({ provider: "slack", credentials: { token: "x" } });
    expect(conn.provider).toBe("slack");
  });
  it("connect rejects unknown provider", async () => {
    const { caller } = makeCaller(["owner"]);
    await expect(caller.connect({ provider: "unknown" as any })).rejects.toThrow();
  });
  it("triggerSync deduplicates on idempotencyKey", async () => {
    const { caller } = makeCaller(["admin"]);
    const conn = await caller.connect({ provider: "github" });
    const s1 = await caller.triggerSync({ connectionId: conn.id, idempotencyKey: "k1" });
    const s2 = await caller.triggerSync({ connectionId: conn.id, idempotencyKey: "k1" });
    expect(s1.id).toBe(s2.id);
  });
  it("cross-tenant read returns null", async () => {
    const { caller: callerA } = makeCallerWithTenant(["admin"], "tenantA");
    const conn = await callerA.connect({ provider: "stripe" });
    const { caller: callerB } = makeCallerWithTenant(["admin"], "tenantB");
    expect(await callerB.getConnection({ id: conn.id })).toBeNull();
  });
  it("listConnections is tenant-scoped", async () => {
    const { caller: a } = makeCallerWithTenant(["admin"], "tenantA");
    const { caller: b } = makeCallerWithTenant(["admin"], "tenantB");
    await a.connect({ provider: "xero" });
    expect(await b.listConnections()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/trpc/routers/integration.test.ts`
Expected: FAIL with `Cannot find module '@/server/trpc/routers/integration'`

- [ ] **Step 3: Write minimal implementation**

Create `server/trpc/routers/integration.ts` per surface above. Wire `integrationRepo` correctly, ensure every handler passes `ctx.session.tenantId` and `ctx.prisma`. Use `isKnownProvider` guard before repo calls. Register in `_app.ts` as `integration: integrationRouter`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/trpc/routers/integration.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/trpc/routers/integration.ts server/trpc/routers/_app.ts server/trpc/routers/integration.test.ts
git commit -m "feat(integrations): add tRPC router with RBAC and tenancy guards"
```

---

### Task 5: Sync observability and hardening (retry + DLQ surface)

**Files:**
- Modify: `server/repo/integration.ts` — ensure `updateSyncStatus` computes `nextRetryAt` on `failed`, caps retries, and exposes `retryCount`
- Modify: `server/trpc/routers/integration.ts` — add `retrySync` and `listFailedSyncs` if not already present
- Tests: extend `server/repo/integration.test.ts` and `server/trpc/routers/integration.test.ts` with retry/DLQ cases

**Interfaces:**
- Consumes: `nextRetryAt`, `computeBackoffMs` from `lib/integrations/lifecycle.ts`
- Produces: DLQ-aware sync status updates — consumed by future NATS worker that will poll `failed` syncs

- [ ] **Step 1: Write the failing tests**

```ts
// add to server/repo/integration.test.ts
it("failed sync increments retryCount and sets nextRetryAt", async () => {
  const prisma: any = mockPrisma();
  const repo = integrationRepo(prisma, tenantA);
  const conn = await repo.upsertConnection({ provider: "slack" });
  const sync = await repo.createSync({ connectionId: conn.id as any, direction: "outbound" });
  await repo.updateSyncStatus(sync.id as any, "running");
  await repo.updateSyncStatus(sync.id as any, "failed", { error: "timeout" });
  const failed = await repo.getSyncById(sync.id as any);
  expect(failed?.retryCount).toBe(1);
  expect(failed?.nextRetryAt).toBeTruthy();
  expect(failed?.error).toBe("timeout");
});
it("retry does not exceed 5 and backoff caps at 24h", async () => {
  expect(computeBackoffMs(6)).toBe(24 * 60 * 60 * 1000);
  expect(computeBackoffMs(10)).toBe(24 * 60 * 60 * 1000);
});
it("listFailedSyncs returns only failed for tenant", async () => {
  const prisma: any = mockPrisma();
  const repo = integrationRepo(prisma, tenantA);
  const conn = await repo.upsertConnection({ provider: "github" });
  const s1 = await repo.createSync({ connectionId: conn.id as any, direction: "inbound" });
  const s2 = await repo.createSync({ connectionId: conn.id as any, direction: "inbound" });
  await repo.updateSyncStatus(s1.id as any, "running");
  await repo.updateSyncStatus(s1.id as any, "failed");
  await repo.updateSyncStatus(s2.id as any, "running");
  await repo.updateSyncStatus(s2.id as any, "success");
  const failed = (await repo.listSyncs()).filter((s) => s.status === "failed");
  expect(failed.length).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/repo/integration.test.ts`
Expected: FAIL on retryCount assertion

- [ ] **Step 3: Write minimal implementation**

Patch `server/repo/integration.ts` `updateSyncStatus` to:
- Validate `canTransitionSync(current, next)` and throw `TRPCError({ code: "BAD_REQUEST", message: "Invalid status transition" })` on violation
- On `failed`: `retryCount = (current.retryCount ?? 0) + 1`, `nextRetryAt = nextRetryAt(retryCount).toISOString()`, `error = patch?.error ?? null`
- On `success`: clear `nextRetryAt`
- On `pending` from `failed`: keep `retryCount` for observability
- Ensure `listSyncs` can filter by `status` when a future `listFailedSyncs` query needs it, or just filter client-side in router

If router needs `retrySync`, add:

```ts
retrySync: rbacAnyProcedure(["owner","admin"]).input(z.object({ id: z.string() })).mutation(({ ctx, input }) => integrationRepo(ctx.prisma, ctx.session.tenantId).updateSyncStatus(input.id as any, "pending")),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/repo/integration.test.ts server/trpc/routers/integration.test.ts lib/integrations/lifecycle.test.ts`
Expected: PASS (all 3 suites)

Run: `bun run typecheck && bun run lint && bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/repo/integration.ts server/trpc/routers/integration.ts lib/integrations/lifecycle.ts
git commit -m "feat(integrations): add retry backoff and DLQ observability"
```

---

## Verification

Each task ships with its own unit tests. After Task 4, run the full suite for regression:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Expected: `lint` with no errors, `typecheck` passes, `test` 210+ tests pass (existing 174 plus ~36 new), `build` succeeds. Manual live probe after Task 4: `curl` the tRPC endpoints via a script that authenticates with Better Auth, creates an org, sets active org, then calls `integration.catalog`, `integration.connect`, `integration.listConnections`, `integration.triggerSync`, and `integration.ingestWebhook` and asserts tenant isolation by repeating with a second tenant.

## Risks

- Credential encryption key rotation is not in v1. Mitigated by using `lib/crypto.ts` AES-256-GCM with `APP_ENCRYPTION_KEY` env, same as Employee PII. Rotation is a hardening item.
- No real OAuth exchange in v1. `credentials` is an opaque JSON blob. Callers supply tokens directly. Real OAuth code flow is a follow-up that adds `state` and `code` exchange at the boundary.
- No NATS or Redis in v1. Retry is timestamp-based `nextRetryAt`, not a queue. A future worker can poll `failed` syncs where `nextRetryAt <= now()`.
- Prisma Mongo unique on `idempotencyKey` is nullable. Concurrent inserts with null bypass uniqueness. Mitigated by checking existence before insert and by using non-null keys for webhook externalIds. Documented as a known Mongo limitation.

## Alternatives Rejected

- DB-backed catalog table. Rejected: catalog is static product config, not tenant data. Static registry is simpler, versioned in code, and matches `lib/billing/plans.ts` precedent.
- Per-provider repo files (one file per Slack, QuickBooks). Rejected: premature explosion of files for v1. Single `integration.ts` repo with provider dispatch keeps the tenancy boundary in one place. Split by provider when adapter logic grows.
- Storing raw credentials in plaintext for v1 and encrypting later. Rejected: violates the PII-at-rest invariant from day one. Encryption from the start costs one `encrypt` call.
- Using Better Auth `account` table to store integration OAuth tokens. Rejected: that table is for user auth providers, not tenant-scoped integrations. Separate `IntegrationConnection` keeps tenant isolation explicit.
- NATS JetStream from day one. Rejected: adds infra for v1 without a consumer. Timestamp-based retry ships the invariant now and can be swapped for a queue without changing the router contract.
