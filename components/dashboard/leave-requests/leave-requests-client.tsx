"use client";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Palmtree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

type LeaveTypeKey = "vacation" | "sick" | "personal" | "other";
type LeaveStatusKey = "pending" | "approved" | "rejected" | "cancelled";

interface RawRow {
  id: string;
  employee: { name: string; email: string; avatar?: string };
  type: LeaveTypeKey;
  start: string;
  end: string;
  status: LeaveStatusKey;
}

interface LeaveRequestDisplay {
  id: string;
  employee: { name: string; email: string; avatar?: string };
  type: LeaveTypeKey;
  typeLabel: string;
  startDate: string;
  endDate: string;
  startLabel: string;
  endLabel: string;
  durationDays: number;
  durationLabel: string;
  status: LeaveStatusKey;
}

const TYPE_LABEL: Record<LeaveTypeKey, string> = {
  vacation: "Vacation",
  sick: "Sick Leave",
  personal: "Personal Leave",
  other: "Other",
};

const STATUS_STYLE: Record<LeaveStatusKey, string> = {
  pending: "bg-[#fff3d6] text-[#b48900] border-[#fde4a6]",
  approved: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]",
  rejected: "bg-[#fee2e2] text-[#be123c] border-[#fecaca]",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Type: All" },
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Status: All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Date: All" },
  { value: "custom", label: "Custom" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
];

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcDuration(startIso: string, endIso: string): number {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const diff =
    Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

const avatarBg = (name: string) => {
  const palette = [
    "#e8eaf6",
    "#fce4ec",
    "#e0f2f1",
    "#fff3e0",
    "#ede7f6",
    "#f3e5f5",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

function buildMock(): LeaveRequestDisplay[] {
  const raw: RawRow[] = [
    {
      id: "1",
      employee: { name: "Sarah Wijaya", email: "sarah.w@saasdesk.com" },
      type: "vacation",
      start: "2026-10-12",
      end: "2026-10-16",
      status: "pending",
    },
    {
      id: "2",
      employee: { name: "Andi Pratama", email: "andi.p@saasdesk.com" },
      type: "sick",
      start: "2026-10-14",
      end: "2026-10-14",
      status: "approved",
    },
    {
      id: "3",
      employee: { name: "Dewi Lestari", email: "dewi.lestari@saasdesk.com" },
      type: "personal",
      start: "2026-10-15",
      end: "2026-10-19",
      status: "rejected",
    },
    {
      id: "4",
      employee: { name: "Budi Santoso", email: "budi.s@saasdesk.com" },
      type: "vacation",
      start: "2026-10-20",
      end: "2026-10-22",
      status: "pending",
    },
    {
      id: "5",
      employee: { name: "Rina Marlina", email: "rina.m@saasdesk.com" },
      type: "sick",
      start: "2026-10-18",
      end: "2026-10-18",
      status: "pending",
    },
    {
      id: "6",
      employee: { name: "Agus Wijaya", email: "agus.w@saasdesk.com" },
      type: "vacation",
      start: "2026-10-25",
      end: "2026-10-30",
      status: "approved",
    },
    {
      id: "7",
      employee: { name: "Siti Nurhaliza", email: "siti.n@saasdesk.com" },
      type: "personal",
      start: "2026-11-01",
      end: "2026-11-02",
      status: "approved",
    },
    {
      id: "8",
      employee: { name: "Joko Widodo", email: "joko.w@saasdesk.com" },
      type: "other",
      start: "2026-10-10",
      end: "2026-10-10",
      status: "approved",
    },
    {
      id: "9",
      employee: { name: "Maya Sari", email: "maya.s@saasdesk.com" },
      type: "vacation",
      start: "2026-11-05",
      end: "2026-11-09",
      status: "pending",
    },
    {
      id: "10",
      employee: { name: "Eko Prasetyo", email: "eko.p@saasdesk.com" },
      type: "sick",
      start: "2026-10-05",
      end: "2026-10-06",
      status: "rejected",
    },
    {
      id: "11",
      employee: { name: "Lina Hartono", email: "lina.h@saasdesk.com" },
      type: "personal",
      start: "2026-10-28",
      end: "2026-10-28",
      status: "pending",
    },
    {
      id: "12",
      employee: { name: "Fajar Nugroho", email: "fajar.n@saasdesk.com" },
      type: "vacation",
      start: "2026-11-12",
      end: "2026-11-15",
      status: "approved",
    },
  ];
  return raw.map((r) => {
    const d = calcDuration(r.start, r.end);
    return {
      id: r.id,
      employee: r.employee,
      type: r.type,
      typeLabel: TYPE_LABEL[r.type],
      startDate: r.start,
      endDate: r.end,
      startLabel: formatDateLabel(r.start),
      endLabel: formatDateLabel(r.end),
      durationDays: d,
      durationLabel: `${d} Day${d > 1 ? "s" : ""}`,
      status: r.status,
    };
  });
}

export function LeaveRequestsClient() {
  const [requests, setRequests] = useState<LeaveRequestDisplay[]>(() =>
    buildMock(),
  );
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newOpen, setNewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<LeaveRequestDisplay | null>(null);
  const [editRow, setEditRow] = useState<LeaveRequestDisplay | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<LeaveRequestDisplay | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "vacation" as LeaveTypeKey,
    start: "",
    end: "",
    reason: "",
  });

  const [editForm, setEditForm] = useState({
    type: "vacation" as LeaveTypeKey,
    start: "",
    end: "",
    status: "pending" as LeaveStatusKey,
  });

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (q) {
        const needle = q.toLowerCase();
        if (
          !r.employee.name.toLowerCase().includes(needle) &&
          !r.employee.email.toLowerCase().includes(needle) &&
          !r.typeLabel.toLowerCase().includes(needle)
        )
          return false;
      }
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFilter === "last7") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        if (new Date(r.startDate) < cutoff) return false;
      }
      if (dateFilter === "last30") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        if (new Date(r.startDate) < cutoff) return false;
      }
      return true;
    });
  }, [requests, q, typeFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const stats = useMemo(() => {
    const total = requests.length + 106;
    const pending = requests.filter((r) => r.status === "pending").length + 19;
    const approved =
      requests.filter((r) => r.status === "approved").length + 89;
    return { total, pending, approved };
  }, [requests]);

  const allSelected =
    paged.length > 0 && paged.every((r) => selected.has(r.id));

  function toggleAll(checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      for (const r of paged) next.add(r.id);
    } else {
      for (const r of paged) next.delete(r.id);
    }
    setSelected(next);
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  }

  function handleCreate() {
    if (!form.name || !form.email || !form.start || !form.end) return;
    const d = calcDuration(form.start, form.end);
    const row: LeaveRequestDisplay = {
      id: String(Date.now()),
      employee: { name: form.name, email: form.email },
      type: form.type,
      typeLabel: TYPE_LABEL[form.type],
      startDate: form.start,
      endDate: form.end,
      startLabel: formatDateLabel(form.start),
      endLabel: formatDateLabel(form.end),
      durationDays: d,
      durationLabel: `${d} Day${d > 1 ? "s" : ""}`,
      status: "pending",
    };
    setRequests((prev) => [row, ...prev]);
    setNewOpen(false);
    setForm({
      name: "",
      email: "",
      type: "vacation",
      start: "",
      end: "",
      reason: "",
    });
    setPage(1);
  }

  function openEdit(row: LeaveRequestDisplay) {
    setEditRow(row);
    setEditForm({
      type: row.type,
      start: row.startDate,
      end: row.endDate,
      status: row.status,
    });
  }

  function handleEditSave() {
    if (!editRow) return;
    const d = calcDuration(editForm.start, editForm.end);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === editRow.id
          ? {
              ...r,
              type: editForm.type,
              typeLabel: TYPE_LABEL[editForm.type],
              startDate: editForm.start,
              endDate: editForm.end,
              startLabel: formatDateLabel(editForm.start),
              endLabel: formatDateLabel(editForm.end),
              durationDays: d,
              durationLabel: `${d} Day${d > 1 ? "s" : ""}`,
              status: editForm.status,
            }
          : r,
      ),
    );
    setEditRow(null);
  }

  function handleDelete(row: LeaveRequestDisplay) {
    setRequests((prev) => prev.filter((r) => r.id !== row.id));
    setConfirmDelete(null);
    const next = new Set(selected);
    next.delete(row.id);
    setSelected(next);
  }

  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[16px] border bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total Requests
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[#1a1a2e]">
              {stats.total}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-emerald-600">↗ 5 this month</span>
            </p>
          </div>
        </div>
        <div className="rounded-[16px] border bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3e0] text-[#ef6c00]">
            <Palmtree className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Review
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[#1a1a2e]">
              {stats.pending}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-orange-500">↘ 2 this month</span>
            </p>
          </div>
        </div>
        <div className="rounded-[16px] border bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e0f7f4] text-[#009688]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Approved Leaves
            </p>
            <p className="text-2xl font-semibold tracking-tight text-[#1a1a2e]">
              {stats.approved}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-emerald-600">↗ 8 this month</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b bg-white">
          <div className="relative flex-1 min-w-[200px] max-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-full bg-[#f8f9fb] pl-9 text-sm border-[#eef0f4]"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px] rounded-full bg-[#f8f9fb] border-[#eef0f4] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(v) => {
              setDateFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[210px] rounded-full bg-[#f8f9fb] border-[#eef0f4] text-sm">
              <SelectValue placeholder="Date: Custom/Last 7 Days/etc." />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[200px] rounded-full bg-[#f8f9fb] border-[#eef0f4] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setNewOpen(true)}
            className="ml-auto h-9 rounded-full bg-[#1e3a5f] px-5 text-white hover:bg-[#162a44]"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#fcfcfd] text-left text-[11px] font-semibold tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                  />
                </th>
                <th className="px-3 py-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Request Type</th>
                <th className="px-3 py-3 font-semibold">Start Date</th>
                <th className="px-3 py-3 font-semibold">End Date</th>
                <th className="px-3 py-3 font-semibold">Duration</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-sm text-muted-foreground"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-[#f8f9fb]"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(v) => toggleOne(r.id, Boolean(v))}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={r.employee.avatar}
                            alt={r.employee.name}
                          />
                          <AvatarFallback
                            style={{
                              backgroundColor: avatarBg(r.employee.name),
                            }}
                            className="text-xs font-medium text-[#2b2b46]"
                          >
                            {getInitials(r.employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="text-sm font-medium text-[#1a1a2e]">
                            {r.employee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#2b2b46]">{r.typeLabel}</td>
                    <td className="px-3 py-3 text-[#2b2b46] whitespace-nowrap">
                      {r.startLabel}
                    </td>
                    <td className="px-3 py-3 text-[#2b2b46] whitespace-nowrap">
                      {r.endLabel}
                    </td>
                    <td className="px-3 py-3 text-[#2b2b46]">
                      {r.durationLabel}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewRow(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          aria-label="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {showingFrom} to {showingTo} of {filtered.length} requests
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                if (totalPages > 7 && n > 3 && n < totalPages - 1) {
                  if (n === 4)
                    return (
                      <span key={n} className="px-1">
                        …
                      </span>
                    );
                  return null;
                }
                const active = n === safePage;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-medium ${
                      active
                        ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                        : "bg-white hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-[90px] rounded-md bg-white text-xs">
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
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
            <DialogDescription>
              Create a new leave request for review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Employee Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Sarah Wijaya"
              />
            </div>
            <div className="grid gap-2">
              <Label>Employee Email</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="sarah.w@saasdesk.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as LeaveTypeKey }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reason: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.start}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.end}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#1e3a5f] text-white hover:bg-[#162a44]"
            >
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle>Leave Request Detail</DialogTitle>
            <DialogDescription>View request information.</DialogDescription>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    style={{ backgroundColor: avatarBg(viewRow.employee.name) }}
                  >
                    {getInitials(viewRow.employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{viewRow.employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {viewRow.employee.email}
                  </p>
                </div>
                <span
                  className={`ml-auto inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[viewRow.status]}`}
                >
                  {viewRow.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{viewRow.typeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{viewRow.durationLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="font-medium">{viewRow.startLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End</p>
                  <p className="font-medium">{viewRow.endLabel}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
            <DialogDescription>Update request details.</DialogDescription>
          </DialogHeader>
          {editRow && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Employee</Label>
                <Input value={editRow.employee.name} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={editForm.type}
                    onValueChange={(v) =>
                      setEditForm((p) => ({ ...p, type: v as LeaveTypeKey }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) =>
                      setEditForm((p) => ({
                        ...p,
                        status: v as LeaveStatusKey,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editForm.start}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, start: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={editForm.end}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, end: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              className="bg-[#1e3a5f] text-white hover:bg-[#162a44]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle>Delete request?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <p className="text-sm">
              Delete leave request for{" "}
              <span className="font-medium">{confirmDelete.employee.name}</span>
              ?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
