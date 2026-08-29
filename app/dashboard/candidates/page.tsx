import { headers } from "next/headers";
import { CandidatesClient } from "@/components/dashboard/candidates/candidates-client";
import { prisma } from "@/lib/prisma";
import { getShellSession } from "@/lib/shell-session";
import type { TenantId } from "@/lib/types";
import { candidateRepo } from "@/server/repo/candidate";
import { jobRepo } from "@/server/repo/job";

export default async function CandidatesPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return <CandidatesClient initialCandidates={[]} initialJobs={[]} />;
  }
  const tenantId = session.user.tenantId as TenantId;
  const [candidates, jobs] = await Promise.all([
    candidateRepo(prisma, tenantId).list(),
    jobRepo(prisma, tenantId).list(),
  ]);
  return <CandidatesClient initialCandidates={candidates} initialJobs={jobs} />;
}
