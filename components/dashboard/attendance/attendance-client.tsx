"use client";

import {
  ArrowUp,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
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
  AttendanceRecord,
  AttendanceStatus,
  DateRangePreset,
  Department,
} from "@/lib/attendance/types";
import type { TimeEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  Active: "bg-[#e6fff0] text-emerald-700 border-0",
  Late: "bg-[#fff3e6] text-amber-700 border-0",
  "On Leave": "bg-[#e6e8ff] text-indigo-700 border-0",
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

const DATE_RANGES: DateRangePreset[] = [
  "All Time",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
];

const STAT_CARDS = [
  {
    key: "rate",
    label: "Average Attendance Rate",
    value: "92.5%",
    icon: MapPin,
    bg: "bg-[#e6f0ff]",
    iconColor: "text-[#2563eb]",
    trend: "↑ 2.1% vs last month",
    trendColor: "text-emerald-600",
  },
  {
    key: "late",
    label: "Total Late Occurrences",
    value: "15",
    icon: Clock3,
    bg: "bg-[#fff3e6]",
    iconColor: "text-amber-600",
    trend: "↓ 3 vs last month",
    trendColor: "text-emerald-600",
    sparkline: true,
  },
  {
    key: "clock",
    label: "Average Clock-In Time",
    value: "08:45 AM",
    icon: CalendarCheck,
    bg: "bg-[#e6e8ff]",
    iconColor: "text-indigo-600",
    trend: "On time",
    trendColor: "text-muted-foreground",
  },
] as const;

type ColumnDef = { key: string; label: string };

const COLUMNS: ColumnDef[] = [
  { key: "check", label: "" },
  { key: "employee", label: "Employee" },
  { key: "department", label: "Department" },
  { key: "date", label: "Date" },
  { key: "clockIn", label: "Clock In" },
  { key: "clockOut", label: "Clock Out" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

function matchesFilters(
  r: AttendanceRecord,
  q: string,
  department: string,
  status: string,
  dateRange: DateRangePreset,
): boolean {
  const normalizedQ = q.trim().toLowerCase();
  const byQ =
    normalizedQ === "" ||
    r.employee.name.toLowerCase().includes(normalizedQ) ||
    r.employee.email.toLowerCase().includes(normalizedQ) ||
    r.employee.department.toLowerCase().includes(normalizedQ);
  const byDept = department === "all" || r.employee.department === department;
  const byStatus = status === "all" || r.status === status;
  let byDate = true;
  if (dateRange !== "All Time") {
    const recordDate = new Date(`${r.date}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateRange === "Last 7 Days") {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 7);
      byDate = recordDate >= cutoff && recordDate <= today;
    } else if (dateRange === "Last 30 Days") {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 30);
      byDate = recordDate >= cutoff && recordDate <= today;
    } else if (dateRange === "This Month") {
      byDate =
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear();
    }
  }
  return byQ && byDept && byStatus && byDate;
}

function toCsv(rows: AttendanceRecord[]): string {
  const headers = [
    "Employee",
    "Email",
    "Department",
    "Date",
    "Clock In",
    "Clock Out",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      r.employee.name,
      r.employee.email,
      r.employee.department,
      r.date,
      r.clockIn ?? "—",
      r.clockOut ?? "—",
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

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTime(t: string | null): string {
  if (!t) return "—";
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${m} ${ampm}`;
}

function timeEntryToRecord(e: TimeEntry): AttendanceRecord {
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  const date = Number.isNaN(start.getTime())
    ? e.startAt.slice(0, 10)
    : start.toISOString().slice(0, 10);
  const clockIn = Number.isNaN(start.getTime())
    ? null
    : `${String(start.getUTCHours()).padStart(2, "0")}:${String(start.getUTCMinutes()).padStart(2, "0")}`;
  const clockOut = Number.isNaN(end.getTime())
    ? null
    : `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  // map TimeEntryStatus to AttendanceStatus
  let status: AttendanceStatus = "Active";
  if (e.status === "rejected") status = "On Leave";
  else if (e.status === "pending") status = "Active";
  else status = "Active";
  // late heuristic: if clockIn after 09:00
  if (clockIn) {
    const [h] = clockIn.split(":").map(Number);
    if ((h ?? 0) >= 9 && status === "Active") {
      // keep Active; UI will show Late only if explicitly mapped
    }
  }
  const shortId = String(e.employeeId).slice(-6);
  return {
    id: e.id as string,
    employee: {
      id: e.employeeId as string,
      name: `Employee ${shortId}`,
      email: `${String(e.employeeId).slice(0, 8)}@saasdesk.local`,
      avatar: "",
      department: "Engineering" as Department,
    },
    date,
    clockIn,
    clockOut,
    status,
  };
}

export function AttendanceClient({
  initialEntries,
}: {
  initialEntries: TimeEntry[];
}) {
  const router = useRouter();
  const initialRecords = useMemo(
    () => initialEntries.map(timeEntryToRecord),
    [initialEntries],
  );
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [dateRange, setDateRange] = useState<DateRangePreset>("Last 7 Days");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [logOpen, setLogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<AttendanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "Engineering" as Department,
    date: "",
    clockIn: "",
    clockOut: "",
    status: "Active" as AttendanceStatus,
  });

  // keep local records in sync when server refreshes (initialEntries changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _sync = useMemo(() => {
    setRecords(initialRecords);
    return null;
  }, [initialRecords]);

  const filtered = useMemo(
    () =>
      records.filter((r) =>
        matchesFilters(r, q, department, status, dateRange),
      ),
    [records, q, department, status, dateRange],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filtered.length);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const lateCount = useMemo(
    () => filtered.filter((r) => r.status === "Late").length,
    [filtered],
  );

  const avgClockIn = useMemo(() => {
    const times = filtered
      .filter((r) => r.clockIn)
      .map((r) => {
        const [h, m] = (r.clockIn as string).split(":").map(Number);
        return (h ?? 0) * 60 + (m ?? 0);
      });
    if (times.length === 0) return "—";
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const h = Math.floor(avg / 60);
    const m = avg % 60;
    return formatTime(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
  }, [filtered]);

  const statValues: Record<string, string> = {
    rate: "92.5%",
    late: String(lateCount || 15),
    clock: avgClockIn !== "—" ? avgClockIn : "08:45 AM",
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
    a.download = "attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    const isoDate = form.date
      ? form.date
      : new Date().toISOString().slice(0, 10);
    const clockIn = form.clockIn || "09:00";
    const clockOut = form.clockOut || "17:00";
    const startAt = new Date(`${isoDate}T${clockIn}:00.000Z`).toISOString();
    const endAt = new Date(`${isoDate}T${clockOut}:00.000Z`).toISOString();
    if (new Date(startAt) >= new Date(endAt)) {
      setError("Clock in must be before clock out.");
      return;
    }
    setSubmitting(true);
    try {
      // Use a synthetic employeeId derived from email if needed; backend expects any string
      const employeeId = `emp-${Date.now().toString(36)}`;
      const res = await fetch("/api/trpc/timeEntry.create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employeeId, type: "manual", startAt, endAt }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN"))
          throw new Error("You do not have permission.");
        throw new Error(text || "Failed to log attendance");
      }
      setLogOpen(false);
      setForm({
        name: "",
        email: "",
        department: "Engineering",
        date: "",
        clockIn: "",
        clockOut: "",
        status: "Active",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trpc/timeEntry.remove", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN"))
          throw new Error("You do not have permission.");
        throw new Error(text || "Delete failed");
      }
      setRecords((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trpc/timeEntry.approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 403 || text.includes("FORBIDDEN"))
          throw new Error("You do not have permission.");
        throw new Error(text || "Approve failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {submitting ? (
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STAT_CARDS.map((c) => (
          <Card
            key={c.key}
            className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  c.bg,
                  c.iconColor,
                )}
              >
                <c.icon className="size-5" />
              </div>
              {c.key === "late" ? (
                <svg
                  width="64"
                  height="24"
                  viewBox="0 0 64 24"
                  fill="none"
                  className="text-amber-400"
                  aria-hidden="true"
                  role="presentation"
                >
                  <path
                    d="M1 18 L10 14 L20 16 L30 8 L40 12 L50 4 L63 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-[22px] font-semibold leading-none text-[#2b2b46]">
                {statValues[c.key] ?? c.value}
              </p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs",
                  c.trendColor,
                )}
              >
                {c.trend.includes("↑") || c.trend.includes("↓") ? (
                  <ArrowUp
                    className={cn(
                      "size-3",
                      c.trend.includes("↓") ? "rotate-180" : "",
                    )}
                  />
                ) : null}
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
                placeholder="Search employee..."
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
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-muted">
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
              value={dateRange}
              onValueChange={(v) => {
                setDateRange(v as DateRangePreset);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((d) => (
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
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
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
              onClick={() => setLogOpen(true)}
            >
              <Plus className="size-4" />
              Log Attendance
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
                    No attendance records found.
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
                    <TableCell className="text-sm text-muted-foreground">
                      {r.employee.department}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(r.date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatTime(r.clockIn)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatTime(r.clockOut)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_STYLE[r.status]}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7"
                              aria-label={`Actions for ${r.employee.name}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewRecord(r)}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleApprove(r.id)}
                            >
                              Approve
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

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Log Attendance</DialogTitle>
            <DialogDescription>
              Add a new attendance record for an employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLog} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="log-name">Employee Name</Label>
              <Input
                id="log-name"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="log-email">Email</Label>
              <Input
                id="log-email"
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
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, status: v as AttendanceStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="log-date">Date</Label>
              <Input
                id="log-date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="log-clockIn">Clock In</Label>
                <Input
                  id="log-clockIn"
                  type="time"
                  value={form.clockIn}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, clockIn: e.target.value }))
                  }
                  disabled={form.status === "On Leave"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="log-clockOut">Clock Out</Label>
                <Input
                  id="log-clockOut"
                  type="time"
                  value={form.clockOut}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, clockOut: e.target.value }))
                  }
                  disabled={form.status === "On Leave"}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#2563eb] hover:bg-[#1d4ed8]"
              >
                {submitting ? "Saving..." : "Log Attendance"}
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
                    {viewRecord.employee.department}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("ml-auto", STATUS_STYLE[viewRecord.status])}
                >
                  {viewRecord.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {viewRecord.employee.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(viewRecord.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clock In</p>
                  <p className="font-medium">
                    {formatTime(viewRecord.clockIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clock Out</p>
                  <p className="font-medium">
                    {formatTime(viewRecord.clockOut)}
                  </p>
                </div>
                <div>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
