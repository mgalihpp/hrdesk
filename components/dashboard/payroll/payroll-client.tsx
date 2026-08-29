"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Ellipsis,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
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
import { usePayrollStore } from "@/lib/stores/payroll-store";
import { useTRPC } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
export type PayrollStatus =
  | "Paid"
  | "Pending Approval"
  | "Processing"
  | "Disputed";
export type EmploymentType = "Salaried" | "Contractor";

export interface PayrollRecord {
  id: string;
  employee: { name: string; email: string; avatar: string };
  employmentType: EmploymentType;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
}

const STATUS_STYLE: Record<PayrollStatus, string> = {
  Paid: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]",
  "Pending Approval": "bg-[#fff3d6] text-[#b48900] border-[#fde4a6]",
  Processing: "bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]",
  Disputed: "bg-[#fee2e2] text-[#be123c] border-[#fecaca]",
};

function matchesFilters(
  r: PayrollRecord,
  q: string,
  type: string,
  month: string,
  status: string,
): boolean {
  const normalizedQ = q.trim().toLowerCase();
  const byQ =
    normalizedQ === "" ||
    r.employee.name.toLowerCase().includes(normalizedQ) ||
    r.employee.email.toLowerCase().includes(normalizedQ);
  const byType = type === "all" || r.employmentType === type;
  const byMonth = month === "all" || r.period === month;
  const byStatus = status === "all" || r.status === status;
  return byQ && byType && byMonth && byStatus;
}

function toCsv(rows: PayrollRecord[]): string {
  const headers = [
    "Employee",
    "Email",
    "Base",
    "Allowances",
    "Deductions",
    "Net",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      r.employee.name,
      r.employee.email,
      String(r.baseSalary),
      String(r.allowances),
      String(r.deductions),
      String(r.netPay),
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

function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

function formatMoneyNoSymbol(n: number): string {
  return n.toLocaleString("en-US");
}

export function PayrollClient({
  initialRecords,
}: {
  initialRecords: PayrollRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState<PayrollRecord[]>(initialRecords);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [runForm, setRunForm] = useState({
    name: "",
    email: "",
    employmentType: "Salaried" as EmploymentType,
    period: "Oct 2026",
    baseSalary: "6500",
    allowances: "800",
    deductions: "1400",
    status: "Paid" as PayrollStatus,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    employmentType: "Salaried" as EmploymentType,
    period: "Oct 2026",
    baseSalary: "6500",
    allowances: "800",
    deductions: "1400",
    status: "Paid" as PayrollStatus,
  });

  const filtered = useMemo(() => {
    const base = records.filter((r) =>
      matchesFilters(r, q, typeFilter, monthFilter, statusFilter),
    );
    const sorted = [...base].sort((a, b) => {
      const cmp = a.employee.name.localeCompare(b.employee.name);
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [records, q, typeFilter, monthFilter, statusFilter, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filtered.length);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const totalPayroll = useMemo(
    () => filtered.reduce((acc, r) => acc + r.netPay, 0),
    [filtered],
  );
  const avgSalary = useMemo(
    () =>
      filtered.length === 0 ? 0 : Math.round(totalPayroll / filtered.length),
    [totalPayroll, filtered.length],
  );
  const pendingCount = useMemo(
    () => filtered.filter((r) => r.status === "Pending Approval").length,
    [filtered],
  );
  const processedCount = filtered.length - pendingCount;
  const deltaAmount = Math.round(totalPayroll * 0.03);

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

  async function handleDelete(id: string) {
    setError(null);
    setSubmitting(true);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const res = await fetch("/api/trpc/payrun.remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.status === 404) {
        router.refresh();
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          setError("You do not have permission to delete payroll records.");
        } else if (text) {
          setError(text);
        }
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }
  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!runForm.name.trim() || !runForm.email.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trpc/payrun.create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          periodStart: "2026-10-01",
          periodEnd: "2026-10-31",
          entityId: "default",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN")) {
          throw new Error("You do not have permission to run payroll.");
        }
        if (
          text.includes("idempotency") ||
          text.includes("duplicate") ||
          text.includes("already exists")
        ) {
          throw new Error("Pay run already exists for this period.");
        }
        throw new Error(text || "Failed to create pay run");
      }
      // optimistic local add for immediate feedback + server refresh
      const base = Number(runForm.baseSalary) || 0;
      const allow = Number(runForm.allowances) || 0;
      const deduct = Number(runForm.deductions) || 0;
      const net = base + allow - deduct;
      const newRecord: PayrollRecord = {
        id: `pr-${Date.now()}`,
        employee: {
          name: runForm.name.trim(),
          email: runForm.email.trim(),
          avatar: "",
        },
        employmentType: runForm.employmentType,
        period: runForm.period,
        baseSalary: base,
        allowances: allow,
        deductions: deduct,
        netPay: net,
        status: runForm.status,
      };
      setRecords((prev) => [newRecord, ...prev]);
      setRunOpen(false);
      setRunForm({
        name: "",
        email: "",
        employmentType: "Salaried",
        period: "Oct 2026",
        baseSalary: "6500",
        allowances: "800",
        deductions: "1400",
        status: "Paid",
      });
      setPage(1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(r: PayrollRecord) {
    setEditRecord(r);
    setEditForm({
      name: r.employee.name,
      email: r.employee.email,
      employmentType: r.employmentType,
      period: r.period,
      baseSalary: String(r.baseSalary),
      allowances: String(r.allowances),
      deductions: String(r.deductions),
      status: r.status,
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    setError(null);
    setSubmitting(true);
    const base = Number(editForm.baseSalary) || 0;
    const allow = Number(editForm.allowances) || 0;
    const deduct = Number(editForm.deductions) || 0;
    const net = base + allow - deduct;
    // optimistic local update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editRecord.id
          ? {
              ...r,
              employee: {
                ...r.employee,
                name: editForm.name.trim(),
                email: editForm.email.trim(),
              },
              employmentType: editForm.employmentType,
              period: editForm.period,
              baseSalary: base,
              allowances: allow,
              deductions: deduct,
              netPay: net,
              status: editForm.status,
            }
          : r,
      ),
    );
    const editingId = editRecord.id;
    setEditRecord(null);
    try {
      // Attempt update via payrun.lock if marking Paid, otherwise generic update if available
      if (editForm.status === "Paid") {
        const res = await fetch("/api/trpc/payrun.lock", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: editingId }),
        });
        if (res.status !== 404 && !res.ok) {
          const text = await res.text();
          if (res.status === 403 || text.includes("FORBIDDEN")) {
            setError("You do not have permission to edit payroll records.");
          } else if (text) {
            setError(text);
          }
        }
      } else {
        // try generic update endpoint if exists (idempotent no-op if 404)
        const res = await fetch("/api/trpc/payrun.update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: editingId }),
        });
        if (res.status !== 404 && !res.ok) {
          const text = await res.text();
          if (res.status === 403 || text.includes("FORBIDDEN")) {
            setError("You do not have permission to edit payroll records.");
          }
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExport() {
    const rows =
      selected.size > 0 ? filtered.filter((r) => selected.has(r.id)) : filtered;
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const bucketConfig = [
    { label: "$4k-5k", height: "30%" },
    { label: "$5k-6k", height: "45%" },
    { label: "$6k-8k", height: "65%" },
    { label: "$8k-$10k", height: "75%" },
    { label: "$10k+", height: "100%" },
  ];

  const donutCircumference = 2 * Math.PI * 34;
  const processedRatio =
    filtered.length === 0 ? 0.88 : processedCount / filtered.length;
  const greenDash =
    donutCircumference * Math.max(0, Math.min(1, processedRatio));
  const redDash = donutCircumference - greenDash;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Total Payroll (Oct 2026)
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[22px] font-semibold leading-none text-[#2b2b46]">
                  {formatMoney(totalPayroll)}
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  ↗ 3%
                </span>
              </div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full border bg-gray-50 text-muted-foreground">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <svg
              width="100%"
              height="32"
              viewBox="0 0 64 24"
              preserveAspectRatio="none"
              className="w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="payroll-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M1 18 L10 14 L20 16 L30 8 L40 12 L50 4 L63 10 L63 24 L1 24 Z"
                fill="url(#payroll-gradient)"
              />
              <path
                d="M1 18 L10 14 L20 16 L30 8 L40 12 L50 4 L63 10"
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full bg-[#f0f0ff] px-3 py-1 text-xs font-medium text-[#2b2b46]">
              ↗ ${formatMoneyNoSymbol(deltaAmount)} this month
            </span>
          </div>
        </Card>
        <Card className="relative overflow-hidden rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <FileText className="pointer-events-none absolute right-4 top-4 size-10 opacity-5" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Pending Approvals
              </p>
              <p className="mt-1 text-[22px] font-semibold leading-none text-[#2b2b46]">
                {pendingCount}
              </p>
              <span className="mt-3 inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {pendingCount} for final signature
              </span>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-red-500" />
                  {pendingCount} Pending
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {processedCount} Processed
                </div>
              </div>
            </div>
            <div className="relative flex size-[96px] shrink-0 items-center justify-center">
              <svg
                width="96"
                height="96"
                viewBox="0 0 80 80"
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeDasharray={`${greenDash} ${donutCircumference}`}
                  strokeLinecap="round"
                />
                {redDash > 1 ? (
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={`${redDash} ${donutCircumference}`}
                    strokeDashoffset={-greenDash}
                    strokeLinecap="round"
                  />
                ) : null}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold leading-none text-[#2b2b46]">
                  {pendingCount}
                </span>
                <span className="text-[11px] leading-none text-muted-foreground">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Average Salary
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[22px] font-semibold leading-none text-[#2b2b46]">
                {formatMoney(avgSalary)}
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Top band: $10k+
              </span>
            </div>
          </div>
          <div className="mt-4 flex h-14 items-end gap-1.5">
            {bucketConfig.map((b) => (
              <div
                key={b.label}
                className="flex h-full flex-1 flex-col justify-end items-center gap-1"
              >
                <div
                  className={cn(
                    "w-full rounded-t-md",
                    b.label === "$10k+" ? "bg-[#2b2b46]" : "bg-[#dbeafe]",
                  )}
                  style={{ height: b.height }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {bucketConfig.map((b) => (
              <span
                key={b.label}
                className="flex-1 text-center text-[10px] leading-none text-muted-foreground"
              >
                {b.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-[16px] border border-black/5 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
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
                placeholder="Search payroll records..."
                className="h-9 rounded-lg border-border bg-muted pl-9 text-sm"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Salaried">Salaried</SelectItem>
                <SelectItem value="Contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={monthFilter}
              onValueChange={(v) => {
                setMonthFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="Oct 2026">Oct 2026</SelectItem>
                <SelectItem value="Sep 2026">Sep 2026</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending Approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg bg-white"
              onClick={handleExport}
            >
              <FileText className="size-4" />
              Export
            </Button>
            <Button
              className="h-9 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              onClick={() => setRunOpen(true)}
            >
              <Plus className="size-4" />
              Run Payroll Cycle
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
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
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setSortAsc((s) => !s)}
                    className="inline-flex items-center gap-1 hover:text-[#2b2b46]"
                  >
                    Employee
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  Base Salary
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  Allowances
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  <span className="flex flex-col leading-none">
                    <span>Deductions</span>
                    <span className="text-[10px] font-normal normal-case tracking-normal">
                      (Taxes/Benefits)
                    </span>
                  </span>
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  Net Pay
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submitting ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="animate-pulse h-4 rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No payroll records found.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(v) => toggleRow(r.id, Boolean(v))}
                        aria-label={`Select ${r.employee.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {r.employee.avatar ? (
                            <AvatarImage
                              src={r.employee.avatar}
                              alt={r.employee.name}
                            />
                          ) : null}
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold text-[#2b2b46]",
                              avatarBg(r.employee.name),
                            )}
                          >
                            {getInitials(r.employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none text-[#2b2b46]">
                            {r.employee.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {r.employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatMoney(r.baseSalary)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatMoney(r.allowances)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatMoney(r.deductions)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1e3a8a]">
                          {formatMoney(r.netPay)}
                        </span>
                        <span className="rounded bg-[#dbeafe] p-1">
                          <CreditCard className="size-3 text-[#2563eb]" />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          STATUS_STYLE[r.status],
                        )}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => setViewRecord(r)}
                          aria-label={`View ${r.employee.name}`}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          onClick={() => openEdit(r)}
                          aria-label={`Edit ${r.employee.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7"
                              aria-label={`More actions for ${r.employee.name}`}
                            >
                              <Ellipsis className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewRecord(r)}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
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

      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Run Payroll Cycle</DialogTitle>
            <DialogDescription>
              Add a new payroll record to the current cycle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRun} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="run-name">Employee Name</Label>
              <Input
                id="run-name"
                value={runForm.name}
                onChange={(e) =>
                  setRunForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="run-email">Email</Label>
              <Input
                id="run-email"
                type="email"
                value={runForm.email}
                onChange={(e) =>
                  setRunForm((s) => ({ ...s, email: e.target.value }))
                }
                placeholder="jane@saasdesk.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Employment Type</Label>
                <Select
                  value={runForm.employmentType}
                  onValueChange={(v) =>
                    setRunForm((s) => ({
                      ...s,
                      employmentType: v as EmploymentType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salaried">Salaried</SelectItem>
                    <SelectItem value="Contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Period</Label>
                <Select
                  value={runForm.period}
                  onValueChange={(v) =>
                    setRunForm((s) => ({ ...s, period: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oct 2026">Oct 2026</SelectItem>
                    <SelectItem value="Sep 2026">Sep 2026</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="run-base">Base Salary</Label>
                <Input
                  id="run-base"
                  type="number"
                  value={runForm.baseSalary}
                  onChange={(e) =>
                    setRunForm((s) => ({ ...s, baseSalary: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="run-allow">Allowances</Label>
                <Input
                  id="run-allow"
                  type="number"
                  value={runForm.allowances}
                  onChange={(e) =>
                    setRunForm((s) => ({ ...s, allowances: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="run-deduct">Deductions</Label>
                <Input
                  id="run-deduct"
                  type="number"
                  value={runForm.deductions}
                  onChange={(e) =>
                    setRunForm((s) => ({ ...s, deductions: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={runForm.status}
                onValueChange={(v) =>
                  setRunForm((s) => ({ ...s, status: v as PayrollStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending Approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Net Pay will be calculated as Base + Allowances − Deductions ={" "}
              {formatMoney(
                (Number(runForm.baseSalary) || 0) +
                  (Number(runForm.allowances) || 0) -
                  (Number(runForm.deductions) || 0),
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRunOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                Run Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editRecord}
        onOpenChange={(o) => !o && setEditRecord(null)}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
            <DialogDescription>
              Update payroll record for {editRecord?.employee.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Employee Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="Salaried">Salaried</SelectItem>
                    <SelectItem value="Contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Period</Label>
                <Select
                  value={editForm.period}
                  onValueChange={(v) =>
                    setEditForm((s) => ({ ...s, period: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oct 2026">Oct 2026</SelectItem>
                    <SelectItem value="Sep 2026">Sep 2026</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-base">Base Salary</Label>
                <Input
                  id="edit-base"
                  type="number"
                  value={editForm.baseSalary}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, baseSalary: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-allow">Allowances</Label>
                <Input
                  id="edit-allow"
                  type="number"
                  value={editForm.allowances}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, allowances: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-deduct">Deductions</Label>
                <Input
                  id="edit-deduct"
                  type="number"
                  value={editForm.deductions}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, deductions: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm((s) => ({ ...s, status: v as PayrollStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending Approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Net Pay preview:{" "}
              {formatMoney(
                (Number(editForm.baseSalary) || 0) +
                  (Number(editForm.allowances) || 0) -
                  (Number(editForm.deductions) || 0),
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRecord(null)}
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
        open={!!viewRecord}
        onOpenChange={(o) => !o && setViewRecord(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{viewRecord?.employee.name}</DialogTitle>
            <DialogDescription>{viewRecord?.employee.email}</DialogDescription>
          </DialogHeader>
          {viewRecord ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {viewRecord.employee.avatar ? (
                    <AvatarImage
                      src={viewRecord.employee.avatar}
                      alt={viewRecord.employee.name}
                    />
                  ) : null}
                  <AvatarFallback
                    className={cn(
                      "font-semibold text-[#2b2b46]",
                      avatarBg(viewRecord.employee.name),
                    )}
                  >
                    {getInitials(viewRecord.employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#2b2b46]">
                    {viewRecord.employee.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewRecord.employmentType} · {viewRecord.period}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    STATUS_STYLE[viewRecord.status],
                  )}
                >
                  {viewRecord.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Employment Type
                  </p>
                  <p className="font-medium">{viewRecord.employmentType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="font-medium">{viewRecord.period}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Base Salary</p>
                  <p className="font-medium">
                    {formatMoney(viewRecord.baseSalary)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Allowances</p>
                  <p className="font-medium">
                    {formatMoney(viewRecord.allowances)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="font-medium">
                    {formatMoney(viewRecord.deductions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Pay</p>
                  <p className="font-semibold text-[#1e3a8a]">
                    {formatMoney(viewRecord.netPay)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium break-all">
                    {viewRecord.employee.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{viewRecord.status}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>
              Close
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (viewRecord) handleDelete(viewRecord.id);
                setViewRecord(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
