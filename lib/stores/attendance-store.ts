"use client";

import { create } from "zustand";
import type { TimeEntry, TimeEntryType } from "@/lib/types";

type AttendanceState = {
  entries: TimeEntry[];
  q: string;
  department: string;
  dateRange: string;
  status: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  addOpen: boolean;
  viewEntry: TimeEntry | null;
  form: {
    employeeId: string;
    type: TimeEntryType;
    startAt: string;
    endAt: string;
    date: string;
    clockIn: string;
    clockOut: string;
  };
  error: string | null;
  setQ: (v: string) => void;
  setDepartment: (v: string) => void;
  setDateRange: (v: string) => void;
  setStatus: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setAddOpen: (v: boolean) => void;
  setViewEntry: (v: TimeEntry | null) => void;
  setForm: (patch: Partial<AttendanceState["form"]>) => void;
  resetForm: () => void;
  setError: (v: string | null) => void;
  hydrate: (rows: TimeEntry[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialForm: AttendanceState["form"] = {
  employeeId: "",
  type: "manual",
  startAt: "",
  endAt: "",
  date: "",
  clockIn: "",
  clockOut: "",
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  entries: [],
  q: "",
  department: "all",
  dateRange: "Last 7 Days",
  status: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  addOpen: false,
  viewEntry: null,
  form: initialForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setDepartment: (department) => set({ department, page: 1 }),
  setDateRange: (dateRange) => set({ dateRange, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setAddOpen: (addOpen) => set({ addOpen }),
  setViewEntry: (viewEntry) => set({ viewEntry }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  resetForm: () => set({ form: initialForm }),
  setError: (error) => set({ error }),
  hydrate: (entries) => set({ entries }),
  toggleRow: (id, checked) =>
    set((s) => {
      const next = new Set(s.selected);
      if (checked) next.add(id);
      else next.delete(id);
      return { selected: next };
    }),
  toggleAll: (ids, checked) =>
    set((s) => {
      const next = new Set(s.selected);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return { selected: next };
    }),
}));
