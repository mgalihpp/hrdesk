import type { InterviewId, TenantId } from "@/lib/types";

export const INTERVIEW_STATUSES = [
  "scheduled",
  "in_progress",
  "feedback_needed",
  "completed",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> =
  {
    scheduled: ["in_progress"],
    in_progress: ["feedback_needed"],
    feedback_needed: ["completed"],
    completed: [],
  };

export interface Interview {
  id: InterviewId;
  tenantId: TenantId;
  candidateId: string;
  candidateName: string;
  position: string;
  time: string;
  interviewType: string;
  interviewer: string;
  source: string | null;
  recruiter: string | null;
  status: InterviewStatus;
  feedback: string | null;
  rating: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewInterview {
  candidateId: string;
  candidateName: string;
  position: string;
  time: string;
  interviewType: string;
  interviewer: string;
  source?: string | null;
  recruiter?: string | null;
  status?: InterviewStatus;
  feedback?: string | null;
  rating?: string | null;
}
