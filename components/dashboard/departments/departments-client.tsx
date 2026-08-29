"use client";

import {
  ArrowUp,
  Briefcase,
  Bug,
  Building2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  Eye,
  LayoutGrid,
  Megaphone,
  Package,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEPARTMENTS_MOCK } from "@/lib/departments/mock";
import type {
  DepartmentDisplay,
  DepartmentIconKey,
  DepartmentLocation,
  DepartmentStatus,
} from "@/lib/departments/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<DepartmentStatus, string> = {
  Active: "bg-[#e6fff0] text-emerald-700 border-0",
  Inactive: "bg-[#f3f4f6] text-gray-500 border-0",
};

const ICON_BY_KEY: Record<DepartmentIconKey, React.ElementType> = {
  engineering: Code2,
  marketing: Megaphone,
  product: Package,
  hr: Users,
  finance: Wallet,
  sales: Briefcase,
  support: Users,
  legal: Shield,
  operations: Settings,
  design: Palette,
  qa: Bug,
  data: Database,
};

const ICON_BG: Record<DepartmentIconKey, string> = {
  engineering: "bg-[#e6fbff] text-[#0ea5e9]",
  marketing: "bg-[#fff3e6] text-amber-600",
  product: "bg-[#eef2ff] text-[#4f46e5]",
  hr: "bg-[#f4d4eb] text-pink-600",
  finance: "bg-[#e6fff0] text-emerald-600",
  sales: "bg-[#fef9c3] text-amber-700",
  support: "bg-[#e6e8ff] text-indigo-600",
  legal: "bg-[#f3f4f6] text-gray-600",
  operations: "bg-[#e6fbff] text-cyan-600",
  design: "bg-[#f4e8ff] text-purple-600",
  qa: "bg-[#fff3e6] text-orange-600",
  data: "bg-[#e6fff0] text-teal-600",
};

const DEPARTMENT_NAMES: { label: string; value: DepartmentIconKey }[] = [
  { label: "Engineering", value: "engineering" },
  { label: "Marketing", value: "marketing" },
  { label: "Product", value: "product" },
  { label: "HR", value: "hr" },
  { label: "Finance", value: "finance" },
  { label: "Sales", value: "sales" },
  { label: "Customer Support", value: "support" },
  { label: "Legal", value: "legal" },
  { label: "Operations", value: "operations" },
  { label: "Design", value: "design" },
  { label: "QA", value: "qa" },
  { label: "Data", value: "data" },
];

function matchesFilters(
  dept: DepartmentDisplay,
  q: string,
  status: string,
  location: string,
): boolean {
  const normalizedQ = q.trim().toLowerCase();
  const byQ =
    normalizedQ === "" ||
    dept.name.toLowerCase().includes(normalizedQ) ||
    dept.head.name.toLowerCase().includes(normalizedQ) ||
    dept.head.email.toLowerCase().includes(normalizedQ) ||
    dept.location.toLowerCase().includes(normalizedQ);
  const byStatus = status === "all" || dept.status === status;
  const byLocation = location === "all" || dept.location === location;
  return byQ && byStatus && byLocation;
}

function toCsv(rows: DepartmentDisplay[]): string {
  const headers = [
    "Department",
    "Head",
    "Email",
    "Location",
    "Active Employees",
    "Budget Util %",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.head.name,
      r.head.email,
      r.location,
      String(r.activeEmployees),
      String(r.budgetUtil),
      r.status,
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

function formatBudget(v: number): string {
  return `${v}%`;
}

export function DepartmentsClient() {
  const [departments, setDepartments] =
    useState<DepartmentDisplay[]>(DEPARTMENTS_MOCK);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDept, setViewDept] = useState<DepartmentDisplay | null>(null);
  const [editDept, setEditDept] = useState<DepartmentDisplay | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDisplay | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    iconKey: "engineering" as DepartmentIconKey,
    headName: "",
    headEmail: "",
    location: "HQ" as DepartmentLocation,
    activeEmployees: 1,
    budgetUtil: 50,
    status: "Active" as DepartmentStatus,
  });

  const filtered = useMemo(
    () =>
      departments.filter((d) =>
        matchesFilters(d, q, statusFilter, locationFilter),
      ),
    [departments, q, statusFilter, locationFilter],
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
    const total = departments.length;
    const totalEmployees = departments.reduce(
      (s, d) => s + d.activeEmployees,
      0,
    );
    const activeCount = departments.filter((d) => d.status === "Active").length;
    const avgBudget =
      departments.length === 0
        ? 0
        : Math.round(
            departments.reduce((s, d) => s + d.budgetUtil, 0) /
              departments.length,
          );
    return { total, totalEmployees, activeCount, avgBudget };
  }, [departments]);

  const headcountMax = useMemo(
    () => Math.max(...departments.map((d) => d.activeEmployees), 1),
    [departments],
  );

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
    a.download = "departments.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetForm() {
    setForm({
      name: "",
      iconKey: "engineering",
      headName: "",
      headEmail: "",
      location: "HQ",
      activeEmployees: 1,
      budgetUtil: 50,
      status: "Active",
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.headName.trim()) return;
    const newDept: DepartmentDisplay = {
      id: `dept-${Date.now()}`,
      name: form.name.trim(),
      iconKey: form.iconKey,
      head: {
        name: form.headName.trim(),
        email:
          form.headEmail.trim() ||
          `${form.headName.trim().toLowerCase().replace(/\s+/g, ".")}@saasdesk.com`,
        avatarUrl: "",
        initials: getInitials(form.headName.trim()),
      },
      location: form.location,
      activeEmployees: Math.max(0, Number(form.activeEmployees) || 0),
      budgetUtil: Math.min(100, Math.max(0, Number(form.budgetUtil) || 0)),
      status: form.status,
    };
    setDepartments((prev) => [newDept, ...prev]);
    setAddOpen(false);
    resetForm();
    setPage(1);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDept) return;
    if (!form.name.trim() || !form.headName.trim()) return;
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === editDept.id
          ? {
              ...d,
              name: form.name.trim(),
              iconKey: form.iconKey,
              head: {
                name: form.headName.trim(),
                email: form.headEmail.trim() || d.head.email,
                avatarUrl: d.head.avatarUrl,
                initials: getInitials(form.headName.trim()),
              },
              location: form.location,
              activeEmployees: Math.max(0, Number(form.activeEmployees) || 0),
              budgetUtil: Math.min(
                100,
                Math.max(0, Number(form.budgetUtil) || 0),
              ),
              status: form.status,
            }
          : d,
      ),
    );
    setEditDept(null);
    resetForm();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
    setDeleteTarget(null);
  }

  function openEdit(dept: DepartmentDisplay) {
    setEditDept(dept);
    setForm({
      name: dept.name,
      iconKey: dept.iconKey,
      headName: dept.head.name,
      headEmail: dept.head.email,
      location: dept.location,
      activeEmployees: dept.activeEmployees,
      budgetUtil: dept.budgetUtil,
      status: dept.status,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
              <Building2 className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total Departments
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {stats.total}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              Across organization
            </p>
          </div>
        </Card>
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e6fff0] text-emerald-600">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total Dept Employees
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {stats.totalEmployees}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUp className="size-3" />
              {stats.activeCount} active departments
            </p>
          </div>
        </Card>
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#f4e8ff] text-purple-600">
              <LayoutGrid className="size-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              Avg {stats.avgBudget}%
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Headcount Distribution
            </p>
            <div className="mt-3 flex items-end gap-1.5">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-sm bg-[#2b2b46]"
                    style={{
                      height: `${Math.max(8, Math.round((d.activeEmployees / headcountMax) * 48))}px`,
                    }}
                  />
                  <span className="hidden text-[8px] text-muted-foreground xl:inline">
                    {d.name.slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
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
                placeholder="Search departments..."
                className="h-9 rounded-lg border-border bg-muted pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={locationFilter}
              onValueChange={(v) => {
                setLocationFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="HQ">HQ</SelectItem>
                <SelectItem value="Branch">Branch</SelectItem>
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
              Add Department
            </Button>
          </div>
        </div>
      </Card>

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
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Department Name
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Department Head
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Location
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Active Employees
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Budget Utilization
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No departments found.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((dept) => {
                  const Icon = ICON_BY_KEY[dept.iconKey] ?? Building2;
                  return (
                    <TableRow key={dept.id} className="hover:bg-muted/20">
                      <TableCell>
                        <Checkbox
                          checked={selected.has(dept.id)}
                          onCheckedChange={(v) =>
                            toggleRow(dept.id, Boolean(v))
                          }
                          aria-label={`Select ${dept.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full",
                              ICON_BG[dept.iconKey],
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <span className="text-sm font-medium text-[#2b2b46]">
                            {dept.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            {dept.head.avatarUrl ? (
                              <AvatarImage
                                src={dept.head.avatarUrl}
                                alt={dept.head.name}
                              />
                            ) : null}
                            <AvatarFallback
                              className={cn(
                                "text-xs font-semibold text-[#2b2b46]",
                                avatarBg(dept.head.name),
                              )}
                            >
                              {dept.head.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none text-[#2b2b46]">
                              {dept.head.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {dept.head.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dept.location}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dept.activeEmployees}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress
                            value={dept.budgetUtil}
                            className="h-2 w-24 bg-muted"
                          />
                          <span className="text-sm text-muted-foreground">
                            {formatBudget(dept.budgetUtil)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-3xl border-0 px-2.5 py-0.5 text-xs font-medium",
                            STATUS_STYLE[dept.status],
                          )}
                        >
                          {dept.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7"
                            onClick={() => setViewDept(dept)}
                            aria-label={`View ${dept.name}`}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7"
                            onClick={() => openEdit(dept)}
                            aria-label={`Edit ${dept.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(dept)}
                            aria-label={`Delete ${dept.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row">
          <span>
            Showing {start} to {end} of {filtered.length} departments
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
                    className={cn(
                      "size-7 rounded-lg p-0 text-xs",
                      p === currentPage
                        ? "bg-[#2b2b46] text-white hover:bg-[#2b2b46] hover:text-white"
                        : "",
                    )}
                    onClick={() => setPage(p as number)}
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
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Department Name</Label>
              <Input
                id="add-name"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Engineering"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select
                value={form.iconKey}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, iconKey: v as DepartmentIconKey }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_NAMES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-head-name">Head Name</Label>
                <Input
                  id="add-head-name"
                  value={form.headName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, headName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-head-email">Head Email</Label>
                <Input
                  id="add-head-email"
                  type="email"
                  value={form.headEmail}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, headEmail: e.target.value }))
                  }
                  placeholder="jane@saasdesk.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Location</Label>
                <Select
                  value={form.location}
                  onValueChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      location: v as DepartmentLocation,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HQ">HQ</SelectItem>
                    <SelectItem value="Branch">Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-emp">Active Employees</Label>
                <Input
                  id="add-emp"
                  type="number"
                  min={0}
                  value={form.activeEmployees}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      activeEmployees: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-budget">Budget Utilization %</Label>
                <Input
                  id="add-budget"
                  type="number"
                  min={0}
                  max={100}
                  value={form.budgetUtil}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      budgetUtil: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, status: v as DepartmentStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                Add Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDept} onOpenChange={(o) => !o && setViewDept(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{viewDept?.name}</DialogTitle>
            <DialogDescription>{viewDept?.head.email}</DialogDescription>
          </DialogHeader>
          {viewDept ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    ICON_BG[viewDept.iconKey],
                  )}
                >
                  {(() => {
                    const I = ICON_BY_KEY[viewDept.iconKey] ?? Building2;
                    return <I className="size-5" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium text-[#2b2b46]">{viewDept.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {viewDept.location}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "ml-auto rounded-3xl border-0",
                    STATUS_STYLE[viewDept.status],
                  )}
                >
                  {viewDept.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  {viewDept.head.avatarUrl ? (
                    <AvatarImage
                      src={viewDept.head.avatarUrl}
                      alt={viewDept.head.name}
                    />
                  ) : null}
                  <AvatarFallback
                    className={cn(
                      "font-semibold text-[#2b2b46]",
                      avatarBg(viewDept.head.name),
                    )}
                  >
                    {viewDept.head.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#2b2b46]">
                    {viewDept.head.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewDept.head.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{viewDept.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Active Employees
                  </p>
                  <p className="font-medium">{viewDept.activeEmployees}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Budget Utilization
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <Progress value={viewDept.budgetUtil} className="h-2" />
                    <span className="text-sm font-medium">
                      {formatBudget(viewDept.budgetUtil)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDept(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDept} onOpenChange={(o) => !o && setEditDept(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Department Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select
                value={form.iconKey}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, iconKey: v as DepartmentIconKey }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_NAMES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-head-name">Head Name</Label>
                <Input
                  id="edit-head-name"
                  value={form.headName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, headName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-head-email">Head Email</Label>
                <Input
                  id="edit-head-email"
                  type="email"
                  value={form.headEmail}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, headEmail: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Location</Label>
                <Select
                  value={form.location}
                  onValueChange={(v) =>
                    setForm((s) => ({
                      ...s,
                      location: v as DepartmentLocation,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HQ">HQ</SelectItem>
                    <SelectItem value="Branch">Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-emp">Active Employees</Label>
                <Input
                  id="edit-emp"
                  type="number"
                  min={0}
                  value={form.activeEmployees}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      activeEmployees: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-budget">Budget Utilization %</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  min={0}
                  max={100}
                  value={form.budgetUtil}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      budgetUtil: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, status: v as DepartmentStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDept(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
