# Reporting and Hardening plan

Live tenant scoped reporting replaces dashboard stubs and hardens audit and perf. HR managers and payroll admins get headcount and payroll and attendance and pipeline and billing and sync insights with CSV export. Every read filters by tenantId from Better Auth activeOrganizationId and every money value stays Cents. PRs are REP-1 backend and REP-2 frontend and HARD-1 hardening.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/autopilot-stack.md`. The operator merges. Operator items stop at merge ready.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on her explicit go.
- [ ] On her go, arm a `/goal` with this exact text. "`docs/superpowers/plans/2026-08-28-reporting-hardening.md` with REP-1 and REP-2 and HARD-1 in order, verification rule is Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked, operator merges, done when every box is checked with evidence."
- [ ] Read these from trunk at program start. Re read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/how/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/architect/SKILL.md`
- [ ] Arm the 30-minute audit tick. In a local session, a real terminal `/loop`. In a cloud root, a cloud sleeper wake chain. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk and the armed /goal. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then send the operator a status message, whether or not anything changed, with the queue table of PR, owner, state, and head SHA, the verdicts since the last tick, what merged, open operator gates, and blockers."
- [ ] On the operator hold or stand down, send every owner a zero writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] REP-1 is first and branches from `main`.
  - [ ] REP-2 after REP-1.
  - [ ] HARD-1 after REP-2.
- [ ] Hold the file boundaries. REP-1 touches only `lib/reporting/**` and `server/repo/reporting*` and `server/trpc/routers/reporting*` and `prisma/schema.prisma` if needed and tests. REP-2 touches only `app/dashboard/**` and `components/dashboard/**` and `lib/dashboard-data*` and CSV helpers. HARD-1 touches only `server/repo/audit*` and `lib/audit*` and `proxy*` and observability helpers.
- [ ] Hold the review gate. REP-2 changes an interaction. It waits for the operator review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Open the PR ready, never draft, with `gh pr create` and `draft: false`, or with Graphite `gt` for a stack.
- [ ] Run the repo lint and typecheck once before the PR facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before babysit and again before the merge ready report.

### Verdict and merge, for every PR

- [ ] At the merge ready head SHA, run the swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR Verify live block. The perf lane from its Verify perf block. One audit lane that reads the diff and the receipts and distrusts the PR body.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner. A new head gets a fresh swarm and a fresh verdict.
- [ ] Root appends the PR to the Graphite stack on clean verdict. No owner merges. Operator lands the stack with her clicks.

### Boot recipe, for every live lane

Each live lane runs on its own VM at the PR head. Drive through `control-ui` or `control-cli` from `cursor-team-kit`.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Start backend and surface. Run `bun install --frozen-lockfile` then `bun run db:generate` then `bun run dev` and wait for ready on `http://localhost:3000`.
- [ ] Deliver input only through the control skill commands. Use read only diagnostics `bun run lint` and `bun run typecheck` and `bun run test` and browser observe and fetch to `api/trpc`.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Reporting aggregation and API (REP-1)

**Depends on.** None.

**Files.**

- [ ] Create `lib/reporting/types.ts`.
- [ ] Create `lib/reporting/aggregates.ts`.
- [ ] Create `server/repo/reporting.ts`.
- [ ] Create `server/trpc/routers/reporting.ts`.
- [ ] Edit `server/trpc/routers/_app.ts`.
- [ ] Edit `lib/types.ts`.
- [ ] Create `lib/reporting/aggregates.test.ts`.
- [ ] Create `server/repo/reporting.test.ts`.
- [ ] Create `server/trpc/routers/reporting.test.ts`.

**Build.**

- [ ] Add branded `ReportId` and `ReportRange` types in `lib/reporting/types.ts` plus `PayrollSummary` and `HeadcountSummary` and `AttendanceSummary` and `PipelineSummary` and `BillingSummary` and `SyncSummary` views.
- [ ] Add pure aggregators in `lib/reporting/aggregates.ts` that take repo result arrays and return `Cents` totals and counts without I O.
- [ ] Add `reportingRepo` factory in `server/repo/reporting.ts` that is scoped by `TenantId` and fetches existing Prisma models and maps to views with `Cents` preservation.
- [ ] Add `reportingRouter` in `server/trpc/routers/reporting.ts` with `protectedProcedure` reads and `zod` range validation and tenant injection.

**You see.**

- [ ] `reporting.overview` returns tenant scoped totals that match direct Prisma counts for the same tenant and empty for other tenant.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `lib/reporting/aggregates.test.ts` covers empty input and single period and multi period and Cents reconciliation and unpaid leave exclusion parity with `payrun` logic. Run `bun run test -- lib/reporting/aggregates.test.ts`.
- [ ] `server/repo/reporting.test.ts` proves tenancy isolation and cross tenant empty and Cents integrity for payroll and invoice sums. Run `bun run test -- server/repo/reporting.test.ts`.
- [ ] `server/trpc/routers/reporting.test.ts` proves `protectedProcedure` rejects unauthed and `rbacAnyProcedure` allows viewer roles and input validation rejects bad date. Run `bun run test -- server/trpc/routers/reporting.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Seed two tenants each with employees and payruns and invoices, call `reporting.overview` as tenant A via `fetch` to `api/trpc/reporting.overview` and assert tenant A totals non zero and tenant B data not leaked. Save `rep1-overview-a.png`. Pass when JSON shows tenant A counts and no B ids.
- [ ] Lane 2. Call `reporting.payrollSeries` for 6 months and verify gross equals deductions plus tax plus net per point. Save `rep1-payroll-series.png`. Pass when series length 6 and reconciliation holds.
- [ ] Lane 3. Call `reporting.headcount` and verify sum equals `employee.list` count for same tenant. Save `rep1-headcount.png`. Pass when counts match.
- [ ] Lane 4. Call `reporting.attendance` for current month and verify approved only count matches `timeEntry.list` filtered approved. Save `rep1-attendance.png`. Pass when counts match.
- [ ] Lane 5. Call `reporting.pipeline` and verify stage funnel sums to total candidates and matches `candidate.list` by stage. Save `rep1-pipeline.png`. Pass when funnel sum equals total.
- [ ] Lane 6. Call `reporting.billing` and verify invoice sum in `Cents` equals `billing.listInvoices` sum for same range. Save `rep1-billing.png`. Pass when sums equal.
- [ ] Lane 7. Call `reporting.syncHealth` and verify failed plus success equals `integration.listSyncs` count. Save `rep1-sync.png`. Pass when counts match.
- [ ] Lane 8. Call `reporting.overview` unauthed without cookie and expect `UNAUTHORIZED`. Save `rep1-unauth.png`. Pass when 401 error code returned.
- [ ] Lane 9. Inject `tenantId` in input body and verify router ignores it and still returns caller tenant data only. Save `rep1-tenant-injection.png`. Pass when response tenantId equals session tenantId not injected value.
- [ ] Lane 10. Run time window edge case with periodStart equal periodEnd and verify single day aggregation returns correct empty or single point without throw. Save `rep1-edge.png`. Pass when 200 and array length 0 or 1 without error.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `reporting.overview` p95 latency for tenant with 500 employees and 100 payruns and 100 invoices.
- [ ] Probe. `bun` script that calls `reporting.overview` 50 times interleaved trunk vs head via `fetch` to `api/trpc/reporting.overview` on seeded DB, measured with `performance.now`.
- [ ] Baseline. Record trunk p95 first.
- [ ] Rule. Head p95 not more than 15 percent above baseline and not above 400 ms, otherwise fail.

**Review gate.** None.

**Merge.**

- [ ] Root clean verdict at exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after verdict, patch id unchanged.
- [ ] Root appends PR to Graphite stack and operator lands it.

## Reporting dashboard and export (REP-2)

**Depends on.** REP-1.

**Files.**

- [ ] Edit `app/dashboard/page.tsx`.
- [ ] Edit `components/dashboard/payroll-chart.tsx`.
- [ ] Edit `components/dashboard/stat-cards.tsx`.
- [ ] Edit `components/dashboard/attendance-card.tsx`.
- [ ] Create `components/dashboard/reporting-section.tsx`.
- [ ] Create `components/dashboard/pipeline-chart.tsx`.
- [ ] Create `lib/reporting/csv.ts`.
- [ ] Create `app/api/reporting/export/route.ts`.
- [ ] Create `components/dashboard/export-button.test.ts` or `lib/reporting/csv.test.ts`.

**Build.**

- [ ] Replace `lib/dashboard-data.ts` stub reads with `trpc.reporting` queries in `app/dashboard/page.tsx` and keep fallback to stub when query pending.
- [ ] Add `reporting-section.tsx` that composes `PayrollChart` and `PipelineChart` and stat cards from live data using `recharts` and `ChartContainer`.
- [ ] Add CSV export helper in `lib/reporting/csv.ts` that builds RFC4180 rows from `Reporting` views and `Cents` to major conversion without float.
- [ ] Add `api/reporting/export` route that validates range with `zod` and checks session and streams CSV with tenant filter.

**You see.**

- [ ] Dashboard at `http://localhost:3000/dashboard` shows live payroll chart and headcount and pipeline funnel matching seed, and clicking Export downloads CSV with header row.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `lib/reporting/csv.test.ts` covers header and escaping and `Cents` to dollars and empty input and tenant isolation via pure function. Run `bun run test -- lib/reporting/csv.test.ts`.
- [ ] Component test or `reporting` router mock renders `reporting-section.tsx` with seeded props and asserts chart points length. Run `bun run test -- components/dashboard/reporting-section.test.tsx` or `lib/reporting/csv.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Open `http://localhost:3000/dashboard` as authed tenant A and assert stat cards show live headcount not stub. Save `rep2-stats-live.png`. Pass when card values match `reporting.overview` JSON.
- [ ] Lane 2. Assert payroll `AreaChart` renders 6 points and tooltip shows gross and net `Cents` derived values. Save `rep2-payroll-chart.png`. Pass when SVG with 6 dot elements visible.
- [ ] Lane 3. Assert pipeline funnel chart renders stages applied through hired and total matches overview. Save `rep2-pipeline.png`. Pass when bars count equals stage count.
- [ ] Lane 4. Filter reporting by date range 2026-01-01 to 2026-03-01 via UI control and assert chart updates and network shows `reporting.payrollSeries` with range. Save `rep2-filter.png`. Pass when filtered points length less than unfiltered.
- [ ] Lane 5. Click Export CSV and verify download has header `period,gross,net,tax` and rows count equals series length. Save `rep2-export-csv.png`. Pass when file content starts with header and row count matches.
- [ ] Lane 6. Open dashboard as tenant B and verify no tenant A employee names appear. Save `rep2-tenant-b.png`. Pass when employee table not contain tenant A name.
- [ ] Lane 7. Open dashboard unauthed and verify redirect to `login` with `next` param. Save `rep2-unauth-redirect.png`. Pass when URL contains `login`.
- [ ] Lane 8. Set viewport 390 width and assert dashboard stacks to single column without overflow and export button visible. Save `rep2-mobile.png`. Pass when no horizontal scroll and button in viewport.
- [ ] Lane 9. Trigger export with empty range and verify CSV is header only and 200 status. Save `rep2-export-empty.png`. Pass when body equals header plus newline only.
- [ ] Lane 10. Check accessibility of chart via keyboard Tab to chart and export button and verify focus ring visible. Save `rep2-a11y.png`. Pass when focused element has visible ring.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Dashboard first contentful paint and `reporting.overview` fetch time on cold load.
- [ ] Probe. Run `npx lighthouse http://localhost:3000/dashboard --only-categories=performance` and `fetch` timing for `api/trpc/reporting.overview`, trunk vs head interleaved 10 runs each.
- [ ] Baseline. Record trunk FCP and fetch p50 first.
- [ ] Rule. Head FCP not more than 10 percent above baseline and fetch p50 not more than 15 percent above baseline, otherwise fail.

**Review gate.**

- [ ] Copy lane 1 and lane 2 and lane 5 screenshots into `media/reporting/REP-2-review-stats.png` and `media/reporting/REP-2-review-chart.png` and `media/reporting/REP-2-review-export.png`.
- [ ] Record a 30 to 60 second video of the dashboard live data and filter and export on a lane VM. Save it as `media/reporting/REP-2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge ready. Wait for the operator click.

**Merge.**

- [ ] Root clean verdict at exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after verdict, patch id unchanged.
- [ ] Root appends PR to Graphite stack and operator lands it.

## Audit log and hardening (HARD-1)

**Depends on.** REP-2.

**Files.**

- [ ] Create `prisma/schema.prisma` model `AuditLog`.
- [ ] Create `lib/audit/types.ts`.
- [ ] Create `server/repo/audit.ts`.
- [ ] Create `server/trpc/routers/audit.ts`.
- [ ] Edit `server/trpc/routers/_app.ts`.
- [ ] Edit `proxy.ts`.
- [ ] Create `lib/rate-limit.ts`.
- [ ] Create `server/repo/audit.test.ts`.

**Build.**

- [ ] Add `AuditLog` model with `tenantId` and `actorId` and `action` and `targetType` and `targetId` and `createdAt` plus `@@index([tenantId, createdAt])`.
- [ ] Add `auditRepo` factory scoped by `TenantId` that appends only and lists by `tenantId` and never deletes.
- [ ] Add `rateLimit` helper using in memory bucket per `tenantId` plus `ip` with window and burst, applied in `proxy.ts` for `api/trpc` and `api/auth`.
- [ ] Wire audit writes into `payrun` and `billing` and `integration` and `reporting` export mutations without changing existing return shapes.

**You see.**

- [ ] Creating a payrun then listing `audit.list` for same tenant shows entry with actorId equal session user and action `payrun.create` and list for other tenant is empty.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `server/repo/audit.test.ts` proves tenant isolation and append only and action enum and query by range. Run `bun run test -- server/repo/audit.test.ts`.
- [ ] `lib/rate-limit.test.ts` proves bucket refill and burst cap and per tenant isolation. Run `bun run test -- lib/rate-limit.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Create payrun as tenant A and fetch `audit.list` and assert new entry exists with correct tenantId and action. Save `hard1-audit-create.png`. Pass when entry found and tenantId matches.
- [ ] Lane 2. Fetch `audit.list` as tenant B and assert no tenant A entry leaked. Save `hard1-tenant-b.png`. Pass when list empty or only B entries.
- [ ] Lane 3. Call `reporting.export` and assert audit entry with action `reporting.export`. Save `hard1-export-audit.png`. Pass when entry found.
- [ ] Lane 4. Unauthed call to `audit.list` returns `UNAUTHORIZED`. Save `hard1-unauth.png`. Pass when 401.
- [ ] Lane 5. Injection of `tenantId` in audit create body is ignored and stored tenantId equals session tenantId. Save `hard1-injection.png`. Pass when stored tenantId equals session value.
- [ ] Lane 6. Burst 20 `api/trpc/audit.list` calls in 1 second and verify rate limit returns 429 after threshold. Save `hard1-ratelimit.png`. Pass when 429 seen.
- [ ] Lane 7. Verify `proxy.ts` still redirects unauthed `dashboard` to `login` with `next` param while audit routes also gated. Save `hard1-proxy.png`. Pass when redirect contains `next`.
- [ ] Lane 8. Verify audit log is append only by attempting delete via direct `prisma` and via router and both fail or are not exposed. Save `hard1-appendonly.png`. Pass when no delete procedure exists.
- [ ] Lane 9. Verify audit entries survive server restart by creating entry then restarting dev and listing again. Save `hard1-persist.png`. Pass when entry still present.
- [ ] Lane 10. Verify perf of audit list with 1000 entries still under threshold and pagination works. Save `hard1-paginate.png`. Pass when second page returns next cursor and latency under 400 ms.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `audit.list` p95 latency with 1000 rows per tenant.
- [ ] Probe. Script that seeds 1000 audit rows then calls `audit.list` 50 times trunk vs head interleaved via `fetch` to `api/trpc/audit.list`.
- [ ] Baseline. Record trunk p95 first.
- [ ] Rule. Head p95 not more than 20 percent above baseline and not above 350 ms, otherwise fail.

**Review gate.** None.

**Merge.**

- [ ] Root clean verdict at exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after verdict, patch id unchanged.
- [ ] Root appends PR to Graphite stack and operator lands it.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

No prototype branch was needed. Open questions were settled by reading existing code and by reusing proven patterns. Reporting aggregation reuses the pure function pattern from `lib/payroll/engine.ts` and the `tenantId` factory pattern from `server/repo/employee.ts` and `server/repo/billing.ts`. CSV export reuses `lib/money.ts` `Cents` to major conversion and RFC4180 escaping proven in prior export helpers. The question of chart library was settled by existing `recharts` 3.8 and `components/ui/chart.tsx` wrapper, so no new dependency. Questions that stay open are product calls. Retention window for audit log and whether to persist `ReportSnapshot` vs live query, and whether PDF export is in scope for v1.

## Appendix B. Alternatives rejected

Live query vs stored snapshot for reporting. Stored snapshot was rejected for v1. Live query keeps correctness simple, avoids stale snapshots, and matches current `payrun.timeSummary` approach that filters in app. Snapshot can be added later if perf gate fails.

Separate `Report` Prisma models vs aggregation over existing models. New models were rejected. They would duplicate `PayRun` and `Invoice` data and need backfill. Aggregation over existing tenant indexed models preserves single source of truth and tenancy indexes already exist.

CSV only vs CSV plus PDF. PDF was rejected for REP-2. PDF needs a heavy dependency and breaks the narrow scope. Ship CSV first, add PDF under a follow up PR if operator requests.

In memory rate limit vs Redis. Redis was rejected for v1. In memory bucket per `tenantId` is enough for monolith single instance and has no infra cost. Swap to Redis when horizontal scaling lands.

Append only `AuditLog` collection vs updateable log. Updateable was rejected. Audit must be immutable for compliance, so repo exposes no update or delete and `proxy` never exposes delete route.

## Appendix C. Risks

REP-1 aggregation over many rows may be slow without pagination. Mitigation is indexed queries on `tenantId` plus `createdAt` and `periodStart`, and perf gate at 400 ms p95. Owner watches slow query logs during swarm.

CSV export may leak PII if decrypted fields are included. Mitigation is export only aggregates and ids, never `ssnEnc` or `bankEnc` plaintext, and test asserts header allow list.

Tenant isolation regression in new repo. Mitigation is reuse of `reportingRepo` factory and `where tenantId` pattern, and dedicated cross tenant tests that assert empty for other tenant.

Rate limit in memory resets on restart and does not protect across instances. Mitigation is documented as v1 limitation and gated by burst test, with upgrade path to Redis noted.

Audit log growth without TTL may bloat DB. Mitigation is `createdAt` index and pagination via cursor, and follow up TTL job if size exceeds threshold.

## Appendix D. Links and reading list

Docs to read before editing.

- `docs/system-design.md` section 4.8 and 4.9 and section 12 build sequence
- `docs/build-plan-foundation.md` adapted verification and tenant and money invariants
- `docs/design.md` lines 112 to 209 placeholder note for billing context
- `prisma/schema.prisma` existing tenant indexed models
- `server/trpc/init.ts` context and `rbacAnyProcedure`
- `lib/money.ts` and `lib/crypto.ts` and `lib/types.ts` branded types
- `server/repo/employee.ts` and `server/repo/billing.ts` and `server/repo/payrun.ts` as repo pattern reference
- `components/ui/chart.tsx` and `lib/dashboard-data.ts` for chart and stub replacement reference
- `proxy.ts` for auth guard and rate limit insertion point

PRs that get `pstack/skills/how/SKILL.md` are REP-1 and HARD-1 for aggregation and rate limit design. PRs that get `pstack/skills/interrogate/SKILL.md` are REP-1 for tenancy and Cents correctness. Trail per `pstack/skills/show-me-your-work/SKILL.md` is kept locally and returned in owner reports and never committed.
