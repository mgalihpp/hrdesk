I'm Galih, You're my coding agent for this project. Your job is to help me maintain, debug, extend, refactor, and improve this codebase while respecting the existing architecture and conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Project Overview

SaaSdesk (branded "Saasland HR") — Next.js 16 (App Router) + React 19 monolith. Serves a static marketing landing page **and** an authenticated app (dashboard, tRPC API) backed by MongoDB via Prisma + Better Auth. Single repo, not a multi-package monorepo.

## Architecture

- **Routes (route groups):** `app/layout.tsx` (root: GeneralSans `next/font/local`, `globals.css`, `fonts.css`) → `app/(marketing)/layout.tsx` (imports `webflow.css`, `nav.css`) → `app/(marketing)/page.tsx` (Home: 15 presentational sections in fixed order, no props); `app/(auth)/` (login/signup); `app/dashboard/` (protected shell); `app/api/auth/[...all]/route.ts` (Better Auth handler); `app/api/trpc/[trpc]/route.ts` (tRPC `fetchRequestHandler`, `createTRPCContext` from `server/trpc/init.ts`).
- **Marketing sections:** `app/components/` — mostly server components; `Navbar`, `Benefits`, `Feature`, `ScrollReveal`, `WebflowWidgets` are `'use client'`. Content is hardcoded `const` arrays; do not add data fetching unless required.
- **Webflow polyfill:** `app/components/WebflowWidgets.tsx` is the only place for Webflow interactions (tabs, sliders, pricing toggle, card tilt, FAQ). One `activate*` fn per widget, `AbortController` cleanup, `try/catch` → `console.error`. `ScrollReveal.tsx` handles `[data-w-id]` fade-in. Keep `w-*`/`ix-*`/`u-*` class names verbatim; `app/webflow.css` (~110 KB) is verbatim export — treat as generated.
- **Auth / tenancy / API:** `lib/auth.ts` (`betterAuth` + `prismaAdapter` MongoDB, `emailAndPassword`, `organization` plugin, `nextCookies()` last, `generateId: false` for ObjectId). `server/trpc/init.ts` builds `TRPCContext` from `auth.api.getSession` + `getActiveMemberRole` — `tenantId = activeOrganizationId`, `roles` from org member. `proxy.ts` (`matcher: /dashboard/:path*, /app/:path*`) redirects to `/login?next=` if no `better-auth.session_token` cookie, `sanitizeNext` guards open-redirect. `lib/shell-session.ts` (`cache`, `server-only`) returns `authenticated | noSession | noOrg` for dashboard shell.

## Data & Security Invariants

- **Prisma (MongoDB):** `prisma/schema.prisma` — `User/Session/Account/Verification/Organization/Member/Invitation` (Better Auth), plus `Tenant` (keyed by org id: `plan/taxLocale/brandingName`) and `Employee` (`tenantId`, `ssnEnc`/`bankEnc` ciphertext, `compensation Int` minor units). `lib/prisma.ts` is a singleton via `globalThis`.
- **Money — integer only:** `lib/money.ts` `Cents` branded `number`, `cents()` throws on non-integer, `moneyAdd/Sub/Gte`. Never use `float`/`Decimal128` in the money path; Mongo stores `Int`.
- **PII encryption:** `lib/crypto.ts` AES-256-GCM, server-only. `APP_ENCRYPTION_KEY` is `64-hex` → raw key, else `sha256` hash (empty → zero key in tests). `server/repo/employee.ts` `employeeRepo(prisma, tenantId)` is the PII + tenancy boundary: encrypt on write, `decrypt` on read, every query filters by `tenantId` from session. Never take `tenantId` from request body/URL. Reuse this pattern for new tenant-scoped repos.
- **RBAC:** `lib/auth.ts` `createAccessControl` with 6 roles (`owner`, `admin`, `hr`, `manager`, `employee`, `payrollAdmin`) — see `server/trpc/init.ts` `protectedProcedure`/`rbacProcedure`/`rbacAnyProcedure`. `lib/types.ts` has branded `TenantId`/`EmployeeId`/`Cents`.
- **Payroll atomicity (future):** Prisma has no Mongo transactions; pay-run persistence must use native driver session (`mongo.client.startSession().withTransaction`) — requires Mongo replica set, not standalone.

## Commands

Package manager is **Bun 1.4.0** (pinned `packageManager`). Use `bun run`, not npm/yarn/pnpm.

```bash
bun install                          # honors trustedDependencies/ignoreScripts (sharp, unrs-resolver, prisma)
bun run dev                          # next dev
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

**CI order** (`.github/workflows/ci.yml` on `push`/`pull_request`): `bun install --frozen-lockfile` → `bun run lint` → `bun run typecheck` → `bun run test`. Run in this order locally before pushing.

## Code Conventions

- **Lint/format:** Biome 2.4.2 (`biome.json`): 2-space indent, `organizeImports` on, `tailwindDirectives` on, `next`+`react` domains. No ESLint/Prettier. Always run `bun run lint` + `bun run format`.
- **Styling:** Tailwind v4 CSS-first (`@theme` in `app/globals.css`, no `tailwind.config.js`, `postcss.config.mjs` = `@tailwindcss/postcss`). Use `cn()` from `lib/utils.ts` (`twMerge(clsx)`). New interactive UI → `radix-luma` shadcn primitives + `lucide-react` (see `components.json`).
- **Components:** PascalCase, default export, server by default, `'use client'` only for observers/interactions. No prop drilling in marketing `page.tsx`.
- **TypeScript:** `strict`, `@/*` → repo root (e.g. `import { cn } from "@/lib/utils"`). Avoid `any`. React Compiler is on (`next.config.ts` `reactCompiler: true`) — don't add manual `useMemo`/`memo` unless profiled.
- **Validation:** `lib/validators/auth.ts` + `lib/auth-errors.ts` (`mapAuthError`, `sanitizeNext`) for auth forms. Add zod schemas for new tRPC inputs.

## Env & Setup

Copy `.env.example` → `.env`: `DATABASE_URL` (MongoDB), `APP_ENCRYPTION_KEY` (64-hex recommended), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`. Vitest sets `APP_ENCRYPTION_KEY=0…0` automatically; real dev needs a real key or `decrypt` will fail.

## Important Files

- `app/layout.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx` — composition & CSS imports
- `app/components/WebflowWidgets.tsx`, `app/components/ScrollReveal.tsx` — Webflow polyfills
- `lib/auth.ts`, `lib/auth-client.ts`, `lib/shell-session.ts`, `proxy.ts` — auth/session/guard
- `lib/money.ts`, `lib/crypto.ts`, `lib/types.ts`, `lib/utils.ts` — domain primitives
- `server/trpc/init.ts`, `server/trpc/routers/_app.ts`, `server/repo/employee.ts` — tRPC context & tenancy pattern
- `prisma/schema.prisma`, `vitest.config.mts`, `biome.json`, `next.config.ts`, `components.json`
- `docs/system-design.md`, `docs/build-plan-foundation.md`, `docs/design.md` — architecture, build plan, content spec
