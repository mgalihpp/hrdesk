import type { EmployeeId, TenantId } from "@/lib/types";

export type JobId = string & { readonly __brand: "JobId" };
export type CandidateId = string & { readonly __brand: "CandidateId" };

export const JOB_STATUS = ["open", "closed", "archived"] as const;
export type JobStatus = (typeof JOB_STATUS)[number];

export const CANDIDATE_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const CANDIDATE_TRANSITIONS: Record<CandidateStage, CandidateStage[]> = {
  applied: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

export interface Job {
  id: JobId;
  tenantId: TenantId;
  title: string;
  department: string | null;
  description: string | null;
  status: JobStatus;
  createdAt: string;
}

export interface Candidate {
  id: CandidateId;
  tenantId: TenantId;
  jobId: JobId;
  firstName: string;
  lastName: string;
  email: string; // decrypted view
  phone: string | null; // decrypted view
  stage: CandidateStage;
  hiredEmployeeId: EmployeeId | null;
  createdAt: string;
}
export interface CandidateView extends Candidate {}

export interface NewJob {
  title: string;
  department?: string | null;
  description?: string | null;
}

export interface NewCandidate {
  jobId: JobId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}
