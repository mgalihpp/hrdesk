"use client";

import { create } from "zustand";
import type { InterviewStatus } from "@/lib/interviews/types";

export type InterviewRecord = {
  id: string;
  candidateName: string;
  initials: string;
  position: string;
  time: string;
  interviewType: "HR Interview" | "Tech Interview" | "Final Round";
  interviewer: string;
  status: InterviewStatus;
  source: string;
  recruiter: string;
};

type InterviewsState = {
  interviews: InterviewRecord[];
  jobFilter: string;
  sourceFilter: string;
  recruiterFilter: string;
  selected: InterviewRecord | null;
  selectedIds: Set<string>;
  open: boolean;
  draftStatus: InterviewStatus;
  error: string | null;
  setJobFilter: (v: string) => void;
  setSourceFilter: (v: string) => void;
  setRecruiterFilter: (v: string) => void;
  setOpen: (v: boolean) => void;
  setDraftStatus: (v: InterviewStatus) => void;
  setSelected: (v: InterviewRecord | null) => void;
  hydrate: (rows: InterviewRecord[]) => void;
  toggleRow: (id: string, checked: boolean) => void;
  toggleAll: (ids: string[], checked: boolean) => void;
  handleRowClick: (record: InterviewRecord) => void;
  setError: (v: string | null) => void;
};

export const useInterviewsStore = create<InterviewsState>((set) => ({
  interviews: [],
  jobFilter: "all",
  sourceFilter: "all",
  recruiterFilter: "all",
  selected: null,
  selectedIds: new Set<string>(),
  open: false,
  draftStatus: "scheduled",
  error: null,
  setJobFilter: (jobFilter) => set({ jobFilter }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),
  setRecruiterFilter: (recruiterFilter) => set({ recruiterFilter }),
  setOpen: (open) => set({ open }),
  setDraftStatus: (draftStatus) => set({ draftStatus }),
  setSelected: (selected) => set({ selected }),
  hydrate: (interviews) => set({ interviews }),
  toggleRow: (id, checked) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      return { selectedIds: next };
    }),
  toggleAll: (ids, checked) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return { selectedIds: next };
    }),
  handleRowClick: (record) =>
    set({ selected: record, draftStatus: record.status, open: true }),
  setError: (error) => set({ error }),
}));
