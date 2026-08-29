"use client";

import { create } from "zustand";
import type { CandidateView, Job } from "@/lib/recruitment/types";

type CandidatesState = {
  candidates: CandidateView[];
  jobs: Job[];
  jobFilter: string;
  candidateFilter: string;
  sourceFilter: string;
  recruiterFilter: string;
  page: number;
  pageSize: number;
  selected: Set<string>;
  addOpen: boolean;
  selectedCandidate: CandidateView | null;
  form: {
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  error: string | null;
  setJobFilter: (v: string) => void;
  setCandidateFilter: (v: string) => void;
  setSourceFilter: (v: string) => void;
  setRecruiterFilter: (v: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  setAddOpen: (v: boolean) => void;
  setSelectedCandidate: (v: CandidateView | null) => void;
  setForm: (patch: Partial<CandidatesState["form"]>) => void;
  resetForm: () => void;
  setError: (v: string | null) => void;
  hydrateCandidates: (rows: CandidateView[]) => void;
  hydrateJobs: (rows: Job[]) => void;
  hydrate: (rows: CandidateView[], jobs: Job[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
};

const initialForm: CandidatesState["form"] = {
  jobId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export const useCandidatesStore = create<CandidatesState>((set) => ({
  candidates: [],
  jobs: [],
  jobFilter: "all",
  candidateFilter: "all",
  sourceFilter: "all",
  recruiterFilter: "all",
  page: 1,
  pageSize: 10,
  selected: new Set<string>(),
  addOpen: false,
  selectedCandidate: null,
  form: initialForm,
  error: null,
  setJobFilter: (jobFilter) => set({ jobFilter }),
  setCandidateFilter: (candidateFilter) => set({ candidateFilter }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),
  setRecruiterFilter: (recruiterFilter) => set({ recruiterFilter }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setAddOpen: (addOpen) => set({ addOpen }),
  setSelectedCandidate: (selectedCandidate) => set({ selectedCandidate }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  resetForm: () => set({ form: initialForm }),
  setError: (error) => set({ error }),
  hydrateCandidates: (candidates) => set({ candidates }),
  hydrateJobs: (jobs) =>
    set((s) => ({
      jobs,
      form: s.form.jobId
        ? s.form
        : { ...s.form, jobId: (jobs[0]?.id as unknown as string) ?? "" },
    })),
  hydrate: (candidates, jobs) =>
    set((s) => ({
      candidates,
      jobs,
      form: s.form.jobId
        ? s.form
        : { ...s.form, jobId: (jobs[0]?.id as unknown as string) ?? "" },
    })),
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
