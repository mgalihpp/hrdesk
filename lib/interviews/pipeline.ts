import {
  INTERVIEW_STATUSES,
  INTERVIEW_TRANSITIONS,
  type InterviewStatus,
} from "@/lib/interviews/types";

export { INTERVIEW_STATUSES, INTERVIEW_TRANSITIONS };
export type { InterviewStatus };

export function isValidStatus(v: string): v is InterviewStatus {
  return (INTERVIEW_STATUSES as readonly string[]).includes(v);
}

export function canTransition(
  from: InterviewStatus,
  to: InterviewStatus,
): boolean {
  return INTERVIEW_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: InterviewStatus): InterviewStatus[] {
  return INTERVIEW_TRANSITIONS[from];
}
