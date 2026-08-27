I'm Galih, You're my coding agent for this project. Your job is to help me maintain, debug, extend, refactor, and improve this codebase while respecting the existing architecture and conventions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Project Overview

SaaSdesk (branded "Saasland HR") is a single-page marketing landing page for a Payroll & HR SaaS, built with Next.js 16 (App Router) and React 19. It is a static, content-heavy page ported from a Webflow template (kept verbatim in `reference/`). There is one route, `/`, composed of 15 section components. This is a landing site, not an application with a backend or data layer.

## Architecture & Data Flow

- `app/layout.tsx` (RootLayout) loads the GeneralSans local font, sets metadata, and imports the global stylesheets (`globals.css`, `fonts.css`, `webflow.css`, `nav.css`).
- `app/page.tsx` (Home) composes 15 section components in a fixed order and passes **no props**. The section sequence is the page; do not reorder or inject props without reason.
- All 15 components in `app/components/` are presentational sections. Five are `'use client'` (Navbar, Benefits, Feature, ScrollReveal, WebflowWidgets) for scroll/IntersectionObserver effects and Webflow-JS polyfills; the rest are server components.
- There is **no data fetching, no async/await, no global state, no React context, and no error boundaries** in `app/`. Content is hardcoded literals and inline `const` arrays (e.g. `TABS`, `FEATURE_BG`, `ROW1_LOGOS`). Keep it that way unless a feature genuinely needs state.
- Webflow interactions (tabs, sliders, pricing toggle, card tilt, FAQ accordion, scroll reveal) are NOT React state. They are restored by a client polyfill engine in `app/components/WebflowWidgets.tsx` that queries the DOM after mount and wires behavior to the existing Webflow class names (`w-tabs`, `w-slider`, etc.). `ScrollReveal.tsx` adds `.ix-ready` and fades `[data-w-id]` nodes on intersect.

Conversion workflow (source of truth, not app code): `reference/source.html` → `reference/split.mjs` → `reference/sections/*.html` + `reference/sections/index.json` → port each section to `app/components/<Name>.tsx` per `reference/CONVERSION.md`, styled by `app/webflow.css` (a mirror of `reference/style.css`).

## Key Directories

- `app/` — App Router site: `layout.tsx`, `page.tsx`, `components/`, and CSS.
- `app/components/` — 15 section components (one file per section).
- `lib/utils.ts` — the only shared util: `cn()` = `twMerge(clsx(inputs))`. There is no `types/` or data module.
- `reference/` — Webflow source material (not imported by `app/`): `source.html`, `sections/`, `style.css`, `webflow.js`, `CONVERSION.md`, `split.mjs`.
- `docs/` — `design.md` (content/design spec, section copy, CDN assets) and `system-design.md` (product/system architecture, data model, tenancy, security, phased build).

## Development Commands

Package manager is **Bun 1.4.0** (pinned via `packageManager`). Use `bun run`, not `npm`/`yarn`/`pnpm`.

```bash
bun install        # install deps (honors trustedDependencies/ignoreScripts for sharp, unrs-resolver)
bun run dev        # next dev
bun run build      # next build
bun run start      # next start (production)
bun run lint       # biome check
bun run format     # biome format --write
```

There is **no test script**.

## Code Conventions & Common Patterns

- **Lint & format:** Biome 2.4.2 (`biome.json`), 2-space indent, `organizeImports` on. No ESLint/Prettier. Always run `bun run lint` and `bun run format` before committing.
- **Styling:** Tailwind v4 CSS-first (tokens in `app/globals.css` via `@theme`; no `tailwind.config.js`). Plus a verbatim Webflow export at `app/webflow.css` (~110 KB) and interaction polyfills in `app/nav.css`. No CSS modules. Use `cn()` for conditional classes; reach for shadcn (radix-luma) primitives and `lucide-react` icons for any new interactive UI.
- **Webflow porting rule:** keep Webflow class names verbatim (`w-*`, `ix-*`, `u-*`). When adding or repairing a section interaction, extend `WebflowWidgets.tsx` (one `activate*` fn with `AbortController` cleanup and `try/catch` → `console.error`), not React state. See `reference/CONVERSION.md` for the HTML→JSX rules.
- **Components:** PascalCase file names, default-exported section components. Server components by default; add `'use client'` only for interactions/observers. No prop drilling — `page.tsx` passes nothing.
- **Naming:** section components are named after the section (Hero, Benefits, Feature, UseCases, Testimonial, Integration, Reviews, Pricing, Faq, ClientLogos, FinalCta, Footer, Navbar, ScrollReveal, WebflowWidgets). Inline data arrays use UPPER_SNAKE_CASE.
- **Error handling:** only in the `WebflowWidgets` polyfills (`try/catch` per init). Do not add error boundaries or async throws to the static page.
- **React 19 + React Compiler** are enabled (`next.config.ts` `reactCompiler: true`). Write idiomatic hooks; the compiler handles memoization.
- **TypeScript:** strict mode, `@/*` path alias → repo root (e.g. `import { cn } from "@/lib/utils"`). Avoid `any` without cause.

## Important Files

- `app/page.tsx` — Home composition; section order is load-bearing.
- `app/layout.tsx` — root layout, fonts, metadata, CSS imports.
- `app/components/WebflowWidgets.tsx` — client polyfill engine for all Webflow interactions.
- `app/globals.css` — Tailwind v4 `@theme` tokens + shadcn semantic tokens.
- `app/webflow.css` — verbatim Webflow stylesheet; treat as generated, mirror of `reference/style.css`.
- `lib/utils.ts` — `cn()` helper (the only shared util).
- `next.config.ts` — `reactCompiler: true`.
- `biome.json` — lint/format rules.
- `reference/CONVERSION.md` — contract for porting Webflow sections to components.
- `docs/system-design.md`, `docs/design.md` — architecture and content specs.

## Runtime/Tooling Preferences

- **Bun 1.4.0** is the required runtime/package manager. Do not switch to npm/yarn/pnpm. No `.nvmrc`/engines; Bun is assumed.
- **Biome** over ESLint/Prettier for lint + format.
- **Tailwind v4 CSS-first** (config lives in CSS, not JS).
- **shadcn** (radix-luma style) + **lucide-react** for icons/primitives.
- **React Compiler** is on — avoid manual `useMemo`/`React.memo` unless profiling proves the need.
- No Dockerfile, no `.env.example`, no CI pipeline configured.

## Testing & QA

- **There are no tests and no CI.** No test runner, no `*.test.*`/`*.spec.*` files, no `__tests__`, no `.github/workflows`. Biome (`bun run lint`) is the only automated quality gate.
- If you add tests later, the idiomatic stack is **Vitest + `@testing-library/react`** for component/unit tests (optionally **Playwright** for e2e), plus a `test` script and a GitHub Actions workflow. Keep the existing Biome gate.
