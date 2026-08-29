import { headers } from "next/headers";
import { CandidatesClient } from "@/components/dashboard/candidates/candidates-client";
import { getShellSession } from "@/lib/shell-session";

export default async function CandidatesPage() {
  const h = await headers();
  const session = await getShellSession(h);
  if (session.kind !== "authenticated") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Candidate Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to view candidates.
          </p>
        </div>
      </div>
    );
  }
  return <CandidatesClient />;
}
