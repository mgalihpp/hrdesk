I'm Galih, You're my coding agent for this project. Your job is to help me maintain, debug, extend, refactor, and improve this codebase while respecting the existing architecture and conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Stack & Commands

- **Runtime: Bun 1.4.0 only** (`packageManager: bun@1.4.0`). Use `bun run`, not npm/yarn/pnpm. CI uses `oven-sh/setup-bun@v2`.
- `bun install` / `bun run dev` / `bun run build` / `bun run lint` (`biome check`) / `bun run format` (`biome format --write`) / `bun run typecheck` (`tsc --noEmit`) / `bun run test` (`vitest run`)
- Single test: `bun run test -- __tests__/lib/money.test.ts` — watch: `bun run test -- --watch`
- DB: `bun run db:generate` (required after any `prisma/schema.prisma` edit; also `postinstall`), `bun run db:push`, `bun run db:seed` (`bun prisma/seed.ts`), `bun run db:studio`
- **CI order** (`.github/workflows/ci.yml` on push/PR): `bun install --frozen-lockfile` → `db:generate` → `lint` → `typecheck` → `test` → `build`. Replicate locally before pushing. Env in CI: `DATABASE_URL=mongodb://localhost:27017/saasdesk_test`, `APP_ENCRYPTION_KEY=0…0` stub, `BETTER_AUTH_*`.

## Architecture

Single-repo Next.js 16 App Router + React 19, not a monorepo. Flow: `proxy.ts → Next App Router → Better Auth → tRPC (RBAC) → repo factories → Prisma MongoDB`.

- **Routes:** `app/layout.tsx` (root, GeneralSans + globals); `app/(marketing)/` (15 static sections + `ScrollReveal`/`WebflowWidgets`); `app/(auth)/` (login/signup, `sanitizeNext` for `?next=`); `app/dashboard/` (protected shell via `lib/shell-session.ts` + `headers()`); `app/api/auth/[...all]` (`toNextJsHandler`, `force-dynamic`); `app/api/trpc/[trpc]` (`fetchRequestHandler`); `app/api/reporting/export` (CSV).
- **Auth/tenancy/RBAC:** Better Auth in `lib/auth.ts` (prismaAdapter, `emailAndPassword`, `organization({ac, roles})`, `nextCookies()` last, `generateId:false`). 6 roles: `owner`/`admin`/`hr`/`manager`/`employee`/`payrollAdmin` with `employee[crud]`, `payroll[run/read/adjust]`, `org[read/update/invite]`. `server/trpc/init.ts`: `createTRPCContext({headers})` → `auth.api.getSession` → `activeOrganizationId` as `tenantId` → `TRPCContext`. Middleware: `isAuthed` (UNAUTHORIZED), `rbacProcedure`/`rbacAnyProcedure` (FORBIDDEN). `lib/shell-session.ts` is `cache`+`server-only`. `proxy.ts` (Next 16, not `middleware.ts`) rate-limits `/api/trpc`+`/api/auth` (20/60s via `lib/rate-limit.ts`) and gates `/dashboard`+`/app` via `better-auth.session_token` cookies.
- **Key dirs:** `app/components/` (marketing), `components/ui/` (shadcn radix-luma) + `components/dashboard/`, `lib/` (domain primitives + `payroll/`/`billing/`/`reporting/`/`integrations/`/`recruitment/`), `server/trpc/routers/` + `server/repo/` (factory per aggregate), `prisma/schema.prisma` (17 models), `hooks/useAuthFsm.ts`, `docs/system-design.md` + `build-plan-foundation.md`.

## Data Invariants — Do Not Break

- **Tenant isolation:** Every repo is `repoName(prisma, tenantId)` factory; every query must filter `where:{tenantId}`. Use `updateMany`/`deleteMany` with `tenantId`, never `update`/`delete` by id alone. Never take `tenantId` from body/URL. Idempotency keys are `tenantId`-prefixed with cross-tenant collision check.
- **Money = integer `Cents` only** (`lib/money.ts` branded `number`, `cents(n)` throws on non-integer, `moneyAdd/Sub/Gte`, `moneyToMajor`). Mongo stores `Int` minor units; no `float`/`Decimal128`. Payroll reconciles `gross === deductions + tax + net`.
- **PII encryption** (`lib/crypto.ts`, server-only, AES-256-GCM `iv:tag:ciphertext` hex `:`-joined). `APP_ENCRYPTION_KEY` 64-hex or sha256 hash; empty → zero key (tests set `"0".repeat(64)`). Repos encrypt `ssnEnc`/`bankEnc`/`emailEnc`/`phoneEnc`/`credentialsEnc` on write, decrypt in `toView`.
- **Payroll:** `lib/payroll/engine.ts` `runPayroll` is pure/deterministic; `lib/payroll/tax.ts` progressive `computeTax` with `Math.round`. `server/repo/payrun.ts` does sequential writes (no Mongo transaction) — future atomicity needs `mongo.client.startSession().withTransaction` on replica set.

## Conventions

- **Lint/format:** Biome 2.4.2 (`biome.json`, 2-space, `organizeImports` on, `tailwindDirectives` on, `recommended`+`next`/`react`). No ESLint/Prettier. Overrides disable lint for `components/ui/**` and relax a11y/security for `app/components/**`/`webflow.css`/`nav.css`/`app/(auth)/**`. Run `bun run lint` + `bun run format`.
- **Styling:** Tailwind v4 CSS-first (`@theme` in `app/globals.css`, no `tailwind.config.js`, `postcss.config.mjs` = `@tailwindcss/postcss`). Use `cn()` from `lib/utils.ts`. New UI → `radix-luma` shadcn + `lucide-react` (`components.json` aliases `@/components`, `@/lib/utils`, `@/lib`, `@/hooks`).
- **Naming:** Components `PascalCase` default export (server by default, `'use client'` only for observers); repos `camelCase` factories (`employeeRepo`) returning `{list,getById,create,update,remove}`; branded IDs `TenantId`/`EmployeeId`/`Cents` in `lib/types.ts`.
- **Validation/errors:** zod for all tRPC inputs; `lib/auth-errors.ts` `mapAuthError` + `sanitizeNext` (blocks `//`, `\\`, `://`, must start `/`). tRPC throws `TRPCError` with `UNAUTHORIZED`/`FORBIDDEN`/`BAD_REQUEST`.
- **Async/state:** Server components `async` + `await getShellSession(headers())`; React Compiler on (`next.config.ts` `reactCompiler:true`) — no manual memo. No Redux/Zustand; `useAuthFsm.ts` FSM + local `useState`.
- **Prisma:** Singleton via `globalThis._prisma` (`lib/prisma.ts`). Datasource `mongodb`, `DATABASE_URL` from env. `@/*` alias → repo root (`tsconfig.json` + `vitest.config.mts`).
- **Webflow:** `WebflowWidgets.tsx` is sole polyfill (one `activate*` per widget, `AbortController` cleanup, `try/catch→console.error`); keep `w-*`/`ix-*`/`u-*` classes verbatim; `app/webflow.css` (~110KB) is generated. `ScrollReveal.tsx` handles `[data-w-id]`.

## Testing

- **Vitest 4.1.11** (`vitest.config.mts`: `environment:node`, `include:["__tests__/**/*.test.ts"]`, `env.APP_ENCRYPTION_KEY="0".repeat(64)`, alias `@`). No setup files, no coverage, no jsdom/e2e. Source dirs have no colocated tests — add `__tests__/<mirror>/foo.test.ts`.
- 33 tests under `__tests__/`: `lib/` pure (money, rate-limit, payroll/tax/billing, reporting csv/aggregates, integrations lifecycle/registry, recruitment pipeline), `server/repo/` (employee/tenant/payrun/audit/billing/candidate/leave/integration/timeEntry/job/org — all `vi.fn` or in-memory `fakePrisma`), `server/trpc/` (rbac + router `TRPCError` code checks via `makeCaller(roles, tenantId, prismaOverride)`).
- Keep assertions for: money integer, encryption `:`-delimited, FSM transitions, idempotency dedup, `where.tenantId` isolation, `from <= to` range guards.

## Gotchas

- `next dev` regenerates the `nextjs-agent-rules` block in this file — don't delete it in diffs.
- `proxy.ts` not `middleware.ts` (Next 16 rename); `config.matcher` must include `/dashboard/:path*`, `/app/:path*`, `/api/trpc/:path*`, `/api/auth/:path*`.
- Prisma MongoDB has no transactions — don't assume `prisma.$transaction` is atomic.
- `.env` needs `DATABASE_URL`, `APP_ENCRYPTION_KEY` (64-hex), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL` (see `.env.example`). Without real key, `decrypt` fails in dev.
- `trustedDependencies`/`ignoreScripts` in `package.json` — `bun install` handles `sharp`/`prisma`; don't switch to npm.
