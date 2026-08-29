"use client";

import { create } from "zustand";
import type {
  DepartmentDisplay,
  DepartmentIconKey,
  DepartmentLocation,
  DepartmentStatus,
} from "@/lib/departments/types";

type DepartmentsState = {
  departments: DepartmentDisplay[];
  q: string;
  statusFilter: string;
  locationFilter: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  addOpen: boolean;
  viewDept: DepartmentDisplay | null;
  editDept: DepartmentDisplay | null;
  deleteTarget: DepartmentDisplay | null;
  form: {
    name: string;
    iconKey: DepartmentIconKey;
    headName: string;
    headEmail: string;
    location: DepartmentLocation;
    activeEmployees: number;
    budgetUtil: number;
    status: DepartmentStatus;
  };
  error: string | null;
  setQ: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setLocationFilter: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setAddOpen: (v: boolean) => void;
  setViewDept: (v: DepartmentDisplay | null) => void;
  setEditDept: (v: DepartmentDisplay | null) => void;
  setDeleteTarget: (v: DepartmentDisplay | null) => void;
  setForm: (patch: Partial<DepartmentsState["form"]>) => void;
  resetForm: () => void;
  hydrate: (rows: DepartmentDisplay[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
  setError: (v: string | null) => void;
};

const initialForm: DepartmentsState["form"] = {
  name: "",
  iconKey: "engineering",
  headName: "",
  headEmail: "",
  location: "HQ",
  activeEmployees: 1,
  budgetUtil: 50,
  status: "Active",
};

export const useDepartmentsStore = create<DepartmentsState>((set) => ({
  departments: [],
  q: "",
  statusFilter: "all",
  locationFilter: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  addOpen: false,
  viewDept: null,
  editDept: null,
  deleteTarget: null,
  form: initialForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setLocationFilter: (locationFilter) => set({ locationFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setAddOpen: (addOpen) => set({ addOpen }),
  setViewDept: (viewDept) => set({ viewDept }),
  setEditDept: (editDept) => set({ editDept }),
  setDeleteTarget: (deleteTarget) => set({ deleteTarget }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  resetForm: () => set({ form: initialForm }),
  hydrate: (departments) => set({ departments }),
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
  setError: (error) => set({ error }),
}));
