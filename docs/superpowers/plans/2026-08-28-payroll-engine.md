# Payroll Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure deterministic Payroll Engine `runPayroll` plus its tenant-scoped persistence and tRPC surface, so an HR user can trigger a monthly pay run that computes gross, tax, and net in integer Cents and persists an idempotent, locked pay run.

**Architecture:** Pure core in `lib/payroll/` that never touches I/O. It owns all money math and reconciliation asserts. A thin `server/repo/payrun.ts` factory enforces `tenantId` from `TRPCContext` and guarantees idempotency via a unique `(tenantId, period, entityId)` key. The tRPC router at `server/trpc/routers/payrun.ts` is the only boundary that parses external input with zod and checks RBAC. This mirrors the existing `employeeRepo(prisma, tenantId)` pattern at `server/repo/employee.ts:21`.

**Tech Stack:** Next.js 16, React 19, Prisma 6 with MongoDB, Better Auth 1.7 with organization plugin, tRPC 11, zod 4, Vitest 4, Biome 2, TypeScript strict, Bun 1.4

**Spec:** `docs/system-design.md` §4.4 Payroll Engine, §5 Data Model, §6.1 Payroll Run workflow, §7 Multi-Tenancy, §8 Security, §9 Reliability, plus operator decisions in `docs/build-plan-foundation.md`

## Global Constraints

- Money is integer minor units only. Type `Cents` branded in `lib/money.ts:4`, helpers `cents`, `moneyAdd`, `moneySub`, `moneyGte`. Never use `float` or `Decimal128` in the money path. Mongo stores `Int`.
- `tenantId` is branded `TenantId` from `lib/types.ts:4` and comes from `auth.api.getSession` active organization via `server/trpc/init.ts:18`. Never take `tenantId` from request body or URL. Every query filters by `tenantId`.
- RBAC roles are `owner`, `admin`, `hr`, `manager`, `employee`, `payrollAdmin` defined in `lib/auth.ts:4`. Payroll `run` requires `owner` or `payrollAdmin`. `read` requires any authenticated role. Enforced via `rbacAnyProcedure` in `server/trpc/init.ts:54`.
- Pay run status is a state machine `draft` -> `running` -> `done` -> `locked`. A `locked` run never mutates. Corrections are new adjustment runs.
- Idempotency key is `tenantId:periodStart:periodEnd:entityId` unique. Re-running with same key returns the existing run without duplicate side effects.
- Prisma Mongo has no transaction support via `$transaction`. Persistence for v1 uses Prisma sequential writes with a unique constraint and application dedupe. Native `mongo.client.startSession().withTransaction` requires a replica set and is documented as the hardening path, not the v1 gate.
- All new public surfaces validate with zod at the tRPC boundary. Pure functions inside trust the parsed types.
- Package manager is Bun 1.4.0. Scripts are `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.
- Code style is Biome 2.4.2, 2-space indent, `organizeImports` on. Tailwind v4 CSS-first. No ESLint or Prettier.

---

## File Structure

New or modified files and single responsibility:

- `lib/payroll/types.ts` — branded ids and domain types for the payroll bounded context. No I/O. Single source of truth for `PayRunId`, `PayslipId`, `PayRunStatus`, `PayrollInput`, `PayrollResult`, `TaxBracket`.
- `lib/payroll/tax.ts` — pluggable tax rule engine. Exports `US_2026_SINGLE_BRACKETS` constant and `computeTax(gross: Cents, brackets: TaxBracket[]): Cents`. Pure, deterministic, no DB.
- `lib/payroll/engine.ts` — pure `runPayroll(input: PayrollInput): PayrollResult`. Validates `net >= 0`, reconciles `gross === tax + deductions + net` per employee, aggregates totals. No imports from `lib/prisma` or `server/`.
- `prisma/schema.prisma` — add models `PayRun`, `Payslip`, `PayItem`. Each carries `tenantId String` indexed, `idempotencyKey String @unique`, `status String`, `periodStart`/`periodEnd` strings ISO date. `Payslip` links to `PayRun` via `payRunId`. `PayItem` links to `Payslip` via `payslipId` with `category` enum string and `amount Int`.
- `server/repo/payrun.ts` — tenancy and idempotency boundary. Factory `payRunRepo(prisma, tenantId)` returns `{ create, findByKey, getById, list, lock }`. Every query includes `tenantId`. `create` checks unique constraint and returns existing on duplicate key.
- `server/trpc/routers/payrun.ts` — tRPC surface. Procedures `create`, `list`, `byId`, `lock`. Inputs validated with zod. `create` uses `rbacAnyProcedure(["owner","payrollAdmin"])`. `list`/`byId` use `protectedProcedure`. `lock` uses `rbacAnyProcedure(["owner","payrollAdmin"])`.
- `server/trpc/routers/_app.ts` — register `payrun: payrunRouter` on the app router.
- `lib/types.ts` — add `PayRunId` branded type alongside existing `TenantId` and `EmployeeId`.
- Tests:
  - `lib/payroll/tax.test.ts` — bracket math, zero gross, boundary values, integer guarantee.
  - `lib/payroll/engine.test.ts` — pure engine invariants, multi-employee aggregation, reconciliation, negative net guard.
  - `server/repo/payrun.test.ts` — tenancy scoping and idempotency dedupe. Uses mocked Prisma client, not a real DB. Follows `server/repo/employee.tenant.test.ts:1` style.
  - `server/trpc/routers/payrun.test.ts` — RBAC rejects for `employee` role on `create`, succeeds for `payrollAdmin`, idempotent retry returns same id.

---

### Task 1: Domain types and branded ids

**Files:**
- Create: `lib/payroll/types.ts`
- Modify: `lib/types.ts:25` — add `PayRunId` and `PayslipId` branded types
- Test: `lib/payroll/types.test.ts` (type-level smoke, optional runtime guard for status transitions)

**Interfaces:**
- Consumes: `Cents` from `lib/money.ts:4`, `TenantId` `EmployeeId` from `lib/types.ts:4`
- Produces: `PayRunId`, `PayslipId`, `PayRunStatus`, `TaxBracket`, `PayrollInput`, `PayItem`, `Payslip`, `PayrollResult`, `PayRun` — imported by `lib/payroll/tax.ts`, `lib/payroll/engine.ts`, `server/repo/payrun.ts`, `server/trpc/routers/payrun.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/payroll/types.test.ts
import { describe, expect, it } from "vitest";
import { isValidPayRunStatus, PAY_RUN_STATUS } from "@/lib/payroll/types";

describe("payRun status", () => {
  it("accepts only the four statuses", () => {
    expect(isValidPayRunStatus("draft")).toBe(true);
    expect(isValidPayRunStatus("running")).toBe(true);
    expect(isValidPayRunStatus("done")).toBe(true);
    expect(isValidPayRunStatus("locked")).toBe(true);
    expect(isValidPayRunStatus("deleted")).toBe(false);
  });
  it("PAY_RUN_STATUS is the union", () => {
    expect(PAY_RUN_STATUS).toEqual(["draft", "running", "done", "locked"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/payroll/types.test.ts`
Expected: FAIL with `Cannot find module '@/lib/payroll/types'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/payroll/types.ts
import type { Cents } from "@/lib/money";
import type { EmployeeId, TenantId } from "@/lib/types";

export type PayRunId = string & { readonly __brand: "PayRunId" };
export type PayslipId = string & { readonly __brand: "PayslipId" };
export type PayItemId = string & { readonly __brand: "PayItemId" };

export const PAY_RUN_STATUS = ["draft", "running", "done", "locked"] as const;
export type PayRunStatus = (typeof PAY_RUN_STATUS)[number];

export function isValidPayRunStatus(v: string): v is PayRunStatus {
  return (PAY_RUN_STATUS as readonly string[]).includes(v);
}

// State machine: allowed transitions
export const PAY_RUN_TRANSITIONS: Record<PayRunStatus, PayRunStatus[]> = {
  draft: ["running"],
  running: ["done"],
  done: ["locked"],
  locked: [],
};

export interface TaxBracket {
  upTo: Cents | null; // null means no cap
  rateBps: number; // basis points, e.g. 1000 = 10%
}

export interface PayItem {
  id: PayItemId;
  payslipId: PayslipId;
  category: "gross" | "deduction" | "tax" | "net";
  amount: Cents;
  label: string;
}

export interface Payslip {
  id: PayslipId;
  payRunId: PayRunId;
  employeeId: EmployeeId;
  tenantId: TenantId;
  gross: Cents;
  deductions: Cents;
  tax: Cents;
  net: Cents;
  items: PayItem[];
}

export interface PayrollInputEmployee {
  employeeId: EmployeeId;
  tenantId: TenantId;
  gross: Cents; // for v1: monthly compensation proration caller provides
  deductions: Cents; // pre-tax deductions sum, 0 if none
}

export interface PayrollInput {
  tenantId: TenantId;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd: string; // ISO date YYYY-MM-DD
  entityId: string; // legal entity or department scope, "default" for v1
  employees: PayrollInputEmployee[];
  taxBrackets: TaxBracket[];
  idempotencyKey: string; // tenantId:periodStart:periodEnd:entityId
}

export interface PayrollResult {
  payRunId: PayRunId;
  tenantId: TenantId;
  periodStart: string;
  periodEnd: string;
  entityId: string;
  idempotencyKey: string;
  status: PayRunStatus;
  payslips: Payslip[];
  totals: { gross: Cents; tax: Cents; deductions: Cents; net: Cents };
}

export interface PayRun {
  id: PayRunId;
  tenantId: TenantId;
  entityId: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  idempotencyKey: string;
  createdAt: string;
}
```

```ts
// lib/types.ts — append
export type PayRunId = string & { readonly __brand: "PayRunId" };
export type PayslipId = string & { readonly __brand: "PayslipId" };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/payroll/types.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/payroll/types.ts lib/types.ts lib/payroll/types.test.ts
git commit -m "feat(payroll): add domain types and PayRun state machine"
```

---

### Task 2: Tax rule engine

**Files:**
- Create: `lib/payroll/tax.ts`
- Test: `lib/payroll/tax.test.ts`

**Interfaces:**
- Consumes: `TaxBracket`, `Cents` from `lib/payroll/types.ts`, `cents` from `lib/money.ts:6`
- Produces: `computeTax(gross: Cents, brackets: TaxBracket[]): Cents`, `US_2026_SINGLE_BRACKETS: TaxBracket[]` — consumed by `lib/payroll/engine.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/payroll/tax.test.ts
import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { computeTax, US_2026_SINGLE_BRACKETS } from "@/lib/payroll/tax";

describe("computeTax", () => {
  it("returns 0 for 0 gross", () => {
    expect(computeTax(cents(0), US_2026_SINGLE_BRACKETS)).toBe(cents(0));
  });
  it("computes single bracket correctly", () => {
    // 10% on $100 = $10 => 10000 cents gross, 1000 cents tax
    expect(computeTax(cents(10000), [{ upTo: null, rateBps: 1000 }])).toBe(cents(1000));
  });
  it("computes progressive brackets", () => {
    const brackets = [
      { upTo: cents(10000), rateBps: 1000 }, // 10% to $100
      { upTo: null, rateBps: 2000 }, // 20% above
    ];
    // $150 gross = $10 + $10 = $20 => 2000 cents
    expect(computeTax(cents(15000), brackets)).toBe(cents(2000));
  });
  it("throws on non-integer gross", () => {
    expect(() => computeTax(10.5 as any, US_2026_SINGLE_BRACKETS)).toThrow();
  });
  it("US 2026 single has at least 3 brackets and last is open", () => {
    expect(US_2026_SINGLE_BRACKETS.length).toBeGreaterThanOrEqual(3);
    expect(US_2026_SINGLE_BRACKETS.at(-1)?.upTo).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/payroll/tax.test.ts`
Expected: FAIL with `Cannot find module '@/lib/payroll/tax'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/payroll/tax.ts
import { cents, type Cents } from "@/lib/money";
import type { TaxBracket } from "@/lib/payroll/types";

export const US_2026_SINGLE_BRACKETS: TaxBracket[] = [
  { upTo: cents(1160000), rateBps: 1000 }, // 10% to $11,600
  { upTo: cents(4715000), rateBps: 1200 }, // 12% to $47,150
  { upTo: cents(10052500), rateBps: 2200 }, // 22% to $100,525
  { upTo: null, rateBps: 2400 }, // 24% above simplified
];

export function computeTax(gross: Cents, brackets: TaxBracket[]): Cents {
  if (!Number.isInteger(gross)) throw new Error("Money must be integer cents");
  if (gross < 0) throw new Error("Gross cannot be negative");
  let remaining = gross;
  let prevCap = 0;
  let tax = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const cap = b.upTo === null ? gross : b.upTo;
    const taxableInBracket = Math.min(remaining, cap - prevCap);
    if (taxableInBracket > 0) {
      tax += Math.round((taxableInBracket * b.rateBps) / 10000);
      remaining -= taxableInBracket;
    }
    prevCap = cap;
    if (b.upTo === null) break;
  }
  return cents(tax);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/payroll/tax.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/payroll/tax.ts lib/payroll/tax.test.ts
git commit -m "feat(payroll): add progressive tax engine with US 2026 brackets"
```

---

### Task 3: Pure runPayroll core

**Files:**
- Create: `lib/payroll/engine.ts`
- Test: `lib/payroll/engine.test.ts`

**Interfaces:**
- Consumes: `PayrollInput`, `PayrollResult`, `Payslip`, `PayItem`, `PayRunId` from `lib/payroll/types.ts`, `computeTax` from `lib/payroll/tax.ts`, `cents`, `moneySub`, `moneyGte` from `lib/money.ts:6`
- Produces: `runPayroll(input: PayrollInput): PayrollResult` — consumed by `server/repo/payrun.ts` (but the function itself stays pure and is tested without prisma)

- [ ] **Step 1: Write the failing test**

```ts
// lib/payroll/engine.test.ts
import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";
import type { PayrollInput } from "@/lib/payroll/types";

function input(over: Partial<PayrollInput> = {}): PayrollInput {
  return {
    tenantId: "tenantA" as any,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    entityId: "default",
    idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
    taxBrackets: [{ upTo: null, rateBps: 1000 }],
    employees: [
      { employeeId: "e1" as any, tenantId: "tenantA" as any, gross: cents(500000), deductions: cents(0) },
      { employeeId: "e2" as any, tenantId: "tenantA" as any, gross: cents(300000), deductions: cents(5000) },
    ],
    ...over,
  };
}

describe("runPayroll", () => {
  it("computes net = gross - deductions - tax per employee and reconciles", () => {
    const res = runPayroll(input());
    expect(res.payslips).toHaveLength(2);
    for (const p of res.payslips) {
      expect(p.gross - p.deductions - p.tax).toBe(p.net);
    }
    expect(res.totals.gross).toBe(cents(800000));
  });
  it("net is never negative else throws", () => {
    expect(() =>
      runPayroll(
        input({
          employees: [{ employeeId: "e1" as any, tenantId: "tenantA" as any, gross: cents(1000), deductions: cents(2000) }],
        }),
      ),
    ).toThrow(/net cannot be negative/);
  });
  it("is deterministic", () => {
    expect(runPayroll(input())).toEqual(runPayroll(input()));
  });
  it("rejects empty employees", () => {
    expect(() => runPayroll(input({ employees: [] }))).toThrow(/at least one employee/);
  });
  it("rejects mismatched tenantId in employee row", () => {
    expect(() =>
      runPayroll(
        input({
          employees: [{ employeeId: "e1" as any, tenantId: "other" as any, gross: cents(1000), deductions: cents(0) }],
        }),
      ),
    ).toThrow(/tenant mismatch/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- lib/payroll/engine.test.ts`
Expected: FAIL with `Cannot find module '@/lib/payroll/engine'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/payroll/engine.ts
import { cents, moneyGte, moneySub, type Cents } from "@/lib/money";
import { computeTax } from "@/lib/payroll/tax";
import type { PayrollInput, PayrollResult, Payslip, PayItem, PayRunId, PayslipId, PayItemId } from "@/lib/payroll/types";
import type { EmployeeId, TenantId } from "@/lib/types";

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function runPayroll(input: PayrollInput): PayrollResult {
  if (input.employees.length === 0) throw new Error("Payroll requires at least one employee");
  if (input.periodStart > input.periodEnd) throw new Error("periodStart must be <= periodEnd");
  for (const e of input.employees) {
    if (e.tenantId !== input.tenantId) throw new Error("tenant mismatch in employee row");
    if (!Number.isInteger(e.gross) || !Number.isInteger(e.deductions)) throw new Error("Money must be integer cents");
    if (e.gross < 0 || e.deductions < 0) throw new Error("Money cannot be negative");
  }

  const payslips: Payslip[] = input.employees.map((emp) => {
    const tax = computeTax(moneySub(emp.gross, emp.deductions < emp.gross ? emp.deductions : cents(0)) as Cents, input.taxBrackets);
    // net = gross - deductions - tax
    const afterDeductions = cents(emp.gross - emp.deductions);
    if (afterDeductions < 0) throw new Error("net cannot be negative: deductions exceed gross");
    const net = cents(afterDeductions - tax);
    if (net < 0) throw new Error("net cannot be negative: tax exceeds gross after deductions");

    const payslipId = newId() as PayslipId;
    const payRunId = input.idempotencyKey as unknown as PayRunId;
    const items: PayItem[] = [
      { id: newId() as PayItemId, payslipId, category: "gross", amount: emp.gross, label: "Gross" },
      { id: newId() as PayItemId, payslipId, category: "deduction", amount: emp.deductions, label: "Pre-tax deductions" },
      { id: newId() as PayItemId, payslipId, category: "tax", amount: tax, label: "Tax" },
      { id: newId() as PayItemId, payslipId, category: "net", amount: net, label: "Net" },
    ];

    // reconciliation assert
    if (emp.gross !== cents(emp.deductions + tax + net)) {
      throw new Error("reconciliation failed: gross != deductions + tax + net");
    }

    return {
      id: payslipId,
      payRunId,
      employeeId: emp.employeeId as EmployeeId,
      tenantId: input.tenantId as TenantId,
      gross: emp.gross,
      deductions: emp.deductions,
      tax,
      net,
      items,
    };
  });

  const totals = payslips.reduce(
    (a, p) => ({
      gross: cents(a.gross + p.gross),
      deductions: cents(a.deductions + p.deductions),
      tax: cents(a.tax + p.tax),
      net: cents(a.net + p.net),
    }),
    { gross: cents(0), deductions: cents(0), tax: cents(0), net: cents(0) },
  );

  // global reconciliation
  if (totals.gross !== cents(totals.deductions + totals.tax + totals.net)) {
    throw new Error("global reconciliation failed");
  }

  return {
    payRunId: input.idempotencyKey as unknown as PayRunId,
    tenantId: input.tenantId as TenantId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    entityId: input.entityId,
    idempotencyKey: input.idempotencyKey,
    status: "draft",
    payslips,
    totals,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- lib/payroll/engine.test.ts`
Expected: PASS

Run: `bun run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/payroll/engine.ts lib/payroll/engine.test.ts
git commit -m "feat(payroll): add pure runPayroll with reconciliation asserts"
```

---

### Task 4: Prisma models for PayRun, Payslip, PayItem

**Files:**
- Modify: `prisma/schema.prisma:151` — append three models
- Test: Manual `bun run db:generate` and `bun run typecheck` verification. No unit test writes to DB in CI without a live Mongo.

**Interfaces:**
- Consumes: existing datasource and generator blocks
- Produces: Prisma types `PayRun`, `Payslip`, `PayItem` used by `server/repo/payrun.ts`

- [ ] **Step 1: Write the failing check**

Create a temporary type check file `prisma-check.ts` that imports `PayRun` from `@prisma/client`.

```ts
// /tmp/prisma-check.ts — delete after
import type { PayRun } from "@prisma/client";
const x: PayRun = null as any;
```

Run: `bun run typecheck`
Expected: FAIL with `Module '"@prisma/client"' has no exported member 'PayRun'`

- [ ] **Step 2: Run to verify it fails**

Run: `bun run typecheck 2>&1 | grep PayRun`
Expected: error as above

- [ ] **Step 3: Write minimal implementation**

Append to `prisma/schema.prisma` after the `Employee` model:

```prisma
model PayRun {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId        String
  entityId        String   @default("default")
  periodStart     String
  periodEnd       String
  status          String   @default("draft")
  idempotencyKey  String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, periodStart, periodEnd])
  @@map("pay_run")
}

model Payslip {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  tenantId   String
  payRunId   String   @db.ObjectId
  employeeId String   @db.ObjectId
  gross      Int
  deductions Int
  tax        Int
  net        Int
  createdAt  DateTime @default(now())

  @@index([tenantId])
  @@index([payRunId])
  @@map("payslip")
}

model PayItem {
  id        String @id @default(auto()) @map("_id") @db.ObjectId
  tenantId  String
  payslipId String @db.ObjectId
  payRunId  String @db.ObjectId
  category  String
  amount    Int
  label     String

  @@index([tenantId])
  @@index([payslipId])
  @@index([payRunId])
  @@map("pay_item")
}
```

Run: `bun run db:generate`
Expected: generates new client without error

Delete `/tmp/prisma-check.ts` if created.

- [ ] **Step 4: Run verification**

Run: `bun run typecheck`
Expected: PASS

Run: `bun run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(payroll): add PayRun, Payslip, PayItem models with idempotency key"
```

---

### Task 5: PayRun repository with tenancy and idempotency

**Files:**
- Create: `server/repo/payrun.ts`
- Test: `server/repo/payrun.test.ts`

**Interfaces:**
- Consumes: `PayrollResult`, `PayRunId`, `PayRunStatus` from `lib/payroll/types.ts`, `TenantId` from `lib/types.ts`, `PrismaClient` from `@/lib/prisma`
- Produces: `payRunRepo(prisma, tenantId)` with `{ create(result: PayrollResult): Promise<PayRun>, findByKey(key: string), getById(id: PayRunId), list(), lock(id: PayRunId) }` — every method filters by `tenantId` as done in `server/repo/employee.ts:21`. Consumed by `server/trpc/routers/payrun.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// server/repo/payrun.test.ts
import { describe, expect, it, vi } from "vitest";
import { cents } from "@/lib/money";
import { payRunRepo } from "@/server/repo/payrun";

// helper to build a minimal PayrollResult-like object
function result(over: any = {}) {
  return {
    payRunId: "k1" as any,
    tenantId: "tenantA" as any,
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    entityId: "default",
    idempotencyKey: "tenantA:2026-08-01:2026-08-31:default",
    status: "draft" as const,
    payslips: [
      { id: "ps1" as any, payRunId: "k1" as any, employeeId: "e1" as any, tenantId: "tenantA" as any, gross: cents(10000), deductions: cents(0), tax: cents(1000), net: cents(9000), items: [] },
    ],
    totals: { gross: cents(10000), deductions: cents(0), tax: cents(1000), net: cents(9000) },
    ...over,
  };
}

function mockPrisma() {
  return {
    payRun: {
      findUnique: vi.fn(async ({ where }: any) => null),
      findFirst: vi.fn(async ({ where }: any) => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: any) => ({ id: "newId", ...data })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    payslip: { createMany: vi.fn(async () => ({ count: 1 })), findMany: vi.fn(async () => []) },
    payItem: { createMany: vi.fn(async () => ({ count: 1 })) },
  } as any;
}

describe("payRunRepo tenancy", () => {
  it("create always scopes writes to the factory tenantId even if result has different tenant", async () => {
    const prisma = mockPrisma();
    const repo = payRunRepo(prisma, "tenantA" as any);
    await repo.create(result({ tenantId: "evil" as any }));
    expect(prisma.payRun.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "tenantA" }) }));
  });
  it("list filters by tenantId", async () => {
    const prisma = mockPrisma();
    const repo = payRunRepo(prisma, "tenantA" as any);
    await repo.list();
    expect(prisma.payRun.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenantA" }) }));
  });
  it("getById filters by tenantId", async () => {
    const prisma = mockPrisma();
    const repo = payRunRepo(prisma, "tenantA" as any);
    await repo.getById("someId" as any);
    expect(prisma.payRun.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenantA" }) }));
  });
});

describe("payRunRepo idempotency", () => {
  it("returns existing run when idempotencyKey already exists instead of creating duplicate", async () => {
    const existing = { id: "existingId", idempotencyKey: "tenantA:2026-08-01:2026-08-31:default", tenantId: "tenantA" };
    const prisma = mockPrisma();
    prisma.payRun.findUnique.mockResolvedValueOnce(existing);
    const repo = payRunRepo(prisma, "tenantA" as any);
    const res = await repo.create(result());
    expect(res.id).toBe("existingId");
    expect(prisma.payRun.create).not.toHaveBeenCalled();
  });
  it("lock rejects cross-tenant id", async () => {
    const prisma = mockPrisma();
    prisma.payRun.findFirst.mockResolvedValueOnce(null);
    const repo = payRunRepo(prisma, "tenantA" as any);
    await expect(repo.lock("otherTenantId" as any)).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/repo/payrun.test.ts`
Expected: FAIL with `Cannot find module '@/server/repo/payrun'`

- [ ] **Step 3: Write minimal implementation**

```ts
// server/repo/payrun.ts
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PayrollResult, PayRunStatus } from "@/lib/payroll/types";
import type { PayRunId, TenantId } from "@/lib/types";

type Prisma = typeof defaultPrisma;

export function payRunRepo(prisma: Prisma, tenantId: TenantId) {
  return {
    async create(result: PayrollResult): Promise<{ id: string; idempotencyKey: string; status: string }> {
      const existing = await prisma.payRun.findUnique({ where: { idempotencyKey: result.idempotencyKey } });
      if (existing) {
        if (existing.tenantId !== tenantId) throw new Error("idempotency key collision across tenant");
        return existing as any;
      }

      // v1: sequential creates. Unique index on idempotencyKey makes retries safe.
      // Native transaction path (replica set) is the hardening follow-up.
      const payRun = await prisma.payRun.create({
        data: {
          tenantId,
          entityId: result.entityId,
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          status: result.status,
          idempotencyKey: result.idempotencyKey,
        },
      });

      for (const ps of result.payslips) {
        const payslip = await prisma.payslip.create({
          data: {
            tenantId,
            payRunId: payRun.id,
            employeeId: ps.employeeId as string,
            gross: ps.gross as number,
            deductions: ps.deductions as number,
            tax: ps.tax as number,
            net: ps.net as number,
          },
        });
        if (ps.items.length > 0) {
          await prisma.payItem.createMany({
            data: ps.items.map((it) => ({
              tenantId,
              payslipId: payslip.id,
              payRunId: payRun.id,
              category: it.category,
              amount: it.amount as number,
              label: it.label,
            })),
          });
        }
      }

      return payRun as any;
    },

    async findByKey(idempotencyKey: string) {
      const row = await prisma.payRun.findFirst({ where: { idempotencyKey, tenantId } });
      return row;
    },

    async getById(id: PayRunId) {
      const row = await prisma.payRun.findFirst({ where: { id: id as string, tenantId } });
      return row;
    },

    async list() {
      return prisma.payRun.findMany({ where: { tenantId }, orderBy: { periodStart: "desc" } });
    },

    async lock(id: PayRunId) {
      const existing = await prisma.payRun.findFirst({ where: { id: id as string, tenantId } });
      if (!existing) throw new Error("PayRun not found");
      if (existing.status === "locked") return existing;
      const updated = await prisma.payRun.updateMany({ where: { id: id as string, tenantId }, data: { status: "locked" as PayRunStatus } });
      if (updated.count === 0) throw new Error("PayRun not found");
      return prisma.payRun.findFirst({ where: { id: id as string, tenantId } });
    },

    async getPayslips(payRunId: PayRunId) {
      return prisma.payslip.findMany({ where: { payRunId: payRunId as string, tenantId } });
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/repo/payrun.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/repo/payrun.ts server/repo/payrun.test.ts
git commit -m "feat(payroll): add tenant-scoped payrun repo with idempotency dedupe"
```

---

### Task 6: tRPC router for pay runs

**Files:**
- Create: `server/trpc/routers/payrun.ts`
- Modify: `server/trpc/routers/_app.ts:7` — add `payrun: payrunRouter`
- Test: `server/trpc/routers/payrun.test.ts`

**Interfaces:**
- Consumes: `protectedProcedure`, `rbacAnyProcedure` from `server/trpc/init.ts:44`, `payRunRepo` from `server/repo/payrun.ts`, `runPayroll` from `lib/payroll/engine.ts`, `US_2026_SINGLE_BRACKETS` from `lib/payroll/tax.ts`, `employeeRepo` from `server/repo/employee.ts:21`
- Produces: `payrunRouter` with `create`, `list`, `byId`, `lock` — mounted at `appRouter.payrun` and consumed by dashboard clients.

- [ ] **Step 1: Write the failing test**

```ts
// server/trpc/routers/payrun.test.ts
import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { payrunRouter } from "@/server/trpc/routers/payrun";

function caller(roles: string[], prismaOverrides: any = {}) {
  const prisma = {
    employee: { findMany: vi.fn(async () => [{ id: "e1", tenantId: "t1", compensation: 500000 }]) },
    payRun: { findUnique: vi.fn(async () => null), findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []), create: vi.fn(async ({ data }: any) => ({ id: "pr1", ...data })), updateMany: vi.fn(async () => ({ count: 1 })) },
    payslip: { create: vi.fn(async ({ data }: any) => ({ id: "ps1", ...data })), createMany: vi.fn(async () => ({})), findMany: vi.fn(async () => []) },
    payItem: { createMany: vi.fn(async () => ({})) },
    ...prismaOverrides,
  } as any;
  const ctx = { session: { id: "u1", tenantId: "t1" as any, roles: roles as any }, prisma };
  return payrunRouter.createCaller(ctx);
}

describe("payrun router RBAC", () => {
  it("rejects employee role on create", async () => {
    const c = caller(["employee"]);
    await expect(c.create({ periodStart: "2026-08-01", periodEnd: "2026-08-31", entityId: "default" })).rejects.toBeInstanceOf(TRPCError);
  });
  it("allows payrollAdmin on create", async () => {
    const c = caller(["payrollAdmin"]);
    const res = await c.create({ periodStart: "2026-08-01", periodEnd: "2026-08-31", entityId: "default" });
    expect(res.id).toBeDefined();
  });
  it("list is allowed for any authenticated role", async () => {
    const c = caller(["employee"]);
    const res = await c.list();
    expect(Array.isArray(res)).toBe(true);
  });
  it("create is idempotent: second call with same period returns same id", async () => {
    const existing = { id: "existing", idempotencyKey: "t1:2026-08-01:2026-08-31:default", tenantId: "t1" };
    const prisma = { payRun: { findUnique: vi.fn(async () => existing), findFirst: vi.fn(async () => existing), findMany: vi.fn(async () => [existing]), create: vi.fn(async () => { throw new Error("should not create"); }), updateMany: vi.fn(async () => ({ count: 1 })) }, payslip: { create: vi.fn(async () => ({})), createMany: vi.fn(async () => ({})), findMany: vi.fn(async () => []) }, payItem: { createMany: vi.fn(async () => ({})) }, employee: { findMany: vi.fn(async () => [{ id: "e1", tenantId: "t1", compensation: 500000 }]) } } as any;
    const c = caller(["payrollAdmin"], prisma);
    const a = await c.create({ periodStart: "2026-08-01", periodEnd: "2026-08-31", entityId: "default" });
    const b = await c.create({ periodStart: "2026-08-01", periodEnd: "2026-08-31", entityId: "default" });
    expect(a.id).toBe(b.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/trpc/routers/payrun.test.ts`
Expected: FAIL with `Cannot find module '@/server/trpc/routers/payrun'`

- [ ] **Step 3: Write minimal implementation**

```ts
// server/trpc/routers/payrun.ts
import { z } from "zod";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";
import { US_2026_SINGLE_BRACKETS } from "@/lib/payroll/tax";
import { employeeRepo } from "@/server/repo/employee";
import { payRunRepo } from "@/server/repo/payrun";
import { createTRPCRouter, protectedProcedure, rbacAnyProcedure } from "../init";

const RUN_ROLES = ["owner", "payrollAdmin"] as const;

export const payrunRouter = createTRPCRouter({
  create: rbacAnyProcedure([...RUN_ROLES] as any)
    .input(
      z.object({
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        entityId: z.string().min(1).default("default"),
        // v1: if empty, compute from all active employees for tenant
        employeeIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.periodStart > input.periodEnd) throw new Error("periodStart must be <= periodEnd");
      const empRepo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      let employees = await empRepo.list();
      if (input.employeeIds && input.employeeIds.length > 0) {
        const set = new Set(input.employeeIds);
        employees = employees.filter((e) => set.has(e.id as string));
      }
      // filter to active only for pay run; terminated excluded
      employees = employees.filter((e) => e.status === "active" || e.status === "on_leave");
      if (employees.length === 0) throw new Error("No eligible employees for pay run");

      const idempotencyKey = `${ctx.session.tenantId}:${input.periodStart}:${input.periodEnd}:${input.entityId}`;

      const payrollInput = {
        tenantId: ctx.session.tenantId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        entityId: input.entityId,
        idempotencyKey,
        taxBrackets: US_2026_SINGLE_BRACKETS,
        employees: employees.map((e) => ({
          employeeId: e.id as any,
          tenantId: e.tenantId as any,
          gross: cents(e.compensation as number),
          deductions: cents(0),
        })),
      };

      const result = runPayroll(payrollInput as any);
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      const saved = await repo.create(result as any);
      return saved;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
    return repo.list();
  }),

  byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
    const row = await repo.getById(input.id as any);
    if (!row) throw new Error("PayRun not found");
    const payslips = await repo.getPayslips(input.id as any);
    return { payRun: row, payslips };
  }),

  lock: rbacAnyProcedure([...RUN_ROLES] as any)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = payRunRepo(ctx.prisma, ctx.session.tenantId);
      return repo.lock(input.id as any);
    }),
});
```

```ts
// server/trpc/routers/_app.ts — add payrun
import { payrunRouter } from "./payrun";
export const appRouter = createTRPCRouter({
  health: publicProcedure.input(z.object({}).optional()).query(() => ({ status: "pong" as const, ts: new Date().toISOString() })),
  me: meRouter,
  org: orgRouter,
  employee: employeeRouter,
  payrun: payrunRouter,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/trpc/routers/payrun.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/trpc/routers/payrun.ts server/trpc/routers/_app.ts server/trpc/routers/payrun.test.ts
git commit -m "feat(payroll): add payrun tRPC router with RBAC and idempotency"
```

---

### Task 7: Property tests and reconciliation hardening

**Files:**
- Create: `lib/payroll/engine.property.test.ts`
- Modify: `lib/payroll/engine.ts` if invariants fail

**Interfaces:**
- Consumes: `runPayroll` from `lib/payroll/engine.ts`, `cents` from `lib/money.ts:6`
- Produces: hardened invariants for future payrun work; no new producer.

- [ ] **Step 1: Write the failing test**

```ts
// lib/payroll/engine.property.test.ts
import { describe, expect, it } from "vitest";
import { cents } from "@/lib/money";
import { runPayroll } from "@/lib/payroll/engine";

describe("runPayroll invariants", () => {
  it("totals equal sum of payslips for 100 random-ish cases", () => {
    for (let i = 0; i < 100; i++) {
      const n = (i % 5) + 1;
      const employees = Array.from({ length: n }, (_, j) => ({
        employeeId: `e${j}` as any,
        tenantId: "t1" as any,
        gross: cents(10000 + ((i * 37 + j * 13) % 90000)),
        deductions: cents(((i + j) % 3) * 1000),
      }));
      const res = runPayroll({
        tenantId: "t1" as any,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        entityId: "default",
        idempotencyKey: `t1:2026-08-01:2026-08-31:default:${i}`,
        taxBrackets: [{ upTo: null, rateBps: 1000 }],
        employees,
      });
      const sum = res.payslips.reduce((a, p) => cents(a + p.net), cents(0));
      expect(sum).toBe(res.totals.net);
    }
  });
  it("no float leaks: every amount is integer", () => {
    const res = runPayroll({
      tenantId: "t1" as any,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      entityId: "default",
      idempotencyKey: "t1:2026-08-01:2026-08-31:default",
      taxBrackets: [{ upTo: cents(10000), rateBps: 333 }, { upTo: null, rateBps: 777 }],
      employees: [{ employeeId: "e1" as any, tenantId: "t1" as any, gross: cents(12345), deductions: cents(0) }],
    });
    for (const p of res.payslips) {
      expect(Number.isInteger(p.gross)).toBe(true);
      expect(Number.isInteger(p.tax)).toBe(true);
      expect(Number.isInteger(p.net)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `bun run test -- lib/payroll/engine.property.test.ts`
Expected: PASS if engine already hardens, else FAIL revealing rounding leak. The task is to green it.

- [ ] **Step 3: Harden implementation if needed**

If the 777 bps case shows non-integer via `Math.round` edge, adjust `computeTax` to use integer `Math.round` only once per bracket and assert integer at the end with `cents(tax)`. Already done in `lib/payroll/tax.ts`. No change if green. If red, fix `computeTax` to guarantee integer output via `cents(Math.round(...))`.

- [ ] **Step 4: Run tests to verify it passes**

Run: `bun run test -- lib/payroll`
Expected: PASS all payroll tests

Run: `bun run lint && bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/payroll/engine.property.test.ts
git commit -m "test(payroll): add property invariants for totals and integer money"
```

---

## Verification

Each task ends with its own `bun run test` and `bun run typecheck`. Final gate after all tasks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Live proof after tasks 4 through 6 needs a local Mongo:

```bash
bun run dev
# in another shell
curl -s http://localhost:3000/api/trpc/health | jq
# with a signed-in session cookie
curl -s -H "Cookie: better-auth.session_token=..." \
  -H "Content-Type: application/json" \
  -d '{"json":{"periodStart":"2026-08-01","periodEnd":"2026-08-31","entityId":"default"}}' \
  http://localhost:3000/api/trpc/payrun.create | jq
```

Expected: first call creates, second call with same period/entity/tenant returns same `id` without duplicate `pay_run` row.

---

## Self-Review Checklist

- [ ] Spec coverage: §4.4 pure engine and deterministic. §5 pay_run, payslip, pay_item tables. §6.1 idempotency and locked runs. §7 tenant isolation via factory. §8 integer money and encryption not leaked into payroll. §9 at-least-once dedupe.
- [ ] Placeholder scan: no `TBD`, `TODO`, `implement later`, or `handle edge cases` without code.
- [ ] Type consistency: `Cents`, `TenantId`, `PayRunId`, `PayslipId`, `PayRunStatus`, `TaxBracket`, `PayrollInput`, `PayrollResult` spelled identically across all tasks. `payRunRepo` signature matches router caller. `runPayroll` input matches what the router builds from `employeeRepo.list()`.

---

## Decisions and Tradeoffs

- Salary-only v1. Hourly and time-entry proration is deferred. `PayrollInputEmployee.gross` is the caller-provided monthly gross. This keeps the pure engine small and verifiable now. Time tracking becomes a follow-up plan that feeds `gross` as `rate * hours` before calling `runPayroll`.
- Three Prisma models instead of embedding payslips as JSON. Chosen for queryability. Tradeoff is need for sequential writes. The plan documents replica-set hardening for true atomicity instead of pretending Prisma transactions exist on Mongo.
- Basis points for rates. Avoids float rates. `rateBps: 1000` is 10%. The tax engine rounds per bracket with `Math.round`. All amounts re-validated with `cents`.
- No billing or integration coupling. Payroll stays isolated behind its own repo and router, so later `TIME`, `BILL`, or `INTG` work does not touch it.

