import {
  CANDIDATE_STAGES,
  CANDIDATE_TRANSITIONS,
  type CandidateStage,
} from "@/lib/recruitment/types";

export { CANDIDATE_STAGES, CANDIDATE_TRANSITIONS };
export type { CandidateStage };

export function isValidStage(v: string): v is CandidateStage {
  return (CANDIDATE_STAGES as readonly string[]).includes(v);
}

export function canTransition(
  from: CandidateStage,
  to: CandidateStage,
): boolean {
  return CANDIDATE_TRANSITIONS[from].includes(to);
}

export function nextStages(from: CandidateStage): CandidateStage[] {
  return CANDIDATE_TRANSITIONS[from];
}
