"use client";

import {
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  FileText,
  HandCoins,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PayslipStatus = "Paid" | "Pending" | "Generated";
type PayslipType = "Monthly" | "Bonus" | "Off-cycle";

interface PayslipRecord {
  id: string;
  employee: { name: string; email: string; avatar: string };
  employeeId: string;
  department: string;
  lastPayrunDate: string;
  totalNetPay: number;
  status: PayslipStatus;
  type: PayslipType;
}

const STATUS_STYLE: Record<PayslipStatus, string> = {
  Paid: "border-[#86efac] bg-[#dcfce7] text-[#15803d]",
  Pending: "border-[#e5e7eb] bg-[#f3f4f6] text-[#64748b]",
  Generated: "border-[#fde68a] bg-[#fef3c7] text-[#a16207]",
};

const PAYSLIPS_MOCK: PayslipRecord[] = [
  {
    id: "1",
    employee: {
      name: "Sarah Wijaya",
      email: "sarah.w@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP001",
    department: "Marketing",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 15000,
    status: "Pending",
    type: "Monthly",
  },
  {
    id: "2",
    employee: {
      name: "Andi Pratama",
      email: "andi.pratama@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP002",
    department: "Engineering",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 12000,
    status: "Paid",
    type: "Monthly",
  },
  {
    id: "3",
    employee: {
      name: "Dewi Lestari",
      email: "dewi.lestari@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP003",
    department: "HR",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 10000,
    status: "Generated",
    type: "Monthly",
  },
  {
    id: "4",
    employee: {
      name: "Budi Santoso",
      email: "budi.s@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP004",
    department: "Finance",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 18500,
    status: "Paid",
    type: "Bonus",
  },
  {
    id: "5",
    employee: {
      name: "Citra Kirana",
      email: "citra.k@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP005",
    department: "Product",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 14200,
    status: "Generated",
    type: "Monthly",
  },
  {
    id: "6",
    employee: { name: "Eko Nugroho", email: "eko.n@saasdesk.com", avatar: "" },
    employeeId: "EMP006",
    department: "Engineering",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 16800,
    status: "Pending",
    type: "Off-cycle",
  },
  {
    id: "7",
    employee: {
      name: "Fajar Hidayat",
      email: "fajar.h@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP007",
    department: "Sales",
    lastPayrunDate: "30 Aug 2026",
    totalNetPay: 11000,
    status: "Paid",
    type: "Monthly",
  },
  {
    id: "8",
    employee: {
      name: "Gita Permata",
      email: "gita.p@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP008",
    department: "Design",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 13500,
    status: "Generated",
    type: "Monthly",
  },
  {
    id: "9",
    employee: {
      name: "Hendra Wijaya",
      email: "hendra.w@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP009",
    department: "Operations",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 9800,
    status: "Paid",
    type: "Monthly",
  },
  {
    id: "10",
    employee: { name: "Intan Sari", email: "intan.s@saasdesk.com", avatar: "" },
    employeeId: "EMP010",
    department: "Customer Support",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 8900,
    status: "Pending",
    type: "Bonus",
  },
  {
    id: "11",
    employee: { name: "Joko Anwar", email: "joko.a@saasdesk.com", avatar: "" },
    employeeId: "EMP011",
    department: "Engineering",
    lastPayrunDate: "30 Sep 2026",
    totalNetPay: 21000,
    status: "Paid",
    type: "Monthly",
  },
  {
    id: "12",
    employee: {
      name: "Kartika Dewi",
      email: "kartika.d@saasdesk.com",
      avatar: "",
    },
    employeeId: "EMP012",
    department: "Legal",
    lastPayrunDate: "30 Aug 2026",
    totalNetPay: 16200,
    status: "Generated",
    type: "Monthly",
  },
];
function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? "U").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function avatarBg(name: string): string {
  const colors = [
    "bg-[#ede9fe]",
    "bg-[#fce7f3]",
    "bg-[#e0f2fe]",
    "bg-[#fef3c7]",
    "bg-[#dcfce7]",
    "bg-[#ffedd5]",
    "bg-[#f3e8ff]",
    "bg-[#e0e7ff]",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length] ?? "bg-[#f3e8ff]";
}

export function PayslipsClient() {
  const [records, setRecords] = useState<PayslipRecord[]>(PAYSLIPS_MOCK);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewRecord, setViewRecord] = useState<PayslipRecord | null>(null);
  const [pdfRecord, setPdfRecord] = useState<PayslipRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayslipRecord | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "Engineering",
    netPay: "12000",
    status: "Pending" as PayslipStatus,
    type: "Monthly" as PayslipType,
    date: "30 Sep 2026",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "Engineering",
    netPay: "12000",
    status: "Pending" as PayslipStatus,
    type: "Monthly" as PayslipType,
    date: "30 Sep 2026",
  });

  const filtered = useMemo(() => {
    const base = records.filter((r) => {
      const qq = q.trim().toLowerCase();
      const matchQ =
        qq === "" ||
        r.employee.name.toLowerCase().includes(qq) ||
        r.employee.email.toLowerCase().includes(qq) ||
        r.employeeId.toLowerCase().includes(qq) ||
        r.department.toLowerCase().includes(qq);
      if (!matchQ) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFilter !== "all") {
        if (
          dateFilter === "This Month" &&
          !r.lastPayrunDate.includes("Sep 2026")
        )
          return false;
        if (
          dateFilter === "Last Month" &&
          !r.lastPayrunDate.includes("Aug 2026")
        )
          return false;
      }
      return true;
    });
    const sorted = [...base].sort((a, b) => {
      const cmp = a.employee.name.localeCompare(b.employee.name);
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [records, q, typeFilter, statusFilter, dateFilter, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filtered.length);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
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

  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const netPay = Number(form.netPay.replace(/[^0-9]/g, "")) || 0;
    const newRecord: PayslipRecord = {
      id: `ps-${Date.now()}`,
      employee: {
        name: form.name.trim(),
        email: form.email.trim(),
        avatar: "",
      },
      employeeId:
        form.employeeId.trim() ||
        `EMP${String(records.length + 1).padStart(3, "0")}`,
      department: form.department,
      lastPayrunDate: form.date,
      totalNetPay: netPay,
      status: form.status,
      type: form.type,
    };
    setRecords((prev) => [newRecord, ...prev]);
    setGenerateOpen(false);
    setForm({
      name: "",
      email: "",
      employeeId: "",
      department: "Engineering",
      netPay: "12000",
      status: "Pending",
      type: "Monthly",
      date: "30 Sep 2026",
    });
    setPage(1);
  }

  function openEdit(r: PayslipRecord) {
    setEditRecord(r);
    setEditForm({
      name: r.employee.name,
      email: r.employee.email,
      employeeId: r.employeeId,
      department: r.department,
      netPay: String(r.totalNetPay),
      status: r.status,
      type: r.type,
      date: r.lastPayrunDate,
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    const netPay = Number(editForm.netPay.replace(/[^0-9]/g, "")) || 0;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editRecord.id
          ? {
              ...r,
              employee: {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                avatar: r.employee.avatar,
              },
              employeeId: editForm.employeeId.trim(),
              department: editForm.department,
              lastPayrunDate: editForm.date,
              totalNetPay: netPay,
              status: editForm.status,
              type: editForm.type,
            }
          : r,
      ),
    );
    setEditRecord(null);
  }

  function handlePrintPayslip() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-[#a7f3d0]/50 bg-[#ecfdf5] text-[#059669]">
                <HandCoins className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Total Employees Paid
                </p>
                <p className="mt-1 text-[24px] font-bold leading-none tracking-tight text-[#2b2b46]">
                  118
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-medium text-[#065f46]">
                  <span className="text-[#059669]">↗</span> +3.2% this month
                </span>
              </div>
            </div>
            <div className="hidden shrink-0 sm:block">
              <svg
                width="72"
                height="32"
                viewBox="0 0 72 32"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 22 L12 18 L22 20 L32 12 L42 16 L54 8 L71 12 L71 32 L1 32 Z"
                  fill="#eff6ff"
                />
                <path
                  d="M1 22 L12 18 L22 20 L32 12 L42 16 L54 8 L71 12"
                  stroke="#2563eb"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-black/[0.06] pt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-[#10b981]" /> 106 paid
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-[#f59e0b]" /> 12 pending
            </span>
            <span className="ml-auto font-medium text-[#2b2b46]">
              92% completed
            </span>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-[#bfdbfe]/60 bg-[#eff6ff] text-[#2563eb]">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Total Payroll Amount
                </p>
                <p className="mt-1 text-[24px] font-bold leading-none tracking-tight text-[#2b2b46]">
                  $1.5B
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fef2f2] px-2.5 py-1 text-xs font-medium text-[#991b1b]">
                  <span className="text-[#dc2626]">↘</span> -2% this month
                </span>
              </div>
            </div>
            <span className="hidden rounded-full border border-black/5 bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              Avg $12,400
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly budget used</span>
              <span className="font-medium text-[#2b2b46]">42%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
              <div className="h-full w-[42%] rounded-full bg-[#2563eb]" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-[#fde68a]/60 bg-[#fef3c7] text-[#d97706]">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Next Payrun Date
                </p>
                <p className="mt-1 text-[24px] font-bold leading-none tracking-tight text-[#2b2b46]">
                  30 Oct 2026
                </p>
                <span className="mt-2 inline-flex items-center rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-medium text-[#1d4ed8]">
                  in 12 days • Scheduled
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cycle progress</span>
              <span className="font-medium text-[#2b2b46]">78%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
              <div className="h-full w-[78%] rounded-full bg-[#2563eb]" />
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
                placeholder="Search payslips..."
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
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Bonus">Bonus</SelectItem>
                <SelectItem value="Off-cycle">Off-cycle</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(v) => {
                setDateFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
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
                <SelectItem value="Generated">Generated</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setGenerateOpen(true)}
              className="h-9 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="size-4" />
              Generate Payslips
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-[#f9fafb] text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setSortAsc((v) => !v)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Employee
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3">Employee ID</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Last Payrun Date</th>
                <th className="px-3 py-3">Total Net Pay</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-sm text-muted-foreground"
                  >
                    No payslips found for the current filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(v) => toggleRow(r.id, Boolean(v))}
                        aria-label={`Select ${r.employee.name}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={r.employee.avatar}
                            alt={r.employee.name}
                          />
                          <AvatarFallback
                            className={`${avatarBg(r.employee.name)} text-xs font-medium text-[#2b2b46]`}
                          >
                            {getInitials(r.employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-none text-[#2b2b46]">
                            {r.employee.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[#2b2b46]">
                      {r.employeeId}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {r.department}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {r.lastPayrunDate}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-[#2b2b46]">
                      {formatMoney(r.totalNetPay)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setPdfRecord(r)}
                          aria-label="View payslip PDF"
                        >
                          <FileText className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setViewRecord(r)}
                          aria-label="View"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(r)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-[#dc2626]"
                          onClick={() => handleDelete(r.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {start} to {end} of {filtered.length} employees
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-full"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              {pages.map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="icon"
                    className={`size-7 rounded-full text-xs ${p === currentPage ? "bg-[#2b2b46] text-white hover:bg-[#1e1e32]" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-full"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="ml-2 h-7 w-[88px] rounded-full text-xs">
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

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Generate Payslip</DialogTitle>
            <DialogDescription>
              Create a new payslip for an employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-name">Employee name</Label>
                <Input
                  id="g-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Sarah Wijaya"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-email">Email</Label>
                <Input
                  id="g-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="sarah@saasdesk.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employee ID</Label>
                <Input
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  placeholder="EMP013"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, department: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total net pay ($)</Label>
                <Input
                  value={form.netPay}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, netPay: e.target.value }))
                  }
                  placeholder="15000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payrun date</Label>
                <Input
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  placeholder="30 Sep 2026"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as PayslipStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Generated">Generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as PayslipType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Bonus">Bonus</SelectItem>
                    <SelectItem value="Off-cycle">Off-cycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              >
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewRecord}
        onOpenChange={(o) => {
          if (!o) setViewRecord(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Payslip detail</DialogTitle>
            <DialogDescription>View payslip information.</DialogDescription>
          </DialogHeader>
          {viewRecord ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    src={viewRecord.employee.avatar}
                    alt={viewRecord.employee.name}
                  />
                  <AvatarFallback
                    className={`${avatarBg(viewRecord.employee.name)} text-sm`}
                  >
                    {getInitials(viewRecord.employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#2b2b46]">
                    {viewRecord.employee.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewRecord.employee.email}
                  </p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[viewRecord.status]}`}
                >
                  {viewRecord.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border bg-[#f9fafb] p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{viewRecord.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">{viewRecord.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last payrun</p>
                  <p className="font-medium">{viewRecord.lastPayrunDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{viewRecord.type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Total net pay</p>
                  <p className="text-base font-semibold text-[#2b2b46]">
                    {formatMoney(viewRecord.totalNetPay)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editRecord}
        onOpenChange={(o) => {
          if (!o) setEditRecord(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit payslip</DialogTitle>
            <DialogDescription>Update payslip details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employee name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employee ID</Label>
                <Input
                  value={editForm.employeeId}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={editForm.department}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, department: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total net pay ($)</Label>
                <Input
                  value={editForm.netPay}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, netPay: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payrun date</Label>
                <Input
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, status: v as PayslipStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Generated">Generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(v) =>
                    setEditForm((p) => ({ ...p, type: v as PayslipType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Bonus">Bonus</SelectItem>
                    <SelectItem value="Off-cycle">Off-cycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRecord(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pdfRecord} onOpenChange={(o) => { if (!o) setPdfRecord(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px] p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <DialogTitle className="text-base font-semibold text-[#2b2b46]">Payslip Preview</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {pdfRecord?.employee.name} • {pdfRecord?.employeeId} • {pdfRecord?.lastPayrunDate}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={handlePrintPayslip}>
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button size="sm" className="h-8 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8]" onClick={handlePrintPayslip}>
                <FileText className="size-3.5" />
                Download PDF
              </Button>
            </div>
          </div>
          {pdfRecord ? (
            <div className="bg-white p-8 text-black">
              <div className="flex flex-col items-center text-center">
                <img src="/saasdesk-logo.svg" alt="SAASDESK" className="h-7 w-auto" />
                <p className="mt-2 text-xs text-muted-foreground">123 Business Avenue, South Jakarta</p>
              </div>
              <div className="mt-8">
                <p className="text-sm font-bold">Pay Slip for the period of {pdfRecord.lastPayrunDate.replace("30 ", "")}</p>
                <div className="mt-3 grid grid-cols-2 gap-8 text-xs leading-5">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-[140px]">Employee ID</span><span className="w-4">:</span><span>{pdfRecord.employeeId}</span></div>
                    <div className="flex"><span className="w-[140px]">Name</span><span className="w-4">:</span><span>{pdfRecord.employee.name}</span></div>
                    <div className="flex"><span className="w-[140px]">Department</span><span className="w-4">:</span><span>{pdfRecord.department}</span></div>
                    <div className="flex"><span className="w-[140px]">Designation</span><span className="w-4">:</span><span>Sales Executive</span></div>
                    <div className="flex"><span className="w-[140px]">Pay Date</span><span className="w-4">:</span><span>27-08-2025</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex"><span className="w-[180px]">Date of Joining</span><span className="w-4">:</span><span>01-03-2020</span></div>
                    <div className="flex"><span className="w-[180px]">Employment Insurance No.</span><span className="w-4">:</span><span>ID/SA/5678</span></div>
                    <div className="flex"><span className="w-[180px]">Health Insurance No.</span><span className="w-4">:</span><span>89</span></div>
                    <div className="flex"><span className="w-[180px]">Days Worked</span><span className="w-4">:</span><span>22.0</span></div>
                    <div className="flex"><span className="w-[180px]">Bank Account / Cheque No.</span><span className="w-4">:</span><span>xxxxxxxxxxxx</span></div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm font-bold">Earnings</p>
                    <div className="mt-2 space-y-1 text-xs leading-5">
                      <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">: {formatMoney(12000)}</span></div>
                      <div className="flex justify-between"><span>Position Allowance</span><span className="font-mono">: {formatMoney(6000)}</span></div>
                      <div className="flex justify-between"><span>Transport Allowance</span><span className="font-mono">: {formatMoney(2500)}</span></div>
                      <div className="flex justify-between"><span>Health Allowance</span><span className="font-mono">: {formatMoney(1800)}</span></div>
                      <div className="flex justify-between"><span>Housing Allowance</span><span className="font-mono">: {formatMoney(4500)}</span></div>
                      <div className="flex justify-between"><span>Meal Allowance</span><span className="font-mono">: {formatMoney(800)}</span></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Deductions</p>
                    <div className="mt-2 space-y-1 text-xs leading-5">
                      <div className="flex justify-between"><span>Income Tax (PPh 21)</span><span className="font-mono">: {formatMoney(250)}</span></div>
                      <div className="flex justify-between"><span>Employment Insurance</span><span className="font-mono">: {formatMoney(1500)}</span></div>
                      <div className="flex justify-between"><span>Health Insurance</span><span className="font-mono">: {formatMoney(400)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="my-4 h-px bg-black" />
                <div className="grid grid-cols-2 gap-8 text-xs leading-5">
                  <div className="space-y-2">
                    <div className="flex"><span className="w-[170px] font-bold">Total Earnings (Rounded)</span><span className="w-4">:</span><span className="font-mono"> {formatMoney(27600)}</span></div>
                    <div className="flex"><span className="w-[170px] font-bold">Take Home Pay</span><span className="w-4">:</span><span className="font-mono"> {formatMoney(25450)}</span></div>
                  </div>
                  <div>
                    <div className="flex"><span className="w-[150px] font-bold">Total Deductions</span><span className="w-4">:</span><span className="font-mono"> {formatMoney(2150)}</span></div>
                  </div>
                </div>
                <div className="mt-12 text-right text-xs leading-5">
                  <p>Jakarta, August 20, 2025</p>
                  <p className="mt-10 font-bold">Manager</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
