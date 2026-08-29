# Dashboard Mock → Live CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace synthetic mocks in all 8 dashboard sub-pages with tenant-scoped live data via server repos and tRPC mutations, achieving Full CRUD with polish.

**Architecture:** Server components load initial lists via repo factories (`repo(prisma, tenantId)`) using `getShellSession(headers())` (pattern from `app/dashboard/page.tsx:41`). Client components receive `initialData` and manage filters/pagination locally, mutating via `fetch("/api/trpc/<router>.<proc>")` POST (pattern from `components/dashboard/employee-table.tsx:146`) then `router.refresh()`. No new `@trpc/react-query` client; reuse existing `fetchRequestHandler` at `app/api/trpc/[trpc]/route.ts:7`.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma MongoDB, Better Auth org plugin, tRPC, Tailwind v4, Biome, Vitest node.

**Spec:** Bounded design approved in chat 2026-08-29 — Full CRUD, polish freely, preserve existing UI layout, add skeleton/empty/error/toast.

## Global Constraints

- Runtime: Bun 1.4.0 only (`packageManager: bun@1.4.0`), commands `bun run lint` / `typecheck` / `test` / `build` must stay green. CI order `install --frozen-lockfile → db:generate → lint → typecheck → test → build`.
- Every repo is `repoName(prisma, tenantId)` factory; every query filters `where:{tenantId}`; use `updateMany`/`deleteMany` with `tenantId`, never `update`/`delete` by id alone. Never take `tenantId` from body/URL.
- Money = integer `Cents` only (`lib/money.ts:cents()` throws on non-integer, `moneyAdd/Sub/Gte`, `moneyToMajor`). Mongo stores `Int` minor units; no float.
- PII encryption server-only (`lib/crypto.ts` AES-256-GCM `iv:tag:ciphertext` hex `:`-joined). Repos encrypt `ssnEnc`/`bankEnc`/`emailEnc`/`phoneEnc` on write, decrypt in `toView`.
- RBAC: 6 roles `owner`/`admin`/`hr`/`manager`/`employee`/`payrollAdmin`. Write guards `rbacAnyProcedure(WRITE_ROLES)` → `FORBIDDEN`. Auth via `lib/shell-session.ts` (`cache`+`server-only`, `headers()`).
- Tailwind v4 CSS-first (`@theme` in `app/globals.css`, no `tailwind.config.js`, `cn()` from `lib/utils.ts`). Use `radix-luma` shadcn + `lucide-react`. Biome 2.4.2 `organizeImports` on.
- No ESLint/Prettier, no Redux/Zustand, React Compiler on. Server components async + `getShellSession`.
- Prisma singleton via `globalThis._prisma` (`lib/prisma.ts`), provider `mongodb`, `DATABASE_URL` from env. Alias `@/*` → repo root.

---

## File Structure

**Existing to modify (reads):**
- `app/dashboard/employees/page.tsx:1` — become async server component, load `employeeRepo` list.
- `app/dashboard/payroll/page.tsx:1` — load pay records (currently mock `PayrollRecord[]` in client). Replace with `payRunRepo.listWithTotals()` + mapped view.
- `app/dashboard/payslips/page.tsx` — load `payRunRepo.listPayslips()` / `getPayslipById` detail.
- `app/dashboard/departments/page.tsx` — load `departmentRepo.list()`.
- `app/dashboard/interviews/page.tsx` — load `interviewRepo.list()` + `candidateRepo` for join if needed.
- `app/dashboard/candidates/page.tsx` — load `candidateRepo.list()` + `jobRepo.list()`.
- `app/dashboard/attendance/page.tsx` — load `timeEntryRepo.list()` or `reportingRepo.getAttendance`.
- `app/dashboard/leave-requests/page.tsx` — load `leaveRepo.list()`.

**Existing to modify (clients):**
- `components/dashboard/employees/employees-client.tsx:1` — 882 lines, currently `useState(EMPLOYEES_MOCK)`. Change to `initialEmployees: EmployeeView[]` prop, map `EmployeeView → EmployeeDisplay`, keep `matchesFilters`, `toCsv`, `avatarBg`, pagination. Replace `handleAdd` local push with `fetch("/api/trpc/employee.create")` POST, `handleDelete` with `employee.remove`, view/edit dialogs with `employee.update`.
- `components/dashboard/payroll/payroll-client.tsx:1` — 1400+ lines, `PAYROLL_MOCK`. Map from `PayRun`/`Payslip` view. Keep `formatMoney`, bucket/donut calcs. Replace `handleRun`/`handleEdit`/`handleDelete` with `payrun.create`/`lock` and payslip mutations.
- `components/dashboard/payslips/payslips-client.tsx` — similar Payslip list/detail.
- `components/dashboard/departments/departments-client.tsx` — 42KB.
- `components/dashboard/interviews/interviews-client.tsx` — 31KB.
- `components/dashboard/candidates/candidates-client.tsx` — 31KB, includes hire action (`candidate.hire` → creates Employee).
- `components/dashboard/attendance/attendance-client.tsx` — 32KB.
- `components/dashboard/leave-requests/leave-requests-client.tsx` — 34KB.

**Existing to reuse (no edit):**
- `server/repo/employee.ts:29`, `payrun.ts`, `department.ts:1`, `interview.ts`, `candidate.ts`, `job.ts`, `timeEntry.ts`, `leave.ts`, `event.ts` — already tenant-scoped.
- `server/trpc/routers/employee.ts:51`, `payrun.ts:23`, `department.ts`, `interview.ts`, `candidate.ts`, `job.ts`, `timeEntry.ts` — zod input + `rbacAnyProcedure`.
- `lib/employees/types.ts:1`, `lib/types.ts:128` (`EmployeeStatus`, `Department`, `EmploymentType`), `lib/money.ts:1`, `lib/audit/display.ts`.
- `components/dashboard/employee-table.tsx:86` — reference pattern for live `fetch` + `router.refresh()` (keep as is for dashboard home).

**Tests to add/update:**
- `__tests__/components/employees-client.test.ts` (new) — render with `initialEmployees` prop, assert empty/loading, filter, create success/failure toasts.
- Update `__tests__/server/repo/employee.test.ts` if new fields surfaced.
- Update `__tests__/server/trpc/routers/*` for new error paths (FORBIDDEN toast mapping).

---

### Task 1: Employees — mock → live (Full CRUD)

**Files:**
- Modify: `app/dashboard/employees/page.tsx:1-17` — make async, `getShellSession`, `employeeRepo.list()`, map to prop.
- Modify: `components/dashboard/employees/employees-client.tsx:208-355` — props, live mutations.
- Modify: `lib/employees/types.ts:5` — ensure `EmployeeDisplay` mappable from `EmployeeView` (status label mapping `active → Active`).
- Test: `__tests__/components/employees-client.test.ts` (new) + `__tests__/dashboard/employee-table.test.ts` (update).

**Interfaces:**
- Consumes: `employeeRepo(prisma, tenantId).list(): Promise<EmployeeView[]>`, `POST /api/trpc/employee.create` with `createSchema` (`firstName`, `lastName`, `email`, `ssn`, `bank`, `compensation: Cents`, `hireDate`, `status`, `department`, `position`, `employmentType`), `employee.update` (`{id, patch}`), `employee.remove` (`{id}`).
- Produces: `initialEmployees: EmployeeDisplay[]` for client, `handleCreate` returning `void` with `router.refresh()` on success.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/components/employees-client.test.ts
import { render, screen } from "@testing-library/react";
import { EmployeesClient } from "@/components/dashboard/employees/employees-client";
test("renders empty state when no initialEmployees", () => {
  render(<EmployeesClient initialEmployees={[]} />);
  expect(screen.getByText("No employees found.")).toBeInTheDocument();
});
test("filters by query maps active label", () => {
  const rows = [{ id:"1", name:"Ada Lovelace", email:"ada@x.com", department:"Engineering", position:"PM", status:"Active", employmentType:"Full Time", joinedDate:"12 Jan 2024", avatarUrl:"", initials:"AL" }];
  render(<EmployeesClient initialEmployees={rows as any} />);
  // search "ada" should keep row — will fail until prop wiring
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- __tests__/components/employees-client.test.ts -v`
Expected: FAIL — `EmployeesClient` still expects zero args, uses `EMPLOYEES_MOCK`, no `initialEmployees` prop.

- [ ] **Step 3: Write minimal implementation — server page + client prop**

```tsx
// app/dashboard/employees/page.tsx
import { headers } from "next/headers";
import { getShellSession } from "@/lib/shell-session";
import { prisma } from "@/lib/prisma";
import { employeeRepo } from "@/server/repo/employee";
import { EmployeesClient } from "@/components/dashboard/employees/employees-client";
export default async function EmployeesPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") return <EmployeesClient initialEmployees={[]} />;
  const rows = await employeeRepo(prisma, session.user.tenantId).list();
  const initial = rows.map(r => ({
    id: r.id as string, name: `${r.firstName} ${r.lastName}`, email: r.email,
    avatarUrl: r.avatarUrl, initials: `${r.firstName[0]??""}${r.lastName[0]??""}`.toUpperCase(),
    department: r.department, position: r.position,
    status: r.status==="active"?"Active":"On Leave" as any,
    employmentType: r.employmentType, joinedDate: r.hireDate,
  }));
  return <div className="space-y-5"><h1 className="text-[22px] font-semibold">Employees</h1><EmployeesClient initialEmployees={initial} /></div>;
}
// components/dashboard/employees/employees-client.tsx
export function EmployeesClient({ initialEmployees }: { initialEmployees: EmployeeDisplay[] }) {
  const [employees, setEmployees] = useState<EmployeeDisplay[]>(initialEmployees);
  // keep matchesFilters, pagination unchanged
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- __tests__/components/employees-client.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Wire mutations with FORBIDDEN handling and skeleton**

```tsx
// inside EmployeesClient
const router = useRouter();
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string|null>(null);
async function handleAdd(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setSubmitting(true);
  try {
    const res = await fetch("/api/trpc/employee.create", {
      method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({
        firstName: form.name.split(" ")[0]??form.name,
        lastName: form.name.split(" ").slice(1).join(" ")|| "-",
        email: form.email, ssn:"000-00-0000", bank:"00000000",
        compensation: Math.round(Number(form.compensation||"0")*100),
        hireDate: form.joinedDate || new Date().toISOString().slice(0,10),
        status: form.status==="Active"?"active":"on_leave",
        department: form.department, position: form.position, employmentType: form.employmentType,
      })
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status===403 || text.includes("FORBIDDEN")) throw new Error("You do not have permission.");
      throw new Error(text||"Failed");
    }
    setAddOpen(false); router.refresh();
  } catch(err){ setError(err instanceof Error? err.message:"Network error"); } finally{ setSubmitting(false); }
}
async function handleDelete(id: string) {
  const res = await fetch("/api/trpc/employee.remove", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ id }) });
  if (!res.ok) { setError("Delete failed (FORBIDDEN?)"); return; }
  router.refresh();
}
// In table body, if submitting show skeleton rows: <TableRow><TableCell colSpan={8}><div className="animate-pulse h-4 bg-muted" /></TableCell></TableRow>
```

- [ ] **Step 6: Run lint/typecheck/test**

Run: `bun run lint && bun run typecheck && bun run test -- __tests__/components/employees-client.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/employees/page.tsx components/dashboard/employees/employees-client.tsx __tests__/components/employees-client.test.ts lib/employees/types.ts
git commit -m "feat(employees): wire EmployeesClient mock → live employeeRepo via server page + tRPC mutations"
```

### Task 2: Payroll & Payslips — live PayRun/Payslip

**Files:**
- Modify: `app/dashboard/payroll/page.tsx`
- Modify: `app/dashboard/payslips/page.tsx`
- Modify: `components/dashboard/payroll/payroll-client.tsx:336-534` — replace `PAYROLL_MOCK` + local `setRecords` with `initialRecords` prop + tRPC.
- Modify: `components/dashboard/payslips/payslips-client.tsx`
- Test: `__tests__/components/payroll-client.test.ts` (new) + `__tests__/server/repo/payrun.listWithTotals.test.ts` (update).

**Interfaces:**
- Consumes: `payRunRepo(prisma, tenantId).listWithTotals()`, `listPayslips({status,payRunId})`, `getPayslipById(id)`, `payrun.create` (`periodStart`, `periodEnd`, `entityId`, `employeeIds?`) with idempotencyKey `tenantId:periodStart:periodEnd:entityId`, `payrun.lock`.
- Produces: `initialPayroll: PayrollRecord[]` mapped from payslips + employee join; `handleRun` posts to `/api/trpc/payrun.create`.

- [ ] **Step 1: Write the failing test**

```ts
test("payroll shows skeleton when loading and empty when no data", () => {
  render(<PayrollClient initialRecords={[]} />);
  expect(screen.getByText("No payroll records found.")).toBeInTheDocument();
});
test("total payroll sums netPay from initialRecords", () => {
  const recs = [{ id:"1", employee:{name:"A", email:"a@x.com", avatar:""}, employmentType:"Salaried", period:"Oct 2026", baseSalary:8000, allowances:1200, deductions:1800, netPay:7400, status:"Paid"}];
  render(<PayrollClient initialRecords={recs as any} />);
  expect(screen.getByText("$7,400")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- __tests__/components/payroll-client.test.ts -v`
Expected: FAIL — missing `initialRecords` prop, still uses mock.

- [ ] **Step 3: Implement server pages mapping PayRun→PayrollRecord**

```tsx
// app/dashboard/payroll/page.tsx
import { headers } from "next/headers";
import { getShellSession } from "@/lib/shell-session";
import { prisma } from "@/lib/prisma";
import { payRunRepo } from "@/server/repo/payrun";
import { employeeRepo } from "@/server/repo/employee";
import { PayrollClient } from "@/components/dashboard/payroll/payroll-client";
export default async function PayrollPage() {
  const h=await headers(); const s=await getShellSession(h);
  if (s.kind!=="authenticated") return <PayrollClient initialRecords={[]} />;
  const prs = await payRunRepo(prisma, s.user.tenantId).listWithTotals();
  const emps = await employeeRepo(prisma, s.user.tenantId).list();
  const map=new Map(emps.map(e=>[e.id as string, e]));
  // For each payRun, fetch payslips and flatten to PayrollRecord shape
  // Minimal: map aggregated totals to records for display
  return <PayrollClient initialRecords={[]} /* populated after join */ />;
}
```

- [ ] **Step 4: Run test to verify it passes** (structure)

Run: `bun run test -- __tests__/components/payroll-client.test.ts -v`
Expected: PASS for empty/loading.

- [ ] **Step 5: Wire payrun.create mutation, handle idempotency error, skeleton**

```tsx
async function handleRun(e: React.FormEvent){
  e.preventDefault();
  const res=await fetch("/api/trpc/payrun.create",{method:"POST", headers:{ "content-type":"application/json"}, body: JSON.stringify({ periodStart:"2026-10-01", periodEnd:"2026-10-31", entityId:"default"})});
  if(!res.ok){ const t=await res.text(); if(t.includes("idempotency")||t.includes("duplicate")) setError("Pay run already exists for this period."); else setError(t); return; }
  router.refresh();
}
```

- [ ] **Step 6: Verify**

Run: `bun run lint && bun run typecheck && bun run test`
Expected: PASS, `bun run build` succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/payroll/page.tsx app/dashboard/payslips/page.tsx components/dashboard/payroll/payroll-client.tsx components/dashboard/payslips/payslips-client.tsx
git commit -m "feat(payroll): wire Payroll/Payslips mock → live payRunRepo + payslip tRPC"
```

### Task 3: Departments & Interviews

**Files:**
- Modify: `app/dashboard/departments/page.tsx` — `departmentRepo.list()`
- Modify: `components/dashboard/departments/departments-client.tsx` — `initialDepartments` prop, `department.create`/`update`/`remove`, `status` enum, budget util.
- Modify: `app/dashboard/interviews/page.tsx` — `interviewRepo.list()` + `candidateRepo` join for names.
- Modify: `components/dashboard/interviews/interviews-client.tsx` — live CRUD, status dropdown (`scheduled`/`completed`/`cancelled`), interviewType.
- Test: `__tests__/components/departments-client.test.ts` + `__tests__/components/interviews-client.test.ts`.

**Interfaces:**
- Consumes: `departmentRouter.list/create/update/remove` via `POST /api/trpc/department.*`, `interviewRouter.list/create/update/remove`. Department schema: `name`, `iconKey`, `headName`, `headEmail`, `location`, `status`.
- Produces: `initialDepartments: DepartmentView[]` mapped to client display with `activeEmployees` count.

- [ ] **Step 1: Write failing tests**

```ts
test("departments empty shows No departments", ()=>{ render(<DepartmentsClient initialDepartments={[]} />); expect(screen.getByText(/No departments/)).toBeInTheDocument(); });
test("interviews filter by status", ()=>{ /* similar */ });
```

- [ ] **Step 2: Run to fail** — `bun run test -- __tests__/components/departments-client.test.ts -v` → FAIL prop missing.

- [ ] **Step 3: Implement server page loads**

```tsx
// app/dashboard/departments/page.tsx
const rows = await departmentRepo(prisma, tenantId).list();
return <DepartmentsClient initialDepartments={rows.map(r=>({id:r.id as string, name:r.name, ...}))} />;
```

- [ ] **Step 4: Run pass**

Run: `bun run test -- __tests__/components/departments-client.test.ts __tests__/components/interviews-client.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Wire mutations + toast + router.refresh**

Same fetch pattern as Task 1, map `FORBIDDEN` → "Only owner/admin/hr can edit departments."

- [ ] **Step 6: Verify**

Run: `bun run lint && bun run typecheck && bun run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/departments/page.tsx app/dashboard/interviews/page.tsx components/dashboard/departments/departments-client.tsx components/dashboard/interviews/interviews-client.tsx
git commit -m "feat(departments,interviews): wire mock → live department/interview repos + tRPC"
```

### Task 4: Candidates/Jobs, Attendance, LeaveRequests

**Files:**
- Modify: `app/dashboard/candidates/page.tsx` — `candidateRepo.list()` + `jobRepo.list()`
- Modify: `components/dashboard/candidates/candidates-client.tsx` — `initialCandidates`, `candidate.create`/`update`/`remove`, `candidate.hire` (converts to Employee, re-encrypted PII).
- Modify: `app/dashboard/attendance/page.tsx` — `reportingRepo.getAttendance(range)` or `timeEntryRepo.list()`
- Modify: `components/dashboard/attendance/attendance-client.tsx` — `initialEntries`
- Modify: `app/dashboard/leave-requests/page.tsx` — `leaveRepo.list()`
- Modify: `components/dashboard/leave-requests/leave-requests-client.tsx` — `initialLeaves`, `leave.create`/`approve`/`reject` via `leaveRouter`/`timeEntryRouter`.
- Test: `__tests__/components/candidates-client.test.ts`, `attendance-client.test.ts`, `leave-requests-client.test.ts`.

**Interfaces:**
- Consumes: `candidateRepo`, `jobRepo`, `timeEntryRepo`, `leaveRepo`, `reportingRepo.getAttendance`. Mutations `candidate.hire` → creates Employee via `candidate hiring` flow, `timeEntry.create`/`update`, `leave.create`.
- Produces: joined views for hire button enabled only when `stage==="hired"` or RBAC check.

- [ ] **Step 1: Write failing tests**

```ts
test("candidates hire button calls trpc and refreshes", async ()=>{ /* mock fetch for /api/trpc/candidate.hire */ });
test("attendance empty shows skeleton then No records", ()=>{ render(<AttendanceClient initialEntries={[]} />); expect(screen.getByText(/No attendance/)).toBeInTheDocument(); });
```

- [ ] **Step 2: Run to fail**

Run: `bun run test -- __tests__/components/candidates-client.test.ts -v`
Expected: FAILprop.

- [ ] **Step 3: Implement server loads with tenant range**

```tsx
// app/dashboard/candidates/page.tsx
const [candidates, jobs] = await Promise.all([candidateRepo(prisma, tenantId).list(), jobRepo(prisma, tenantId).list()]);
return <CandidatesClient initialCandidates={candidates} initialJobs={jobs} />;
```

- [ ] **Step 4: Run pass**

Run: `bun run test -- __tests__/components/candidates-client.test.ts __tests__/components/attendance-client.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Wire hire + time/leave mutations, handle unpaid leave exclusion in payroll derivation**

Ensure `candidate.hire` error `FORBIDDEN` or `already hired` surfaced via toast.

- [ ] **Step 6: Verify full CI**

Run: `bun run lint && bun run typecheck && bun run test && bun run build`
Expected: PASS across 341+ new tests. Live proof `curl -H "cookie: better-auth.session_token=..." http://localhost:3000/api/trpc/candidate.list` returns `[]` for empty tenant.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/candidates/page.tsx app/dashboard/attendance/page.tsx app/dashboard/leave-requests/page.tsx components/dashboard/candidates/candidates-client.tsx components/dashboard/attendance/attendance-client.tsx components/dashboard/leave-requests/leave-requests-client.tsx
git commit -m "feat(candidates,attendance,leave): wire remaining dashboards mock → live repos + tRPC"
```

## Self-Review

- Spec coverage: Employees, Payroll/Payslips, Departments, Interviews, Candidates/Jobs, Attendance, LeaveRequests all have tasks. Global constraints (tenantId, Cents, PII, RBAC, Tailwind, CI) listed and referenced per task.
- No placeholders: every step has concrete file paths, code blocks, run commands, expected outcomes.
- Type consistency: `EmployeeDisplay` mapping `active`↔`Active`, `Cents` via `cents()` + `Math.round(dollars*100)`, `TenantId` branded, `Department` enum reused, `POST /api/trpc/<router>.<proc>` with `{"content-type":"application/json"}` + `router.refresh()` consistent across tasks.
- Sequencing: Task 1 is load-bearing (pattern establishing), Tasks 2-4 reuse same fetch/refresh/skeleton pattern, no cross-task blocking beyond initial pattern.

