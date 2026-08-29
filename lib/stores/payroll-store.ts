"use client";

import { create } from "zustand";
import type {
  EmploymentType,
  PayrollRecord,
  PayrollStatus,
} from "@/components/dashboard/payroll/payroll-client";

type PayrollForm = {
  name: string;
  email: string;
  employmentType: EmploymentType;
  period: string;
  baseSalary: string;
  allowances: string;
  deductions: string;
  status: PayrollStatus;
};

type PayrollState = {
  records: PayrollRecord[];
  q: string;
  typeFilter: string;
  monthFilter: string;
  statusFilter: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  runOpen: boolean;
  editRecord: PayrollRecord | null;
  runForm: PayrollForm;
  editForm: PayrollForm;
  error: string | null;
  setQ: (v: string) => void;
  setTypeFilter: (v: string) => void;
  setMonthFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setRunOpen: (v: boolean) => void;
  setEditRecord: (v: PayrollRecord | null) => void;
  setRunForm: (patch: Partial<PayrollForm>) => void;
  setEditForm: (patch: Partial<PayrollForm>) => void;
  setError: (v: string | null) => void;
  resetRunForm: () => void;
  resetEditForm: () => void;
  hydrate: (rows: PayrollRecord[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialRunForm: PayrollForm = {
  name: "",
  email: "",
  employmentType: "Salaried",
  period: "Oct 2026",
  baseSalary: "6500",
  allowances: "800",
  deductions: "1400",
  status: "Paid",
};

const initialEditForm: PayrollForm = {
  name: "",
  email: "",
  employmentType: "Salaried",
  period: "Oct 2026",
  baseSalary: "6500",
  allowances: "800",
  deductions: "1400",
  status: "Paid",
};

export const usePayrollStore = create<PayrollState>((set) => ({
  records: [],
  q: "",
  typeFilter: "all",
  monthFilter: "all",
  statusFilter: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  runOpen: false,
  editRecord: null,
  runForm: initialRunForm,
  editForm: initialEditForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setTypeFilter: (typeFilter) => set({ typeFilter, page: 1 }),
  setMonthFilter: (monthFilter) => set({ monthFilter, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setRunOpen: (runOpen) => set({ runOpen }),
  setEditRecord: (editRecord) => {
    if (editRecord) {
      set({
        editRecord,
        editForm: {
          name: editRecord.employee.name,
          email: editRecord.employee.email,
          employmentType: editRecord.employmentType,
          period: editRecord.period,
          baseSalary: String(editRecord.baseSalary),
          allowances: String(editRecord.allowances),
          deductions: String(editRecord.deductions),
          status: editRecord.status,
        },
      });
    } else {
      set({ editRecord: null });
    }
  },
  setRunForm: (patch) => set((s) => ({ runForm: { ...s.runForm, ...patch } })),
  setEditForm: (patch) =>
    set((s) => ({ editForm: { ...s.editForm, ...patch } })),
  setError: (error) => set({ error }),
  resetRunForm: () => set({ runForm: initialRunForm }),
  resetEditForm: () => set({ editForm: initialEditForm }),
  hydrate: (records) => set({ records }),
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
