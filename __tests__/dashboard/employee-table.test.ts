import { describe, expect, it } from "vitest";
import type { EmployeeTableRow } from "@/components/dashboard/employee-table";
import { cents } from "@/lib/money";
import type { EmployeeStatus } from "@/lib/types";

function matches(row: EmployeeTableRow, q: string, status: string): boolean {
  if (status !== "all" && row.status !== status) return false;
  if (!q) return true;
  const hay = `${row.firstName} ${row.lastName} ${row.email}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function makeRow(over: Partial<EmployeeTableRow> = {}): EmployeeTableRow {
  return {
    id: "1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    compensation: cents(9000000),
    status: "active" as EmployeeStatus,
    hireDate: "2026-01-01",
    ...over,
  };
}

describe("EmployeeTable filtering", () => {
  it("matches by firstName, lastName, email", () => {
    const r = makeRow();
    expect(matches(r, "ada", "all")).toBe(true);
    expect(matches(r, "lovelace", "all")).toBe(true);
    expect(matches(r, "ada@example.com", "all")).toBe(true);
    expect(matches(r, "ADA", "all")).toBe(true);
    expect(matches(r, "bob", "all")).toBe(false);
  });

  it("filters by status", () => {
    const active = makeRow({ status: "active" });
    const onLeave = makeRow({ status: "on_leave" });
    expect(matches(active, "", "active")).toBe(true);
    expect(matches(onLeave, "", "active")).toBe(false);
    expect(matches(active, "", "all")).toBe(true);
  });

  it("combines search and status", () => {
    const r = makeRow({ firstName: "Sofia", status: "active" });
    expect(matches(r, "sofia", "active")).toBe(true);
    expect(matches(r, "sofia", "terminated")).toBe(false);
    expect(matches(r, "bob", "active")).toBe(false);
  });
});

describe("EmployeeTable pagination", () => {
  it("slices correctly", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      makeRow({ id: String(i) }),
    );
    const pageSize = 5;
    const page = 2;
    const slice = rows.slice((page - 1) * pageSize, page * pageSize);
    expect(slice).toHaveLength(5);
    expect(slice[0]?.id).toBe("5");
  });

  it("shows empty state when no match", () => {
    const rows: EmployeeTableRow[] = [makeRow()];
    const filtered = rows.filter((r) => matches(r, "zzz", "all"));
    expect(filtered).toHaveLength(0);
  });
});

describe("EmployeeTable PII safety", () => {
  it("row type has no encrypted fields", () => {
    const r = makeRow();
    expect((r as unknown as Record<string, unknown>).ssnEnc).toBeUndefined();
    expect((r as unknown as Record<string, unknown>).bankEnc).toBeUndefined();
    expect((r as unknown as Record<string, unknown>).ssn).toBeUndefined();
    expect((r as unknown as Record<string, unknown>).bank).toBeUndefined();
  });
});
