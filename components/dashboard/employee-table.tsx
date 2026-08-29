"use client";

import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Cents, cents, moneyToMajor } from "@/lib/money";
import type { EmployeeStatus } from "@/lib/types";

export type EmployeeTableRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  compensation: Cents;
  status: EmployeeStatus;
  hireDate: string;
};

const statusLabel: Record<EmployeeStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  terminated: "Terminated",
};

const statusStyle: Record<EmployeeStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-0",
  on_leave: "bg-[#fff3e6] text-amber-700 border-0",
  terminated: "bg-[#e6e8ff] text-[#2b2b46] border-0",
};

function initials(firstName: string, lastName: string): string {
  const a = firstName.trim()[0] ?? "";
  const b = lastName.trim()[0] ?? "";
  const v = `${a}${b}`.toUpperCase();
  return v || "??";
}

function formatComp(c: Cents): string {
  const major = moneyToMajor(c);
  const n = Number(major);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function matches(row: EmployeeTableRow, q: string, status: string): boolean {
  if (status !== "all" && row.status !== status) return false;
  if (!q) return true;
  const hay = `${row.firstName} ${row.lastName} ${row.email}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function EmployeeTable({
  employees,
}: {
  employees: EmployeeTableRow[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    compensation: "",
    hireDate: "",
    status: "active" as EmployeeStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => employees.filter((r) => matches(r, q, status)),
    [employees, q, status],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage],
  );
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filtered.length);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fn = form.firstName.trim();
    const ln = form.lastName.trim();
    const em = form.email.trim();
    if (!fn || !ln || !em) {
      setError("First name, last name and email are required.");
      return;
    }
    const dollars = Number(form.compensation);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setError("Compensation must be a non-negative number.");
      return;
    }
    const compCents = Math.round(dollars * 100);
    try {
      cents(compCents);
    } catch {
      setError("Compensation must be valid cents.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trpc/employee.create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: fn,
          lastName: ln,
          email: em,
          ssn: "000-00-0000",
          bank: "00000000",
          compensation: compCents,
          hireDate: form.hireDate || new Date().toISOString().slice(0, 10),
          status: form.status,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          setError("You do not have permission to add employees.");
        } else {
          setError(text || "Failed to create employee.");
        }
        return;
      }
      setAddOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        compensation: "",
        hireDate: "",
        status: "active",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      id="employees"
      className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Employees
            </CardTitle>
            <CardDescription className="mt-1">
              PII encrypted at rest · compensation in minor units
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-[#2b2b46] text-white hover:bg-[#2b2b46]/90">
                <Plus className="size-4" />
                Add employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
                <DialogDescription>
                  Creates via trpc.employee.create. Requires owner, admin or hr.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="emp-fn">First name</Label>
                    <Input
                      id="emp-fn"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="Ada"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emp-ln">Last name</Label>
                    <Input
                      id="emp-ln"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Lovelace"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-email">Email</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="ada@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="emp-comp">Compensation ($)</Label>
                    <Input
                      id="emp-comp"
                      inputMode="decimal"
                      value={form.compensation}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, compensation: e.target.value }))
                      }
                      placeholder="90000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emp-hire">Hire date</Label>
                    <Input
                      id="emp-hire"
                      type="date"
                      value={form.hireDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, hireDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, status: v as EmployeeStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#2b2b46] text-white hover:bg-[#2b2b46]/90"
                  >
                    {submitting ? "Creating…" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email…"
              className="h-9 rounded-xl bg-muted/50 pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-9 w-9 shrink-0 rounded-xl sm:inline-flex"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Compensation</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((e) => (
                  <TableRow key={e.id} className="border-border/60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-[#f4d4eb] text-[#2b2b46] text-xs font-semibold">
                            {initials(e.firstName, e.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none text-[#2b2b46]">
                            {e.firstName} {e.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusStyle[e.status]}
                      >
                        {statusLabel[e.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatComp(e.compensation)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg text-xs"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {start}–{end} of {filtered.length} employees
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-lg"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-lg"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
