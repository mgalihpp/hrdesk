# Saasdesk Product Build Plan (Foundation → Hardening)

Delegation, lifecycle, isolation, history, and capability fallbacks follow `poteto-mode`.
This plan is the deliverable. No code is written until the operator gives an explicit go.

## What changes, for whom, and the rule it enforces

The landing page (`app/`) is a static, backend-free site. We turn the repo into a
full-stack SaaS: a Next.js monolith that serves the marketing page and a typed
tRPC API backed by MongoDB via Prisma, with **Better Auth** as the auth layer.

The rule this program enforces: every tenant-scoped record is isolated by
construction, and every money value is exact.

Operator decisions on 2026-08-27 (override `system-design.md` §13):

| Decision | §13 default | Your call |
|---|---|---|
| Backend | Node/NestJS | Next.js monolith + tRPC |
| Read layer | REST + GraphQL | tRPC only |
| Tenancy | Postgres + RLS | MongoDB + `tenantId` scoping |
| Auth | OIDC/OAuth2 | **Better Auth** (email/password + org plugin) |
| Tax locale | US-first | US-first (unchanged) |
| Message bus | NATS JetStream | NATS JetStream (unchanged) |
| Repo | separate services | monolith in this repo |

Auth note: the Better Auth MCP server returned Unauthorized in this environment, so
this plan is grounded from Better Auth docs via Context7 (v1.6.x). The operator
explicitly chose Better Auth, which replaces the hand-rolled argon2/JWT design.

## Adapted verification (read this)

The `multi-phase-plan` playbook assumes a pstack harness (`check-plan.mjs`,
10-lane swarm, control skills). This repo has none. Verification here is:

- `bun run lint` (Biome) — the existing gate.
- `bun run typecheck` (added): `tsc --noEmit`.
- `bun run test` (added): Vitest unit tests for Money math, tenant scoping, RBAC.
- Live proof: boot `bun run dev` and exercise tRPC + Better Auth endpoints with
  `curl`/`fetch`. No browser control skill for an API surface, so the live check is
  a scripted HTTP call. This fails closed on claims needing a UI.

A PR is verified only when lint, typecheck, unit, and the live HTTP check all pass.

## Architecture sketch (Foundation)

### Stack

- Next.js 16 (App Router) monolith. React 19 + React Compiler (already on).
- **Better Auth** for identity, sessions, and multi-tenant organizations/RBAC.
  `mongodbAdapter` for its data; `nextCookies()` for cookie handling in App Router.
- tRPC for the application API. No GraphQL.
- Prisma + MongoDB for domain models. Native `MongoClient` shared with Better Auth
  and used for multi-document pay-run transactions.
- NATS JetStream for async side-effects (payslip gen, notifications, sync).
- Bun 1.4.0, Biome, Vitest, TypeScript.

- Note: Prisma is deferred to PR-3. PR-1 uses the native Mongo client only; no
  domain models exist yet, so adding Prisma now would be premature.

### Core types (the domain, coded first)
- Files: `lib/money.ts`, `lib/tenant.ts`,
```ts
// Money is integer minor units. Mongo stores it as an integer, never a float.
export type Cents = number & { readonly __brand: "Cents" };
export const cents = (n: number): Cents => {
  if (!Number.isInteger(n)) throw new Error("Money must be integer cents");
  return n as Cents;
};
export const moneyAdd = (a: Cents, b: Cents): Cents => cents(a + b);
export const moneySub = (a: Cents, b: Cents): Cents => cents(a - b);
export const moneyGte = (a: Cents, b: Cents): boolean => a >= b;

// TenantId is branded. It comes from Better Auth's activeOrganizationId,
// never from client input.
export type TenantId = string & { readonly __brand: "TenantId" };

export type Role =
  | "owner" | "admin" | "manager" | "hr" | "employee" | "payrollAdmin";

export interface SessionUser {
  id: string;
  tenantId: TenantId;
  roles: Role[];
}
export interface TRPCContext {
  session: SessionUser | null;
  db: PrismaClient;
  mongo: Db; // native client: Better Auth + multi-doc transactions
}
```

### Auth and RBAC (Better Auth, not hand-rolled)

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { client } from "@/lib/mongo";

const ac = createAccessControl({
  employee: ["create", "read", "update", "delete"],
  payroll: ["run", "read", "adjust"],
  org: ["read", "update", "invite"],
} as const);

const owner = ac.newRole({ employee: ["create","read","update","delete"], payroll: ["run","read","adjust"], org: ["read","update","invite"] });
const admin = ac.newRole({ employee: ["create","read","update","delete"], payroll: ["read"], org: ["read","update","invite"] });
const hr = ac.newRole({ employee: ["create","read","update","delete"], payroll: ["read"], org: ["read"] });
const manager = ac.newRole({ employee: ["read","update"], payroll: ["read"], org: ["read"] });
const employee = ac.newRole({ employee: ["read"], payroll: ["read"], org: ["read"] });
const payrollAdmin = ac.newRole({ employee: ["read"], payroll: ["run","read","adjust"], org: ["read"] });

export const auth = betterAuth({
  database: mongodbAdapter(client),
  emailAndPassword: { enabled: true },
  plugins: [
    organization({ ac, roles: { owner, admin, hr, manager, employee, payrollAdmin } }),
    nextCookies(), // must be the last plugin
  ],
});
```

Route mount:

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

tRPC bridge: the session is sourced from Better Auth, so `tenantId` is the active
organization and `roles` is the org member role.

```ts
// server/trpc/init.ts
import { auth } from "@/lib/auth";
export const createTRPCContext = async ({ headers }: { headers: Headers }) => {
  const s = await auth.api.getSession({ headers });
  return {
    session: s?.session.activeOrganizationId
      ? { id: s.user.id, tenantId: s.session.activeOrganizationId as TenantId, roles: [s.member?.role] }
      : null,
  };
};
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { session: ctx.session } });
});
export const rbacProcedure = (role: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.session.roles.includes(role)) throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
  });
```

The Better Auth organization plugin owns tenant identity and role assignment
(`/organization/create`, `/organization/update-member-role`, `/organization/set-active`,
`/organization/list`). We keep a thin `Tenant` domain collection only for SaaS
settings (plan, tax_locale, branding) keyed by the same org id.

### Tenancy enforcement (replaces RLS)

MongoDB has no row-level security. The `tenantId` is injected by the repository
factory from the Better Auth session and is not a parameter the caller controls.

```ts
// tenantId comes from the session, never from the request body or URL.
export function tenantCollection<T extends { tenantId: TenantId }>(
  mongo: Db, name: string, tenantId: TenantId,
) {
  const col = mongo.collection<T>(name);
  return {
    findMany: (f: Filter<T> = {}) => col.find({ ...f, tenantId }).toArray(),
    findOne:  (f: Filter<T> = {}) => col.findOne({ ...f, tenantId }),
    insertOne: (doc: Omit<T, "_id" | "tenantId">) =>
      col.insertOne({ ...doc, tenantId } as T),
    // updateOne / deleteOne force tenantId into the filter and the update's $set
  };
}
```

Every tenant router receives `ctx.session.tenantId` and goes through
`tenantCollection`. Cross-tenant visibility is impossible by construction.

### PII encryption

SSN and bank details are encrypted at write with AES-256-GCM using a key from
`APP_ENCRYPTION_KEY` (env; upgrade path to KMS later). A small `crypto` module
encrypts/decrypts server-side only. Mongo has no column-level encryption, so this
is app-layer.

### Payroll atomicity

`runPayroll(inputs): PayRunResult` is a pure TS function over `Cents` (no I/O).
Persisting a run writes `pay_run` + `pay_item[]` + `payslip[]` atomically. Prisma 8
does not support MongoDB transactions, so the persistence path uses the native
driver session (the same `client` Better Auth uses):

```ts
const session = mongo.client.startSession();
await session.withTransaction(async () => {
  // insert pay_run, pay_items, payslips, all with { session }
});
```

This is the one place that bypasses Prisma's type safety, so it has its own tests.

## Program PR sequence

### Phase 1. Foundation

**PR-1. Backend substrate and invariants.** (independent, first)
- Files: `lib/money.ts`, `lib/tenant.ts`,
  `lib/crypto.ts`, `lib/mongo.ts` (shared `MongoClient`), `server/trpc/init.ts`,
  `app/api/trpc/[trpc]/route.ts`, `vitest.config.ts`, `.github/workflows/ci.yml`,
  `package.json` scripts (test, typecheck).
- Build: tRPC route handler returning a health ping; `Money`
  helpers; `tenantCollection` factory; CI runs lint + typecheck + test.
- Verify, unit: `money.ts` add/sub/gte and integer guard; `tenantCollection`
  injects `tenantId` and rejects a caller-supplied one.
- Verify, live: `curl /api/trpc/health` returns pong.
- Review gate: none (no interaction change).

**PR-2. Better Auth: identity, tenancy, RBAC.** (after PR-1)
- Files: `lib/auth.ts`, `app/api/auth/[...all]/route.ts`, `server/trpc/init.ts`
  (session bridge), `lib/auth-client.ts` (Better Auth React client, optional for now).
- Build: `betterAuth` with `mongodbAdapter`, `organization` plugin (the six roles
  above), `nextCookies()`. Mount the catch-all route. Bridge `auth.api.getSession`
  into tRPC `protectedProcedure`/`rbacProcedure`.
- Verify, unit: `rbacProcedure("owner")` rejects a non-owner session; an absent
  session throws UNAUTHORIZED (use a mocked Better Auth session).
- Verify, live: register a user, `auth.api` sign-in sets the cookie, create an
  organization, `set-active`, then `GET /api/trpc/...me` (or a probe router) returns
  the active org id as `tenantId`.
- Review gate: none.

**PR-3. Organization + Employee.** (after PR-2)
- Files: `prisma/schema.prisma` (provider mongodb) with `Tenant` + `Employee` models, `Employee` (PII encrypted fields, comp as `Cents`),
  `Tenant` settings doc, routers `org`, `employee` using the Prisma client (`ctx.prisma`); the native Mongo driver stays only for Better Auth and future pay-run transactions.
- Build: CRUD scoped by `ctx.session.tenantId`; RBAC on write (hr/admin);
  PII encrypt at write, decrypt at read (server only).
- Verify, unit: an employee created under tenant A is invisible to tenant B through
  the Prisma `tenantId` filter (the load-bearing tenancy test).
- Verify, live: create an employee via `employee.create`, then `employee.list` as a
  different tenant returns empty.
- Review gate: none.

### Phase 2. Time → Payroll (sketch)

`TIME` model (time entries, leave) + pure `runPayroll` engine + native-session
persistence of pay runs + payslip docs. Highest-risk context. Locked runs,
adjustment-only corrections.

### Phase 3. Recruitment (sketch)

`REC` model; pipeline; `hire` converts candidate to `Employee` (reuses encrypted PII).

### Phase 4. Billing (sketch)

`BILL` plans. Fix the placeholder pricing on the landing page first
(`design.md` lines 112-209: hosting features and SEO FAQs are wrong for HR).

### Phase 5. Integrations (sketch)

`INTG` connector framework + first 5-10 adapters; webhook ingress; retry/backoff.

### Phase 6. Reporting (sketch)

`REP` read models from the event stream; dashboards; CSV/PDF export.

### Phase 7. Hardening (sketch)

Compliance audit, pen-test, DR drill. MongoDB replica set for transactions is a
prerequisite flagged in risks.

## Appendix A. Risks

- **Money precision.** Mitigated by `Cents` branded integer type and a pure engine.
  No float anywhere in the money path.
- **No RLS.** Mitigated by `tenantCollection`; `tenantId` comes from the Better Auth
  active organization, never client-supplied. Risk remains if a dev bypasses the
  factory; lint/review must police it.
- **No Prisma Mongo transactions.** Pay run persistence uses native driver session.
  Requires a MongoDB replica set (not standalone) for transactions to work.
- **PII at rest.** AES-256-GCM app-layer; key management is env for v1, KMS later.
- **Better Auth MCP unavailable here.** Grounded via Context7 v1.6.x; confirm
  adapter/role shapes against `node_modules/better-auth` at implementation time.
- **Next 16 breaking changes.** Implementation must read
  `node_modules/next/dist/docs` before writing route handlers.

## Appendix B. Rejected alternatives

- Postgres + RLS (§13 default): rejected by operator; would have given tenancy
  enforcement for free but conflicts with the chosen Mongo stack.
- Hand-rolled auth (argon2 + JWT cookie): rejected after operator chose Better Auth;
  Better Auth supplies email/password, sessions, MFA/SSO path, and org RBAC.
- Decimal128 for money: rejected in favor of integer cents (simpler, exact).
- Prisma `$transaction` for pay run: rejected because Prisma 8 has no Mongo
  transaction support; native driver session is the only atomic path.

## Appendix C. Reading list

- `node_modules/next/dist/docs` (Next 16 route handlers, before any code).
- Better Auth docs via Context7 `/better-auth/better-auth` (Next.js, MongoDB adapter,
  organization plugin). Confirm against installed version at build time.
- tRPC Next.js App Router adapter docs (Context7).
- Prisma MongoDB provider docs, especially transactions (Context7).
- `docs/system-design.md` §12 (phase order, kept).
- `docs/design.md` lines 112-209 (placeholder content to fix in Phase 4).

## How to read this

One box is one unit of work. Each PR names the evidence that checks it. Execution
starts only on the operator's explicit go, under the same discipline adapted to
this repo's gates (lint + typecheck + Vitest + live HTTP). The operator merges.
