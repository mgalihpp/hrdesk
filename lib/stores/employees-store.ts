"use client";

import { create } from "zustand";
import type {
  EmployeeDisplay,
  EmployeeStatusLabel,
} from "@/lib/employees/types";
import type { Department, EmploymentType } from "@/lib/types";

type EmployeesState = {
  employees: EmployeeDisplay[];
  q: string;
  department: string;
  status: string;
  employmentType: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  addOpen: boolean;
  viewEmployee: EmployeeDisplay | null;
  isEditing: boolean;
  form: {
    name: string;
    email: string;
    department: Department;
    position: string;
    status: EmployeeStatusLabel;
    employmentType: EmploymentType;
    joinedDate: string;
    compensation: string;
  };
  editForm: {
    department: Department;
    position: string;
    status: EmployeeStatusLabel;
    employmentType: EmploymentType;
  };
  error: string | null;
  setQ: (v: string) => void;
  setDepartment: (v: string) => void;
  setStatus: (v: string) => void;
  setEmploymentType: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setAddOpen: (v: boolean) => void;
  setViewEmployee: (v: EmployeeDisplay | null) => void;
  setIsEditing: (v: boolean) => void;
  setForm: (patch: Partial<EmployeesState["form"]>) => void;
  setEditForm: (patch: Partial<EmployeesState["editForm"]>) => void;
  resetForm: () => void;
  setError: (v: string | null) => void;
  hydrate: (rows: EmployeeDisplay[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialForm: EmployeesState["form"] = {
  name: "",
  email: "",
  department: "Engineering",
  position: "",
  status: "Active",
  employmentType: "Full Time",
  joinedDate: "",
  compensation: "",
};

const initialEditForm: EmployeesState["editForm"] = {
  department: "Engineering",
  position: "",
  status: "Active",
  employmentType: "Full Time",
};

export const useEmployeesStore = create<EmployeesState>((set) => ({
  employees: [],
  q: "",
  department: "all",
  status: "all",
  employmentType: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  addOpen: false,
  viewEmployee: null,
  isEditing: false,
  form: initialForm,
  editForm: initialEditForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setDepartment: (department) => set({ department, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setEmploymentType: (employmentType) => set({ employmentType, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setAddOpen: (addOpen) => set({ addOpen }),
  setViewEmployee: (viewEmployee) => set({ viewEmployee }),
  setIsEditing: (isEditing) => set({ isEditing }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  setEditForm: (patch) =>
    set((s) => ({ editForm: { ...s.editForm, ...patch } })),
  resetForm: () => set({ form: initialForm }),
  setError: (error) => set({ error }),
  hydrate: (employees) => set({ employees }),
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
