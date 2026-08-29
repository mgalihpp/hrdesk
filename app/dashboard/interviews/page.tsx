import { headers } from "next/headers";
import { InterviewsClient } from "@/components/dashboard/interviews/interviews-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { candidateRepo } from "@/server/repo/candidate";
import { interviewRepo } from "@/server/repo/interview";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

export default async function InterviewsPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return <InterviewsClient initialInterviews={[]} />;
  }
  const tenantId = session.user.tenantId as TenantId;
  const [interviews, candidates] = await Promise.all([
    interviewRepo(prisma, tenantId).list(),
    candidateRepo(prisma, tenantId).list(),
  ]);
  const candidateMap = new Map(
    candidates.map((c) => [c.id as string, `${c.firstName} ${c.lastName}`]),
  );

  const initialInterviews = interviews.map((r) => {
    const candidateName =
      r.candidateName || candidateMap.get(r.candidateId) || "Unknown";
    return {
      id: r.id as string,
      candidateName,
      initials: getInitials(candidateName),
      position: r.position,
      time: r.time,
      interviewType: r.interviewType as
        | "HR Interview"
        | "Tech Interview"
        | "Final Round",
      interviewer: r.interviewer,
      status: r.status as
        | "feedback_needed"
        | "completed"
        | "in_progress"
        | "scheduled",
      source: r.source ?? "",
      recruiter: r.recruiter ?? "",
    };
  });

  const initialCandidates = candidates.map((c) => ({
    id: c.id as string,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
  }));

  return (
    <InterviewsClient
      initialInterviews={initialInterviews as never}
      initialCandidates={initialCandidates as never}
    />
  );
}
