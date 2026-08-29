"use client";

import {
  ArrowUp,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Upload,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type {
  Department,
  EmployeeDisplay,
  EmployeeStatusLabel,
  EmploymentType,
} from "@/lib/employees/types";

const STATUS_STYLE: Record<EmployeeStatusLabel, string> = {
  Active: "bg-[#e6fff0] text-emerald-700 border-0",
  "On Leave": "bg-[#fff3e6] text-amber-700 border-0",
};

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Marketing",
  "Product",
  "HR",
  "Finance",
  "Sales",
  "Customer Support",
  "Legal",
  "Operations",
  "Design",
  "QA",
  "Data",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Employees",
    icon: Users,
    bg: "bg-[#eef2ff]",
    iconColor: "text-[#4f46e5]",
    trend: "↑ 8 this month",
    trendColor: "text-emerald-600",
  },
  {
    key: "active",
    label: "Active Employees",
    icon: UserCheck,
    bg: "bg-[#e6fff3]",
    iconColor: "text-emerald-600",
    trend: "↑ 3 this month",
    trendColor: "text-emerald-600",
  },
  {
    key: "leave",
    label: "On Leave",
    icon: UserX,
    bg: "bg-[#fff3e6]",
    iconColor: "text-amber-600",
    trend: "↑ 1 this month",
    trendColor: "text-amber-600",
  },
  {
    key: "dept",
    label: "Departments",
    icon: Building2,
    bg: "bg-[#f4e8ff]",
    iconColor: "text-purple-600",
    trend: "Across organization",
    trendColor: "text-muted-foreground",
  },
] as const;

type ColumnDef = {
  key: string;
  label: string;
  className?: string;
};

const COLUMNS: ColumnDef[] = [
  { key: "check", label: "" },
  { key: "employee", label: "Employee" },
  { key: "department", label: "Department" },
  { key: "position", label: "Position" },
  { key: "status", label: "Status" },
  { key: "employmentType", label: "Employment Type" },
  { key: "joinedDate", label: "Joined Date" },
  { key: "actions", label: "Actions" },
];

function matchesFilters(
  emp: EmployeeDisplay,
  q: string,
  department: string,
  status: string,
  employmentType: string,
): boolean {
  const normalizedQ = q.trim().toLowerCase();
  const byQ =
    normalizedQ === "" ||
    emp.name.toLowerCase().includes(normalizedQ) ||
    emp.email.toLowerCase().includes(normalizedQ) ||
    emp.department.toLowerCase().includes(normalizedQ) ||
    emp.position.toLowerCase().includes(normalizedQ);
  const byDept = department === "all" || emp.department === department;
  const byStatus = status === "all" || emp.status === status;
  const byType =
    employmentType === "all" || emp.employmentType === employmentType;
  return byQ && byDept && byStatus && byType;
}

function toCsv(rows: EmployeeDisplay[]): string {
  const headers = [
    "Employee",
    "Email",
    "Department",
    "Position",
    "Status",
    "Employment Type",
    "Joined Date",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.department,
      r.position,
      r.status,
      r.employmentType,
      r.joinedDate,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

function avatarBg(name: string): string {
  const colors = [
    "bg-[#f4d4eb]",
    "bg-[#e6fbff]",
    "bg-[#fff3e6]",
    "bg-[#e6fff0]",
    "bg-[#e6e8ff]",
    "bg-[#fef9c3]",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length] ?? "bg-[#f4d4eb]";
}

export function EmployeesClient({
  initialEmployees,
}: {
  initialEmployees: EmployeeDisplay[];
}) {
  const router = useRouter();
  const [employees] = useState<EmployeeDisplay[]>(initialEmployees);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [employmentType, setEmploymentType] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<EmployeeDisplay | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    department: "Engineering" as Department,
    position: "",
    status: "Active" as EmployeeStatusLabel,
    employmentType: "Full Time" as EmploymentType,
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "Engineering" as Department,
    position: "",
    status: "Active" as EmployeeStatusLabel,
    employmentType: "Full Time" as EmploymentType,
    joinedDate: "",
    compensation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      employees.filter((e) =>
        matchesFilters(e, q, department, status, employmentType),
      ),
    [employees, q, department, status, employmentType],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filtered.length);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Active").length;
    const onLeave = employees.filter((e) => e.status === "On Leave").length;
    const departments = new Set(employees.map((e) => e.department)).size;
    return { total, active, onLeave, departments };
  }, [employees]);

  const statValues: Record<string, number | string> = {
    total: stats.total,
    active: stats.active,
    leave: stats.onLeave,
    dept: stats.departments,
  };

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const pages = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const out: (number | string)[] = [1, 2, 3];
    if (currentPage > 4) out.push("ellipsis-start");
    const mid = [currentPage - 1, currentPage, currentPage + 1].filter(
      (n) => n > 3 && n < totalPages,
    );
    out.push(...mid);
    if (currentPage < totalPages - 3) out.push("ellipsis-end");
    out.push(totalPages);
    const uniq: (number | string)[] = [];
    for (const p of out) if (!uniq.includes(p)) uniq.push(p);
    return uniq;
  }, [totalPages, currentPage]);

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of pageRows) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  function handleExport() {
    const rows =
      selected.size > 0 ? filtered.filter((r) => selected.has(r.id)) : filtered;
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const nameTrimmed = form.name.trim();
      const parts = nameTrimmed.split(/\s+/);
      const firstName = parts[0] ?? nameTrimmed;
      const lastName = parts.slice(1).join(" ").trim() || "-";
      const compensation = Math.round(Number(form.compensation || "0") * 100);
      const hireDate = form.joinedDate || new Date().toISOString().slice(0, 10);
      const statusValue = form.status === "Active" ? "active" : "on_leave";
      const res = await fetch("/api/trpc/employee.create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: form.email.trim(),
          ssn: "000-00-0000",
          bank: "00000000",
          compensation,
          hireDate,
          status: statusValue,
          department: form.department,
          position: form.position.trim() || "Employee",
          employmentType: form.employmentType,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          setError("You do not have permission.");
        } else {
          setError(text || "Failed to create employee.");
        }
        return;
      }
      setAddOpen(false);
      setForm({
        name: "",
        email: "",
        department: "Engineering",
        position: "",
        status: "Active",
        employmentType: "Full Time",
        joinedDate: "",
        compensation: "",
      });
      setPage(1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trpc/employee.remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          setError("You do not have permission.");
        } else {
          setError(text || "Failed to delete employee.");
        }
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!viewEmployee) return;
    setError(null);
    setSubmitting(true);
    try {
      const patch: Record<string, unknown> = {};
      if (editForm.department !== viewEmployee.department) {
        patch.department = editForm.department;
      }
      if (editForm.position !== viewEmployee.position) {
        patch.position = editForm.position;
      }
      const mappedStatus = editForm.status === "Active" ? "active" : "on_leave";
      const currentMapped =
        viewEmployee.status === "Active" ? "active" : "on_leave";
      if (mappedStatus !== currentMapped) {
        patch.status = mappedStatus;
      }
      if (editForm.employmentType !== viewEmployee.employmentType) {
        patch.employmentType = editForm.employmentType;
      }
      if (Object.keys(patch).length === 0) {
        setIsEditing(false);
        return;
      }
      const res = await fetch("/api/trpc/employee.update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: viewEmployee.id, patch }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          setError("You do not have permission.");
        } else {
          setError(text || "Failed to update employee.");
        }
        return;
      }
      setIsEditing(false);
      setViewEmployee(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  function openView(emp: EmployeeDisplay) {
    setViewEmployee(emp);
    setIsEditing(false);
    setEditForm({
      department: emp.department,
      position: emp.position,
      status: emp.status,
      employmentType: emp.employmentType,
    });
    setError(null);
  }

  function openEdit(emp: EmployeeDisplay) {
    setViewEmployee(emp);
    setIsEditing(true);
    setEditForm({
      department: emp.department,
      position: emp.position,
      status: emp.status,
      employmentType: emp.employmentType,
    });
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((c) => (
          <Card
            key={c.key}
            className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex size-9 items-center justify-center rounded-xl ${c.bg} ${c.iconColor}`}
              >
                <c.icon className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
                {statValues[c.key]}
              </p>
              <p
                className={`mt-1 flex items-center gap-1 text-xs ${c.trendColor}`}
              >
                {c.trend.includes("↑") ? <ArrowUp className="size-3" /> : null}
                {c.trend}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-[16px] border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search employees..."
                className="h-9 rounded-lg border-border bg-muted pl-9"
              />
            </div>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[180px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={employmentType}
              onValueChange={(v) => {
                setEmploymentType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full Time">Full Time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Part Time">Part Time</SelectItem>
                <SelectItem value="Intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg bg-white"
              onClick={handleExport}
            >
              <Upload className="size-4" />
              Export
            </Button>
            <Button
              className="h-9 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#fbfaf9]">
              <TableRow className="hover:bg-[#fbfaf9]">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="Select all"
                  />
                </TableHead>
                {COLUMNS.slice(1).map((c) => (
                  <TableHead
                    key={c.key}
                    className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground"
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submitting ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="animate-pulse h-4 bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ) : null}
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(emp.id)}
                        onCheckedChange={(v) => toggleRow(emp.id, Boolean(v))}
                        aria-label={`Select ${emp.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {emp.avatarUrl ? (
                            <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                          ) : null}
                          <AvatarFallback
                            className={`${avatarBg(emp.name)} text-xs font-semibold text-[#2b2b46]`}
                          >
                            {emp.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none text-[#2b2b46]">
                            {emp.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.department}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.position}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLE[emp.status]}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.employmentType}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {emp.joinedDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => openView(emp)}
                          aria-label={`View ${emp.name}`}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7"
                              aria-label={`Actions for ${emp.name}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(emp)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(emp)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(emp.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row">
          <span>
            Showing {start} to {end} of {filtered.length} employees
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-lg"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1">
              {pages.map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="px-1">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "ghost"}
                    size="sm"
                    className={`size-7 rounded-lg p-0 text-xs ${p === currentPage ? "bg-[#2b2b46] text-white hover:bg-[#2b2b46] hover:text-white" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-lg"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-[88px] rounded-lg bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              Add a new employee to your organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="jane@saasdesk.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, department: v as Department }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-position">Position</Label>
                <Input
                  id="add-position"
                  value={form.position}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, position: e.target.value }))
                  }
                  placeholder="Product Manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, status: v as EmployeeStatusLabel }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Employment Type</Label>
                <Select
                  value={form.employmentType}
                  onValueChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      employmentType: v as EmploymentType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-compensation">Compensation</Label>
              <Input
                id="add-compensation"
                type="number"
                value={form.compensation}
                onChange={(e) =>
                  setForm((s) => ({ ...s, compensation: e.target.value }))
                }
                placeholder="50000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-date">Joined Date</Label>
              <Input
                id="add-date"
                type="date"
                value={form.joinedDate}
                onChange={(e) =>
                  setForm((s) => ({ ...s, joinedDate: e.target.value }))
                }
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewEmployee}
        onOpenChange={(o) => {
          if (!o) {
            setViewEmployee(null);
            setIsEditing(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{viewEmployee?.name}</DialogTitle>
            <DialogDescription>{viewEmployee?.email}</DialogDescription>
          </DialogHeader>
          {viewEmployee ? (
            isEditing ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select
                    value={editForm.department}
                    onValueChange={(v) =>
                      setEditForm((s) => ({
                        ...s,
                        department: v as Department,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, position: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) =>
                        setEditForm((s) => ({
                          ...s,
                          status: v as EmployeeStatusLabel,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={editForm.employmentType}
                      onValueChange={(v) =>
                        setEditForm((s) => ({
                          ...s,
                          employmentType: v as EmploymentType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Time">Full Time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Part Time">Part Time</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    {viewEmployee.avatarUrl ? (
                      <AvatarImage
                        src={viewEmployee.avatarUrl}
                        alt={viewEmployee.name}
                      />
                    ) : null}
                    <AvatarFallback
                      className={`${avatarBg(viewEmployee.name)} font-semibold text-[#2b2b46]`}
                    >
                      {viewEmployee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-[#2b2b46]">
                      {viewEmployee.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {viewEmployee.position}
                    </p>
                  </div>
                  <Badge
                    className={`ml-auto ${STATUS_STYLE[viewEmployee.status]}`}
                  >
                    {viewEmployee.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{viewEmployee.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Employment Type
                    </p>
                    <p className="font-medium">{viewEmployee.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined Date</p>
                    <p className="font-medium">{viewEmployee.joinedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium break-all">
                      {viewEmployee.email}
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : null}
          <DialogFooter>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={submitting}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewEmployee(null);
                    setIsEditing(false);
                  }}
                >
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
