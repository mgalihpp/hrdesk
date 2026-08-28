I'm Galih, You're my coding agent for this project. Your job is to help me maintain, debug, extend, refactor, and improve this codebase while respecting the existing architecture and conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Project Overview

SaaSdesk (branded "Saasland HR") — Next.js 16 (App Router) + React 19 monolith for multi-tenant HR + Payroll. Serves a static marketing landing page and an authenticated dashboard + tRPC API backed by MongoDB via Prisma + Better Auth. Single repo, not a monorepo. Bounded contexts: ORG/TIME/PAY (pure engine)/REC (recruitment)/BILL/INTG/REP/Audit.

## Architecture & Data Flow

**High-level:** `Clients → proxy.ts (rate-limit + session gate) → Next App Router → Better Auth (email+password + organization) → tRPC (RBAC) → repo factories → Prisma MongoDB`. Docs drive phased build: Foundation → Payroll → Recruitment → Billing → Integrations → Reporting → Hardening (`docs/build-plan-foundation.md`, `docs/system-design.md`).

**Route groups:**
- `app/layout.tsx` — root (GeneralSans `next/font/local`, `globals.css`, `fonts.css`).
- `app/(marketing)/` — `layout.tsx` imports `webflow.css`/`nav.css`; `page.tsx` composes 15 presentational sections (Navbar, Hero, Benefits, Feature, UseCases, Testimonial, Integration, Reviews, Pricing, Faq, ClientLogos, FinalCta, Footer + `ScrollReveal`/`WebflowWidgets`). No props, hardcoded `const` arrays.
- `app/(auth)/` — `login`/`signup` server components read `searchParams.next` via `sanitizeNext`, redirect if session exists, render `AuthShell` + `LoginForm`/`SignupForm`.
- `app/dashboard/` — protected shell; `layout.tsx` calls `getShellSession(headers())` → SidebarProvider + AppSidebar + header. `page.tsx` fetches `reportingRepo(prisma, tenantId).overview` + `getPayrollSeries` server-side. `employees/page.tsx` delegates to `EmployeesClient` (client state, not yet tRPC-wired).
- `app/api/auth/[...all]/route.ts` — `toNextJsHandler(auth)` (`dynamic='force-dynamic'`).
- `app/api/trpc/[trpc]/route.ts` — `fetchRequestHandler` with `createTRPCContext({headers: req.headers})`.
- `app/api/reporting/export/route.ts` — CSV export via `reportingRepo` + `lib/reporting/csv.ts`.

**Auth / tenancy / RBAC:**
- Better Auth: `lib/auth.ts` → `prismaAdapter` MongoDB, `emailAndPassword`, `organization({ac, roles})`, `nextCookies()` last, `generateId:false` (Mongo ObjectId). 6 roles: `owner` (full), `admin` (no payroll run), `hr` (employee + read payroll), `manager` (read/update employee), `employee` (read-only), `payrollAdmin` (payroll run). `createAccessControl` statements: `employee[crud]`, `payroll[run/read/adjust]`, `org[read/update/invite]`.
- `server/trpc/init.ts`: `createTRPCContext({headers})` → `auth.api.getSession` → `activeOrganizationId` as `tenantId` → `getActiveMemberRole` → `TRPCContext {session:{id, tenantId, roles}}`. Middleware: `isAuthed` → `UNAUTHORIZED`, `rbacProcedure(role)` / `rbacAnyProcedure(roles)` → `FORBIDDEN`.
- `lib/shell-session.ts` (`cache`, `server-only`): same chain + `listOrganizations` + `Tenant` lookup; returns `authenticated | noSession | noOrg` (`lib/types.ts`).
- `proxy.ts` (Next 16 — no `middleware.ts`): rate-limits `/api/trpc` + `/api/auth` per IP (20/60s via `lib/rate-limit.ts`), checks `better-auth.session_token` / `__Secure-...` cookies, redirects `/dashboard/:path*` + `/app/:path*` → `/login?next=sanitizeNext(path+search)`.
- Tenancy boundary: every repo is a factory `repoName(prisma, tenantId)` — every query filters `where:{tenantId}` (use `updateMany`/`deleteMany` with `tenantId`, never `update`/`delete` by id alone). Never take `tenantId` from request body/URL. Idempotency keys are `tenantId`-prefixed + cross-tenant collision check.

**Data invariants:**
- **Money — integer only:** `lib/money.ts` branded `Cents` (`number`), `cents(n)` throws on non-integer, `moneyAdd/Sub/Gte`, `moneyToMajor`. Mongo stores `Int` minor units; never use `float`/`Decimal128` in money paths. Payroll engine reconciles `gross === deductions + tax + net` per-payslip and globally.
- **PII encryption:** `lib/crypto.ts` AES-256-GCM (`iv:tag:ciphertext` hex `:`-joined), server-only. `APP_ENCRYPTION_KEY` is 64-hex raw or `sha256` hash (empty → zero key in tests). Repos encrypt on write (`ssnEnc`/`bankEnc`/`emailEnc`/`phoneEnc`/`credentialsEnc`), `decrypt` in `toView`.
- **Payroll:** `lib/payroll/engine.ts` `runPayroll(input)` is pure + deterministic; `lib/payroll/tax.ts` progressive `computeTax(gross, brackets)` with `Math.round`. `server/repo/payrun.ts` writes `payRun → payslip → payItem` sequentially (no Prisma Mongo transaction); future atomicity needs `mongo.client.startSession().withTransaction` on a replica set.

**Server/client split:** Server components (`dashboard/*`, marketing, auth pages) use `headers()` + `getShellSession` + `prisma` directly. Client components (`'use client'`) — `Navbar`, `Benefits`, `Feature`, `ScrollReveal`, `WebflowWidgets`, `Pricing`, `AppSidebar`, `EmployeesClient`, `ReportingSection`, forms, charts — use `authClient.useSession()`, `useState`/`useReducer`, tRPC hooks. `WebflowWidgets.tsx` is the only Webflow polyfill: one `activate*` per widget, `AbortController` cleanup, `try/catch→console.error`; keep `w-*`/`ix-*`/`u-*` classes verbatim, `app/webflow.css` (~110KB) is generated. `ScrollReveal.tsx` handles `[data-w-id]` fade-in.

## Key Directories

- `app/` — App Router. `app/components/` marketing sections (mostly server; `Navbar`/`Pricing`/`WebflowWidgets`/`ScrollReveal` are client). `app/(auth)/_components/` → `AuthShell.tsx`, `LoginForm.tsx`, `SignupForm.tsx`, `Field.tsx`. `app/api/` → `auth` + `trpc` + `reporting/export`. `app/webflow.css`, `app/nav.css`, `app/globals.css`, `app/fonts.css`.
- `components/` — shadcn/ui primitives (`components/ui/*` → button/card/dialog/dropdown-menu/sidebar, Radix + Tailwind) and `components/dashboard/*` → `app-sidebar.tsx`, `employees/employees-client.tsx`, `reporting-section.tsx`, `stat-cards.tsx`, `payroll-chart.tsx`, `pipeline-chart.tsx`, `payrun-table.tsx`, `employee-table.tsx`, etc.
- `lib/` — domain primitives: `auth.ts`, `auth-client.ts`, `auth-errors.ts` (`mapAuthError`, `sanitizeNext`), `prisma.ts` (singleton via `globalThis`), `crypto.ts`, `money.ts`, `slug.ts` (`toSlug`, `deriveOrgSlug`), `types.ts` (branded `TenantId`/`EmployeeId`/`Cents`, `Role`, `TRPCContext`, `ShellSession`), `utils.ts` (`cn`), `shell-session.ts`, `rate-limit.ts`, `dashboard-data.ts` (mock), `validators/auth.ts` (zod), `payroll/`, `billing/`, `reporting/`, `integrations/`, `recruitment/`, `employees/`.
- `server/` — `server/trpc/init.ts` (context + RBAC middleware), `server/trpc/routers/` (`_app.ts` aggregates `health` + `me`/`org`/`employee`/`payrun`/`timeEntry`/`leave`/`job`/`candidate`/`billing`/`integration`/`reporting`/`audit`), `server/repo/` (one factory per aggregate: `employee.ts`, `payrun.ts`, `billing.ts`, `org.ts`, `reporting.ts`, `integration.ts`, `timeEntry.ts`, `candidate.ts`, `job.ts`, `leave.ts`, `audit.ts`).
- `prisma/` — `schema.prisma` (MongoDB, 17 models: `User/Session/Account/Verification/Organization/Member/Invitation` + `Tenant/Employee/PayRun/Payslip/PayItem/TimeEntry/Leave/Job/Candidate/Subscription/Invoice/IntegrationConnection/IntegrationSync/AuditLog`), `seed.ts` (stub).
- `hooks/` — `useAuthFsm.ts` (auth FSM).
- `docs/` — `system-design.md`, `design.md` (Webflow landing spec), `build-plan-foundation.md`, `superpowers/plans/` (payroll, recruitment, integration, reporting-hardening).
- `public/` — static assets (Webflow-exported images).
- `.github/workflows/` — `ci.yml`.

## Development Commands

Package manager is **Bun 1.4.0** (pinned `packageManager`). Use `bun run`, not npm/yarn/pnpm.

```bash
bun install                          # honors trustedDependencies/ignoreScripts (sharp, unrs-resolver, prisma)
bun run dev                          # next dev (regenerates AGENTS.md block via next/dist/server/lib/generate-agent-files.js)
bun run build                        # next build
bun run lint                         # biome check
bun run format                       # biome format --write
bun run typecheck                    # tsc --noEmit
bun run test                         # vitest run (node env, APP_ENCRYPTION_KEY=0…0 stub)
bun run test -- lib/money.test.ts   # single file
bun run db:generate                  # prisma generate (after schema.prisma edits)
bun run db:push                      # prisma db push (needs DATABASE_URL)
bun run db:seed                      # bun prisma/seed.ts
bun run db:studio                    # prisma studio
```

**CI order** (`.github/workflows/ci.yml` on `push`/`pull_request`): `bun install --frozen-lockfile` → `bun run db:generate` → `bun run lint` → `bun run typecheck` → `bun run test` → `bun run build`. Run this order locally before pushing.

## Code Conventions & Common Patterns

**Formatting / lint:** Biome 2.4.2 (`biome.json`): 2-space indent, `organizeImports` on, `tailwindDirectives` on, `recommended` + `next`/`react` domains. No ESLint/Prettier. Overrides: `components/ui/**` lint/format disabled; `app/components/**`, `webflow.css`, `nav.css`, `app/(auth)/**` relax a11y/security. Always run `bun run lint` + `bun run format`.

**Styling:** Tailwind v4 CSS-first (`@theme` in `app/globals.css`, no `tailwind.config.js`, `postcss.config.mjs` = `@tailwindcss/postcss`). Use `cn()` from `lib/utils.ts` (`twMerge(clsx(...))`). New interactive UI → `radix-luma` shadcn primitives + `lucide-react` (see `components.json`: `style: radix-luma`, aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`).

**Naming:**
- Components: `PascalCase`, default export, server by default, `'use client'` only for observers/interactions. Files: `app/components/Hero.tsx`, `components/dashboard/app-sidebar.tsx`.
- Utilities/repos: `camelCase` (`employeeRepo`, `billingRepo`, `reportingRepo`), factories return `{list, getById, create, update, remove}`.
- Types: branded IDs (`TenantId`, `EmployeeId` as `string & {__brand}` in `lib/types.ts`), `Cents` branded `number`; enums `Plan`, `BillingInterval`, `PAY_RUN_STATUS`.
- Tests: `*.test.ts` colocated with source (e.g. `lib/money.test.ts`, `server/repo/employee.tenant.test.ts`, `server/trpc/routers/billing.test.ts`).

**Error handling:** zod schemas for all tRPC inputs (`lib/validators/auth.ts` + inline `z.object` in routers); `lib/auth-errors.ts` → `mapAuthError(code)` maps `USER_ALREADY_EXISTS`/`INVALID_EMAIL_OR_PASSWORD` to field/global errors, `sanitizeNext(path)` guards open-redirect (`//`, `\\`, `://` blocked, must start `/`). tRPC throws `TRPCError` with `UNAUTHORIZED`/`FORBIDDEN`/`BAD_REQUEST`. Client forms surface via FSM `error` state.

**Async patterns:** Server components are `async` and `await` `getShellSession(headers())` + repo calls directly. tRPC procedures are `async`; routers `await` `prisma` delegates. No manual `useMemo`/`memo` — React Compiler is on (`next.config.ts` `reactCompiler: true`); only add memo if profiled. `proxy.ts` is sync; `lib/rate-limit.ts` uses in-memory `Map` buckets `{count, resetAt}`.

**Dependency injection:** Repo DI via factory closure — `employeeRepo(prisma, tenantId)` captures `prisma` + `tenantId` so callers never pass `tenantId` per-method. `TRPCContext` (`{session, prisma}`) is the trust root. `lib/prisma.ts` singleton via `globalThis._prisma` in dev. No global singletons for domain logic.

**State management:** No Redux/Zustand. Server: `cache` (`lib/shell-session.ts`) + direct Prisma reads. Client: `useAuthFsm.ts` (`useReducer` FSM `idle→validating→submitting→creatingOrg→success/error` driving `authClient.signUp.email` → `deriveOrgSlug` → `organization.create` → `setActive` → `router.push(next)`); component-local `useState` for filters/pagination/selection (`EmployeesClient`), `authClient.useSession()` for session. Charts use `recharts`.

**Validation:** Add zod schemas for new tRPC inputs; reuse `toFieldErrors` helper pattern from `lib/validators/auth.ts`.

## Important Files

- `app/layout.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx` — composition & CSS imports
- `app/components/WebflowWidgets.tsx`, `app/components/ScrollReveal.tsx` — Webflow polyfills (only place for `w-*` interactions)
- `proxy.ts` — rate-limit + session gate (Next 16 `proxy()` + `config.matcher`)
- `lib/auth.ts`, `lib/auth-client.ts`, `lib/shell-session.ts`, `lib/auth-errors.ts` — auth/session/guard
- `lib/money.ts`, `lib/crypto.ts`, `lib/types.ts`, `lib/utils.ts`, `lib/slug.ts`, `lib/rate-limit.ts` — domain primitives
- `lib/validators/auth.ts` — auth zod schemas
- `server/trpc/init.ts`, `server/trpc/routers/_app.ts`, `server/repo/employee.ts` — tRPC context & tenancy pattern (copy for new repos)
- `prisma/schema.prisma`, `prisma/seed.ts` — data model & seed stub
- `hooks/useAuthFsm.ts` — auth FSM (signup/login flow)
- `vitest.config.mts`, `biome.json`, `next.config.ts`, `tsconfig.json`, `components.json`, `postcss.config.mjs` — configs
- `.env.example` — required env template (5 vars)
- `docs/system-design.md`, `docs/build-plan-foundation.md`, `docs/design.md`, `docs/superpowers/plans/*` — architecture, build plans

## Runtime/Tooling Preferences

- **Runtime:** Bun 1.4.0 required (`packageManager: bun@1.4.0` + `oven-sh/setup-bun@v2` in CI). `@types/node ^20` present but Bun runs Next. No `engines` field, no `.nvmrc`/`.node-version`.
- **Package manager:** Bun only (`bun.lock` v2, `bun install --frozen-lockfile` in CI, `ignoreScripts: [sharp, unrs-resolver]`, `trustedDependencies: [sharp, unrs-resolver, prisma, @prisma/client]`, `prisma.seed: bun prisma/seed.ts`). Do not use npm/yarn/pnpm.
- **Tooling constraints:** Biome replaces ESLint/Prettier; Tailwind v4 CSS-first (no `tailwind.config.js`); `proxy.ts` not `middleware.ts` (Next 16); `reactCompiler: true` in `next.config.ts`; `@/*` alias → repo root (`tsconfig.json` + `vitest.config.mts` `fileURLToPath`). Path imports: `import { cn } from "@/lib/utils"`, `import { employeeRepo } from "@/server/repo/employee"`.
- **Env:** Copy `.env.example` → `.env`: `DATABASE_URL` (MongoDB Atlas in dev, `mongodb://localhost:27017/saasdesk_test` in CI), `APP_ENCRYPTION_KEY` (64-hex recommended; empty → zero key; Vitest sets `0…0` stub), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`. Real dev needs a real key or `decrypt` fails.
- **DB:** MongoDB (Atlas). Prisma has no Mongo transactions — pay-run atomicity requires native driver session (`mongo.client.startSession().withTransaction`) on a replica set (`docs/build-plan-foundation.md`).

## Testing & QA
- **Framework:** Vitest 4.1.11 (`vitest.config.mts`: `environment: node`, `include: ["__tests__/**/*.test.ts"]`, `env.APP_ENCRYPTION_KEY="0".repeat(64)`, alias `@` → root, no `setupFiles`/`globalSetup`/`coverage`).
- **Inventory:** 33 `*.test.ts` files under `__tests__/` (0 `*.spec.*`), no jsdom/testing-library/e2e. Source dirs (`lib/`, `server/`) contain no `*.test.ts` — tests are isolated for reader load.
  - `__tests__/lib` pure (12): `money.test.ts` (Cents invariants), `rate-limit.test.ts` (`vi.useFakeTimers`), `payroll/{engine,engine.property,tax,types}.test.ts` (determinism, reconciliation, progressive brackets, 100-case property loop), `billing/engine.test.ts`, `reporting/{csv,aggregates}.test.ts` (RFC4180 escaping, `deductions+tax+net===gross`), `integrations/{lifecycle,registry}.test.ts`, `recruitment/pipeline.test.ts` (FSM `canTransition`/`isValidStage`).
  - `__tests__/server/repo` (12): `employee.test.ts`, `employee.tenant.test.ts`, `payrun.test.ts` (idempotency `idempotencyKey` dedup, tenant isolation), `audit.test.ts` (append-only, cursor pagination, `createdAt gte/lte`), `reporting.test.ts`, `billing.test.ts`, `candidate.test.ts`, `leave.test.ts`, `integration.test.ts`, `timeEntry.test.ts`, `job.test.ts`, `org.test.ts` — all via `vi.fn` per Prisma delegate or plain `fakePrisma` in-memory arrays; `encrypt` seed + `:` delimiter assertion; shared `rows` across two `mockPrisma(rows)` to prove isolation.
  - `__tests__/server/trpc` (9): `rbac.test.ts`, `employee.test.ts`, `routers/{billing,candidate,payrun,integration,reporting,job,timeEntry}.test.ts` — `TRPCError` code checks (`FORBIDDEN`/`UNAUTHORIZED`/`BAD_REQUEST`), `caller` via `makeCaller(roles, tenantId, prismaOverride)`.
- **Running:**
  ```bash
  bun run test                         # single-shot (CI)
  bun run test -- __tests__/lib/money.test.ts   # single file
  bun run test -- --watch             # watch (vitest native)
  ```
- **Coverage:** None configured (no `coverage{}` block, no `@vitest/coverage-*` in `bun.lock`, `.gitignore` has `/coverage` but nothing generates it). No thresholds; CI does not upload artifacts.
- **CI QA:** `.github/workflows/ci.yml` (`verify` on `push`/`pull_request`, `ubuntu-latest`, env `DATABASE_URL` + `APP_ENCRYPTION_KEY` + `BETTER_AUTH_*`): `bun install --frozen-lockfile` → `bun run db:generate` → `lint` → `typecheck` → `test` → `build`. No parallel matrix, no DB integration tests (all Prisma mocked), no API route/component/snapshot tests — tenancy asserted via `where.tenantId` mock checks, not real Mongo.
- **Expectations:** Keep money integer, encryption `:`-delimited, FSM transition, idempotency, and tenant-isolation assertions. Add `__tests__/**/*.test.ts` mirroring source path (e.g. `__tests__/lib/money.test.ts` for `lib/money.ts`) following `vi.fn` + factory pattern; ensure `from <= to` range guard and `withTransaction` note for multi-write pay-runs.
