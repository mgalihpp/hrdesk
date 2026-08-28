# Recruitment Implementation Plan — Phase 3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Recruitment bounded context (REC) so an HR user can post jobs, track candidates through a pipeline, and hire a candidate into an Employee record with encrypted PII reuse. Tenancy and RBAC are enforced by construction, hire is idempotent, and the pipeline is a typed state machine.

**Architecture:** Thin tRPC boundary → repo factories scoped by `tenantId` from session → Prisma MongoDB. No new infrastructure. `hire` reuses `employeeRepo` and `lib/crypto` — same PII boundary as `server/repo/employee.ts:21`. Pipeline stages are a branded union with an explicit transition table, not scattered `if` checks. Mirrors `payrun` and `timeEntry` patterns already in `server/trpc/routers/_app.ts:9`.

**Tech Stack:** Next.js 16, React 19, Prisma 6 with MongoDB, Better Auth 1.7 organization plugin, tRPC 11, zod 4, Vitest 4, Biome 2, TypeScript strict, Bun 1.4

**Spec:** `docs/system-design.md` §4.5 Recruitment, §5 Data Model (candidate/job), §6.3 Recruitment→Hire, §7 Multi-Tenancy, §8 Security (PII at rest), plus operator decisions in `docs/build-plan-foundation.md` (Better Auth org, Cents, AES-GCM)

---

## Global Constraints

- `tenantId` is branded `TenantId` from `lib/types.ts:4` and comes from `auth.api.getSession` active organization via `server/trpc/init.ts:18`. Never from body or URL. Every query filters by `tenantId`.
- Money is integer minor units `Cents` from `lib/money.ts:4`. Candidate has no money field in v1; `hire` creates Employee with `compensation: Cents` supplied at hire time.
- PII (candidate email, phone) encrypted with `encrypt`/`decrypt` from `lib/crypto.ts` when marked sensitive. Decrypt only in `toView` at read, same as `employeeRepo`.
- RBAC via `rbacAnyProcedure` in `server/trpc/init.ts:54`. Write requires `owner`, `admin`, or `hr`. Read requires any authenticated role (`protectedProcedure`). `hire` requires `owner`, `admin`, or `hr` (not `manager`/`employee`).
- Pipeline is a state machine. Only declared transitions allowed. `hired` and `rejected` are terminal.
- Hire is idempotent. Once `candidate.hiredEmployeeId` is set, re-hiring returns the same Employee. Guarded by unique candidate id and `status: hired` check plus existing employee lookup. No duplicate Employee on retry.
- Prisma Mongo has no `$transaction`. Writes are sequential. `candidate` update + `employee` create are two writes with app-level idempotency (same as `payRunRepo` v1).
- All public inputs validated with zod at the tRPC boundary. Pure helpers trust parsed types.
- Package manager Bun 1.4.0, Biome 2.4.2, Tailwind v4. No ESLint/Prettier.

---

## File Structure

New or modified files and single responsibility:

- `lib/recruitment/types.ts` — branded ids and domain types. No I/O. Source of truth for `JobId`, `CandidateId`, `JobStatus`, `CandidateStage`, transition table, `Job`, `Candidate`, `CandidateView`.
- `lib/recruitment/pipeline.ts` — pure pipeline helpers. Exports `CANDIDATE_STAGES`, `isValidStage`, `canTransition`, `nextStages`. No DB.
- `prisma/schema.prisma` — add models `Job` and `Candidate`. Each carries `tenantId String` indexed, `@map` names. `Candidate` links to `Job` via `jobId String @db.ObjectId`, `stage String @default("applied")`, `hiredEmployeeId String? @db.ObjectId`, `emailEnc`/`phoneEnc` encrypted, indexes on `[tenantId]`, `[tenantId, jobId]`, `[tenantId, stage]`.
- `server/repo/job.ts` — tenancy boundary. Factory `jobRepo(prisma, tenantId)` returns `{ create, list, getById, update, close, remove }`. Every query includes `tenantId`.
- `server/repo/candidate.ts` — tenancy + PII boundary. Factory `candidateRepo(prisma, tenantId)` returns `{ create, list, listByJob, getById, moveStage, hire }`. `create` encrypts phone/email. `toView` decrypts. `moveStage` enforces `canTransition`. `hire` is idempotent: if `hiredEmployeeId` exists, return existing employee view without creating a duplicate.
- `server/trpc/routers/job.ts` — tRPC surface for jobs. `create`, `list`, `byId`, `update`, `close`.
- `server/trpc/routers/candidate.ts` — tRPC surface for candidates. `create`, `list`, `listByJob`, `byId`, `moveStage`, `hire`. `hire` input includes `compensation` (Cents), `hireDate`, validates candidate is in `offer` stage before hire.
- `server/trpc/routers/_app.ts` — register `job: jobRouter` and `candidate: candidateRouter`.
- `lib/types.ts` — add `JobId`, `CandidateId` branded types.
- Tests:
  - `lib/recruitment/pipeline.test.ts` — stage validity, transition guards, terminal states.
  - `server/repo/job.test.ts` — tenancy scoping, CRUD filtered by tenant.
  - `server/repo/candidate.test.ts` — tenancy, PII round-trip, stage transitions, hire idempotency.
  - `server/trpc/routers/job.test.ts` — RBAC rejects for `employee` on create, succeeds for `hr`.
  - `server/trpc/routers/candidate.test.ts` — RBAC, moveStage guard, hire requires offer stage, double hire returns same employee.

---

### Task 1: Domain types and branded ids

**Files:**
- Create: `lib/recruitment/types.ts`
- Modify: `lib/types.ts:28` — add `JobId`, `CandidateId`
- Test: `lib/recruitment/pipeline.test.ts` (covers pipeline helpers; types are compile-time)

**Interfaces:**
- Consumes: `TenantId`, `EmployeeId` from `lib/types.ts`
- Produces: `JobId`, `CandidateId`, `JobStatus`, `CandidateStage`, `CANDIDATE_STAGES`, `CANDIDATE_TRANSITIONS`, `Job`, `Candidate`, `CandidateView` — imported by `lib/recruitment/pipeline.ts`, `server/repo/job.ts`, `server/repo/candidate.ts`, `server/trpc/routers/*`

- [ ] **Step 1: Write the failing test**

```ts
// lib/recruitment/pipeline.test.ts
import { describe, expect, it } from "vitest";
import { CANDIDATE_STAGES, canTransition, isValidStage } from "@/lib/recruitment/pipeline";

describe("candidate pipeline", () => {
  it("accepts only declared stages", () => {
    expect(isValidStage("applied")).toBe(true);
    expect(isValidStage("screening")).toBe(true);
    expect(isValidStage("interview")).toBe(true);
    expect(isValidStage("offer")).toBe(true);
    expect(isValidStage("hired")).toBe(true);
    expect(isValidStage("rejected")).toBe(true);
    expect(isValidStage("deleted")).toBe(false);
  });
  it("allows only declared transitions", () => {
    expect(canTransition("applied", "screening")).toBe(true);
    expect(canTransition("screening", "interview")).toBe(true);
    expect(canTransition("interview", "offer")).toBe(true);
    expect(canTransition("offer", "hired")).toBe(true);
    expect(canTransition("applied", "rejected")).toBe(true);
    expect(canTransition("applied", "hired")).toBe(false);
    expect(canTransition("hired", "rejected")).toBe(false);
  });
  it("terminal stages have no outgoing transitions", () => {
    expect(canTransition("hired", "applied")).toBe(false);
    expect(canTransition("rejected", "screening")).toBe(false);
  });
  it("stages is the union", () => {
    expect(CANDIDATE_STAGES).toEqual(["applied", "screening", "interview", "offer", "hired", "rejected"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/recruitment/pipeline.test.ts`
Expected: FAIL with `Cannot find module '@/lib/recruitment/pipeline'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/recruitment/types.ts
import type { EmployeeId, TenantId } from "@/lib/types";

export type JobId = string & { readonly __brand: "JobId" };
export type CandidateId = string & { readonly __brand: "CandidateId" };

export const JOB_STATUS = ["open", "closed", "archived"] as const;
export type JobStatus = (typeof JOB_STATUS)[number];

export const CANDIDATE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const CANDIDATE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
  applied: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

export interface Job {
  id: JobId;
  tenantId: TenantId;
  title: string;
  department: string | null;
  description: string | null;
  status: JobStatus;
  createdAt: string;
}

export interface Candidate {
  id: CandidateId;
  tenantId: TenantId;
  jobId: JobId;
  firstName: string;
  lastName: string;
  email: string; // decrypted view
  phone: string | null; // decrypted view
  stage: CandidateStage;
  hiredEmployeeId: EmployeeId | null;
  createdAt: string;
}
export interface CandidateView extends Candidate {}

export interface NewJob {
  title: string;
  department?: string | null;
  description?: string | null;
}

export interface NewCandidate {
  jobId: JobId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}
```

```ts
// lib/recruitment/pipeline.ts
import { CANDIDATE_STAGES, CANDIDATE_TRANSITIONS, type CandidateStage } from "@/lib/recruitment/types";

export { CANDIDATE_STAGES, CANDIDATE_TRANSITIONS };
export type { CandidateStage };

export function isValidStage(v: string): v is CandidateStage {
  return (CANDIDATE_STAGES as readonly string[]).includes(v);
}

export function canTransition(from: CandidateStage, to: CandidateStage): boolean {
  return CANDIDATE_TRANSITIONS[from].includes(to);
}

export function nextStages(from: CandidateStage): CandidateStage[] {
  return CANDIDATE_TRANSITIONS[from];
}
```

```ts
// lib/types.ts — append after LeaveId
export type JobId = string & { readonly __brand: "JobId" };
export type CandidateId = string & { readonly __brand: "CandidateId" };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/recruitment/pipeline.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recruitment/types.ts lib/recruitment/pipeline.ts lib/types.ts lib/recruitment/pipeline.test.ts
git commit -m "feat(recruitment): add pipeline state machine and branded ids"
```

---

### Task 2: Prisma models and repo factories (tenancy + PII)

**Files:**
- Modify: `prisma/schema.prisma` — add `Job` and `Candidate`
- Create: `server/repo/job.ts`
- Create: `server/repo/candidate.ts`
- Tests: `server/repo/job.test.ts`, `server/repo/candidate.test.ts`

**Interfaces:**
- Consumes: `TenantId`, `JobId`, `CandidateId`, `EmployeeId` from `lib/types.ts` + `lib/recruitment/types.ts`, `encrypt`/`decrypt` from `lib/crypto.ts`, `canTransition` from `lib/recruitment/pipeline.ts`, `employeeRepo` from `server/repo/employee.ts`, `cents` from `lib/money.ts`
- Produces: `jobRepo(prisma, tenantId)` and `candidateRepo(prisma, tenantId)` — consumed by `server/trpc/routers/job.ts` and `candidate.ts`

**Schema:**

```prisma
model Job {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId    String
  title       String
  department  String?
  description String?
  status      String   @default("open")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, status])
  @@map("job")
}

model Candidate {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId        String
  jobId           String   @db.ObjectId
  firstName       String
  lastName        String
  emailEnc        String
  phoneEnc        String?
  stage           String   @default("applied")
  hiredEmployeeId String?  @db.ObjectId
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, jobId])
  @@index([tenantId, stage])
  @@map("candidate")
}
```

**Repo contracts:**

```ts
// server/repo/job.ts
export function jobRepo(prisma: PrismaClient, tenantId: TenantId) {
  // create(input: NewJob): Promise<Job>
  // list(): Promise<Job[]>
  // getById(id: JobId): Promise<Job | null>
  // update(id: JobId, patch: Partial<NewJob>): Promise<void>
  // close(id: JobId): Promise<void>  // sets status = "closed"
  // remove(id: JobId): Promise<void>
  // every where clause includes tenantId
}

// server/repo/candidate.ts
export function candidateRepo(prisma: PrismaClient, tenantId: TenantId) {
  // toView(row): CandidateView — decrypt emailEnc/phoneEnc
  // create(input: NewCandidate): Promise<CandidateView>  — validates job belongs to tenant, encrypts PII
  // list(): Promise<CandidateView[]>
  // listByJob(jobId: JobId): Promise<CandidateView[]>
  // getById(id: CandidateId): Promise<CandidateView | null>
  // moveStage(id: CandidateId, to: CandidateStage): Promise<CandidateView> — throws if !canTransition(from, to)
  // hire(id: CandidateId, input: { compensation: number; hireDate: string }): Promise<EmployeeView>
  //   — guards: candidate exists, stage === "offer" or "hired" (idempotent), if stage === "hired" and hiredEmployeeId set, return existing employee
  //   — else: create employee via employeeRepo(prisma, tenantId).create({ firstName, lastName, email, ssn: "", bank: "", compensation, hireDate, status: "active" })
  //   — then update candidate { stage: "hired", hiredEmployeeId: employee.id }
  //   — return employee view
  // All queries include tenantId. PII encrypted at write, decrypted at read.
}
```

- [ ] **Step 1: Write the failing tests**

```ts
// server/repo/job.test.ts
import { describe, expect, it, vi } from "vitest";
import type { TenantId } from "@/lib/types";
import { jobRepo } from "@/server/repo/job";

const tenantA = "aaaaaaaaaaaaaaaaaaaaaaaa" as TenantId;
const tenantB = "bbbbbbbbbbbbbbbbbbbbbbbb" as TenantId;

function mockPrisma() { /* mocked prisma.job with tenancy assertions */ }

describe("jobRepo tenancy", () => {
  it("create includes tenantId", async () => {});
  it("list filters by tenantId", async () => {});
  it("getById returns null for other tenant", async () => {});
  it("close is idempotent for already closed", async () => {});
});
```

```ts
// server/repo/candidate.test.ts
import { describe, expect, it } from "vitest";
import type { TenantId } from "@/lib/types";
import { candidateRepo } from "@/server/repo/candidate";

describe("candidateRepo", () => {
  it("encrypts PII at write and decrypts at read", async () => {});
  it("tenant isolation: candidate in A invisible to B", async () => {});
  it("moveStage rejects illegal transition", async () => {});
  it("moveStage allows legal transition", async () => {});
  it("hire requires offer stage", async () => {});
  it("hire is idempotent: second call returns same employee, no duplicate", async () => {});
  it("hire creates employee with provided compensation", async () => {});
});
```

Use mocked Prisma pattern from `server/repo/employee.tenant.test.ts:1` and `server/repo/payrun.test.ts:1`. Do not use a real DB in unit tests. Follow the `mockPrisma` shape already in repo: `prisma.job.create`, `prisma.job.findMany`, etc. Assert `where: { tenantId }` is always present.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- server/repo/job.test.ts server/repo/candidate.test.ts`
Expected: FAIL with `Cannot find module '@/server/repo/job'`

- [ ] **Step 3: Write minimal implementation**

Implement both repos following `server/repo/employee.ts:21` exactly: `toView` decrypts, `create` encrypts, all `find*` include `{ tenantId }`, `updateMany`/`deleteMany` with `{ id, tenantId }`. `candidateRepo.create` must verify the referenced job exists and belongs to same tenant (query `prisma.job.findFirst({ where: { id: jobId, tenantId } })`) otherwise throw `NOT_FOUND`.

`hire` pseudocode:

```ts
async hire(id: CandidateId, input: { compensation: number; hireDate: string }) {
  const row = await prisma.candidate.findFirst({ where: { id: id as string, tenantId } });
  if (!row) throw new Error("Candidate not found");
  if (row.hiredEmployeeId) {
    const existing = await prisma.employee.findFirst({ where: { id: row.hiredEmployeeId, tenantId } });
    if (existing) return toEmployeeView(existing);
  }
  if (row.stage !== "offer") throw new Error("Candidate must be in offer stage to hire");
  const view = toView(row);
  const emp = await prisma.employee.create({
    data: {
      tenantId,
      firstName: view.firstName,
      lastName: view.lastName,
      email: view.email,
      ssnEnc: encrypt(""),
      bankEnc: encrypt(""),
      compensation: cents(input.compensation),
      hireDate: input.hireDate,
      status: "active",
    },
  });
  await prisma.candidate.updateMany({
    where: { id: id as string, tenantId },
    data: { stage: "hired", hiredEmployeeId: emp.id },
  });
  return toEmployeeView(emp);
}
```

Note: `encrypt("")` for SSN/bank when hiring from candidate — candidate PII does not include those fields in v1. Future iteration can collect them at offer stage.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- server/repo/job.test.ts server/repo/candidate.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

Run: `bun run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma server/repo/job.ts server/repo/candidate.ts server/repo/job.test.ts server/repo/candidate.test.ts
git commit -m "feat(recruitment): add Job and Candidate models with tenancy and PII repos"
```

After this commit, run `bun run db:generate` locally and verify the generated client includes `Job` and `Candidate`. CI runs it as `bun run db:generate` before lint/typecheck.

---

### Task 3: tRPC routers and RBAC

**Files:**
- Create: `server/trpc/routers/job.ts`
- Create: `server/trpc/routers/candidate.ts`
- Modify: `server/trpc/routers/_app.ts:9` — register `job` and `candidate`
- Tests: `server/trpc/routers/job.test.ts`, `server/trpc/routers/candidate.test.ts`

**Interfaces:**
- Consumes: `jobRepo`, `candidateRepo`, `createTRPCRouter`, `protectedProcedure`, `rbacAnyProcedure` from `server/trpc/init.ts`, `CANDIDATE_STAGES` from `lib/recruitment/types.ts`
- Produces: `jobRouter` and `candidateRouter` mounted on `appRouter`

**Router specs:**

```ts
// server/trpc/routers/job.ts
const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const jobRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES).input(z.object({
    title: z.string().min(2).max(120),
    department: z.string().max(80).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
  })).mutation(({ ctx, input }) => jobRepo(ctx.prisma, ctx.session.tenantId).create(input)),

  list: protectedProcedure.query(({ ctx }) => jobRepo(ctx.prisma, ctx.session.tenantId).list()),

  byId: protectedProcedure.input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => jobRepo(ctx.prisma, ctx.session.tenantId).getById(input.id as JobId)),

  update: rbacAnyProcedure(WRITE_ROLES).input(z.object({
    id: z.string(), title: z.string().min(2).max(120).optional(),
    department: z.string().max(80).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
  })).mutation(({ ctx, input }) => jobRepo(ctx.prisma, ctx.session.tenantId).update(input.id as JobId, input)),

  close: rbacAnyProcedure(WRITE_ROLES).input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => jobRepo(ctx.prisma, ctx.session.tenantId).close(input.id as JobId)),

  remove: rbacAnyProcedure(WRITE_ROLES).input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => jobRepo(ctx.prisma, ctx.session.tenantId).remove(input.id as JobId)),
});
```

```ts
// server/trpc/routers/candidate.ts
const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

export const candidateRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES).input(z.object({
    jobId: z.string().min(1),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().max(20).nullable().optional(),
  })).mutation(({ ctx, input }) => candidateRepo(ctx.prisma, ctx.session.tenantId).create(input as NewCandidate)),

  list: protectedProcedure.query(({ ctx }) => candidateRepo(ctx.prisma, ctx.session.tenantId).list()),

  listByJob: protectedProcedure.input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) => candidateRepo(ctx.prisma, ctx.session.tenantId).listByJob(input.jobId as JobId)),

  byId: protectedProcedure.input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => candidateRepo(ctx.prisma, ctx.session.tenantId).getById(input.id as CandidateId)),

  moveStage: rbacAnyProcedure(WRITE_ROLES).input(z.object({
    id: z.string(), to: z.enum(CANDIDATE_STAGES),
  })).mutation(({ ctx, input }) => candidateRepo(ctx.prisma, ctx.session.tenantId).moveStage(input.id as CandidateId, input.to)),

  hire: rbacAnyProcedure(WRITE_ROLES).input(z.object({
    id: z.string(),
    compensation: z.number().int().min(0),
    hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).mutation(({ ctx, input }) => candidateRepo(ctx.prisma, ctx.session.tenantId).hire(input.id as CandidateId, { compensation: input.compensation, hireDate: input.hireDate })),
});
```

Validation at the boundary only. Internals trust branded ids.

- [ ] **Step 1: Write the failing tests**

```ts
// server/trpc/routers/job.test.ts
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/trpc/routers/_app";
import { createTRPCContext } from "@/server/trpc/init";

describe("job router RBAC", () => {
  it("rejects employee on create", async () => {});
  it("allows hr on create", async () => {});
  it("allows any authed on list", async () => {});
});

// server/trpc/routers/candidate.test.ts
describe("candidate router", () => {
  it("rejects employee on create", async () => {});
  it("moveStage rejects illegal transition", async () => {});
  it("hire requires offer stage, throws otherwise", async () => {});
  it("hire is idempotent on retry", async () => {});
  it("tenant isolation: listByJob empty for other tenant", async () => {});
});
```

Mock `createTRPCContext` returning `{ session: { tenantId, roles }, prisma: mockPrisma }` like `server/trpc/routers/payrun.test.ts:1` does. Test both RBAC and tenancy.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- server/trpc/routers/job.test.ts server/trpc/routers/candidate.test.ts`
Expected: FAIL with `Cannot find module '@/server/trpc/routers/job'`

- [ ] **Step 3: Write minimal implementation**

Implement both routers as above. Wire into `_app.ts`:

```ts
import { candidateRouter } from "./candidate";
import { jobRouter } from "./job";
export const appRouter = createTRPCRouter({
  // ...existing
  job: jobRouter,
  candidate: candidateRouter,
});
```

No other files change.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- server/trpc/routers/job.test.ts server/trpc/routers/candidate.test.ts`
Expected: PASS

Run: `bun run typecheck && bun run lint && bun run test`
Expected: PASS (full suite, 15 + new tests)

Run: `bun run build`
Expected: PASS (Next build gate from CI)

- [ ] **Step 5: Commit**

```bash
git add server/trpc/routers/job.ts server/trpc/routers/candidate.ts server/trpc/routers/_app.ts server/trpc/routers/job.test.ts server/trpc/routers/candidate.test.ts
git commit -m "feat(recruitment): add job and candidate tRPC routers with RBAC"
```

---

### Task 4: Live verification and hardening

**Files:** none (verification only)

- [ ] **Step 1: Live HTTP check (scripted)**

Boot `bun run dev` with a test Mongo. Script:

```bash
# 1. Register user, create org, set-active (via Better Auth API)
# 2. POST /api/trpc/job.create { title: "FE Eng", department: "Eng" } → 200, capture jobId
# 3. POST /api/trpc/candidate.create { jobId, firstName: "A", lastName: "B", email: "a@b.co" } → 200
# 4. POST /api/trpc/candidate.moveStage { id: candId, to: "screening" } → 200
# 5. POST /api/trpc/candidate.moveStage { id: candId, to: "interview" } → 200
# 6. POST /api/trpc/candidate.moveStage { id: candId, to: "offer" } → 200
# 7. POST /api/trpc/candidate.hire { id: candId, compensation: 8000000, hireDate: "2026-08-28" } → 200, employeeId returned
# 8. GET /api/trpc/employee.list → new employee present
# 9. POST /api/trpc/candidate.hire same id again → 200 same employeeId, employee.list still one entry (idempotency)
# 10. As second tenant (different org), GET /api/trpc/candidate.list → empty, GET /api/trpc/job.list → empty
```

Document the curl/fetch script in the PR description. Fails closed if any step returns cross-tenant data or duplicate employee.

- [ ] **Step 2: Property/invariant checks**

- `hire` with `compensation` non-integer → zod rejects (400).
- `moveStage` with garbage stage → zod rejects.
- `moveStage` illegal (applied → hired) → repo throws, router surfaces as 400.
- `hire` when stage != offer and not already hired → throws.

No new property test file required. Extend `lib/recruitment/pipeline.test.ts` if a case is missing.

- [ ] **Step 3: CI gate**

Run in order: `bun run db:generate && bun run lint && bun run typecheck && bun run test && bun run build`
Expected: PASS on clean checkout.

---

## Risks and Mitigations

- **Tenant escape via jobId reuse.** Mitigated: `candidateRepo.create` validates job belongs to same `tenantId`. tRPC never trusts a client-supplied tenant.
- **Duplicate employee on double-hire (retry storm).** Mitigated: `hiredEmployeeId` guard + read-before-write. Future hardening: unique index on `candidate.hiredEmployeeId` + Mongo transaction (replica set).
- **PII leakage.** Mitigated: `emailEnc`/`phoneEnc` stored encrypted, decrypted only in `toView`. Never log decrypted values. Same key as Employee (`APP_ENCRYPTION_KEY`).
- **Pipeline bypass.** Mitigated: `moveStage` enforces `canTransition`. No direct `prisma.candidate.update` from routers.
- **Prisma Mongo no transactions.** Mitigated: v1 sequential writes with idempotency check. Documented as hardening path in §9 of this plan. No `withTransaction` in v1.

## Out of Scope (v1)

- Resume upload / S3, interview scheduling, scoring/assessment, job publish to external boards, notifications on stage change, UI (dashboard pages). Those are Phase 3.1+ after the API lands.
- `Tenant` settings per job board or hiring workflow customization. Single linear pipeline for v1.

## Acceptance Criteria

- `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` all pass on a clean checkout with `bun run db:generate`.
- Tenancy test: job/candidate created under tenant A is invisible to tenant B via every read path.
- RBAC test: `employee` role cannot create jobs/candidates or hire; `hr`/`admin`/`owner` can.
- Pipeline test: illegal stage transitions are rejected; terminal stages are immutable.
- Hire test: `offer` → `hire` creates one Employee; second hire call with same candidate returns same Employee with no duplicate; `employee.list` grows by exactly one.
- Live check: scripted tRPC calls exercise job → candidate → pipeline → hire → employee visibility and cross-tenant isolation.

## Principle Trace

- **Model the Domain** → pipeline as `CANDIDATE_TRANSITIONS` table + `canTransition` pure helper; hire as repo method with explicit guards, not scattered conditionals in the router.
- **Type System Discipline** → branded `JobId`/`CandidateId`, `JobStatus`/`CandidateStage` unions, `TenantId` threading; illegal states unrepresentable at the call site.
- **Boundary Discipline** → zod at tRPC boundary only; repos trust branded types; PII encrypt/decrypt only at repo boundary; `tenantId` from session (Better Auth), never from input.
- **Make Operations Idempotent** → `hire` idempotent on `hiredEmployeeId`; `close` idempotent; retry-safe without duplicate side effects.
- **Laziness Protocol** → reuse `employeeRepo` for Employee creation, reuse `lib/crypto` and `lib/money` patterns; smallest schema (two models, one linear pipeline) that proves the hire→employee seam.
- **Sequence Work into Verifiable Units** → four tasks, each ends in a passing test + typecheck before the next; PR lands only after all gates pass.

