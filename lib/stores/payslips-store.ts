"use client";

import { create } from "zustand";
import type {
  PayslipRecord,
  PayslipStatus,
  PayslipType,
} from "@/components/dashboard/payslips/payslips-client";

type PayslipForm = {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  netPay: string;
  status: PayslipStatus;
  type: PayslipType;
  date: string;
};

type PayslipsState = {
  records: PayslipRecord[];
  q: string;
  typeFilter: string;
  dateFilter: string;
  statusFilter: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  generateOpen: boolean;
  editRecord: PayslipRecord | null;
  form: PayslipForm;
  editForm: PayslipForm;
  error: string | null;
  setQ: (v: string) => void;
  setTypeFilter: (v: string) => void;
  setDateFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setGenerateOpen: (v: boolean) => void;
  setEditRecord: (v: PayslipRecord | null) => void;
  setForm: (patch: Partial<PayslipForm>) => void;
  setEditForm: (patch: Partial<PayslipForm>) => void;
  setError: (v: string | null) => void;
  resetForm: () => void;
  resetEditForm: () => void;
  hydrate: (rows: PayslipRecord[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialForm: PayslipForm = {
  name: "",
  email: "",
  employeeId: "",
  department: "Engineering",
  netPay: "12000",
  status: "Pending",
  type: "Monthly",
  date: "30 Sep 2026",
};

const initialEditForm: PayslipForm = {
  name: "",
  email: "",
  employeeId: "",
  department: "Engineering",
  netPay: "12000",
  status: "Pending",
  type: "Monthly",
  date: "30 Sep 2026",
};

export const usePayslipsStore = create<PayslipsState>((set) => ({
  records: [],
  q: "",
  typeFilter: "all",
  dateFilter: "all",
  statusFilter: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  generateOpen: false,
  editRecord: null,
  form: initialForm,
  editForm: initialEditForm,
  error: null,
  setQ: (q) => set({ q, page: 1 }),
  setTypeFilter: (typeFilter) => set({ typeFilter, page: 1 }),
  setDateFilter: (dateFilter) => set({ dateFilter, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setGenerateOpen: (generateOpen) => set({ generateOpen }),
  setEditRecord: (editRecord) => {
    if (editRecord) {
      set({
        editRecord,
        editForm: {
          name: editRecord.employee.name,
          email: editRecord.employee.email,
          employeeId: editRecord.employeeId,
          department: editRecord.department,
          netPay: String(editRecord.totalNetPay),
          status: editRecord.status,
          type: editRecord.type,
          date: editRecord.lastPayrunDate,
        },
      });
    } else {
      set({ editRecord: null });
    }
  },
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  setEditForm: (patch) =>
    set((s) => ({ editForm: { ...s.editForm, ...patch } })),
  setError: (error) => set({ error }),
  resetForm: () => set({ form: initialForm }),
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
