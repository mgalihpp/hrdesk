"use client";

import { create } from "zustand";
import type { Leave } from "@/lib/types";

type LeaveForm = {
  employeeId: string;
  type: "vacation" | "sick" | "unpaid" | "other";
  startDate: string;
  endDate: string;
  reason: string;
};

type LeaveState = {
  leaves: Leave[];
  q: string;
  typeFilter: string;
  statusFilter: string;
  dateFilter: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  addOpen: boolean;
  viewLeave: Leave | null;
  form: LeaveForm;
  error: string | null;
  setQ: (v: string) => void;
  setTypeFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setDateFilter: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setAddOpen: (v: boolean) => void;
  setViewLeave: (v: Leave | null) => void;
  setForm: (patch: Partial<LeaveForm>) => void;
  resetForm: () => void;
  setError: (v: string | null) => void;
  hydrate: (rows: Leave[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialForm: LeaveForm = {
  employeeId: "",
  type: "vacation",
  startDate: "",
  endDate: "",
  reason: "",
};

export const useLeaveStore = create<LeaveState>((set) => ({
  leaves: [],
  q: "",
  typeFilter: "all",
  statusFilter: "all",
  dateFilter: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  addOpen: false,
  viewLeave: null,
  form: initialForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setTypeFilter: (typeFilter) => set({ typeFilter, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setDateFilter: (dateFilter) => set({ dateFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setAddOpen: (addOpen) => set({ addOpen }),
  setViewLeave: (viewLeave) => set({ viewLeave }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  resetForm: () => set({ form: initialForm }),
  setError: (error) => set({ error }),
  hydrate: (leaves) => set({ leaves }),
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
