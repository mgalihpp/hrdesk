import { Briefcase, Calendar, DollarSign, Mail, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CandidateStage } from "@/lib/recruitment/types";
import type { PipelineSummary } from "@/lib/reporting/types";

export function RecruitmentOverview({
  pipeline,
}: {
  pipeline: PipelineSummary;
}) {
  const interviewStage = "interview" as CandidateStage;
  const offerStage = "offer" as CandidateStage;
  const hiredStage = "hired" as CandidateStage;
  const openPositions = pipeline.openJobs;
  const candidates = pipeline.totalCandidates;
  const interviews = pipeline.byStage[interviewStage] ?? 0;
  const offers =
    (pipeline.byStage[offerStage] ?? 0) + (pipeline.byStage[hiredStage] ?? 0);
  const isEmpty = pipeline.totalCandidates === 0 && pipeline.totalJobs === 0;
  return (
    <div className="rounded-[20px] border bg-white p-5 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
          Recruitment Overview
        </h3>
        <Link
          href="#recruitment"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {isEmpty ? (
          <p className="col-span-2 text-sm text-muted-foreground">
            No recruitment data
          </p>
        ) : (
          <>
            <div className="rounded-xl border bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2563eb]">
                  <Briefcase className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Open Positions
                  </p>
                  <p className="text-lg font-bold leading-none text-[#1e2a4a]">
                    {openPositions}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a34a]">
                  <Users className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Candidates</p>
                  <p className="text-lg font-bold leading-none text-[#1e2a4a]">
                    {candidates}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]">
                  <Calendar className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Interviews</p>
                  <p className="text-lg font-bold leading-none text-[#1e2a4a]">
                    {interviews}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#f3e8ff] text-[#9333ea]">
                  <Mail className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Offers</p>
                  <p className="text-lg font-bold leading-none text-[#1e2a4a]">
                    {offers}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function UpcomingEvents() {
  return (
    <div className="rounded-[20px] border bg-white p-5 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
          Upcoming Events
        </h3>
        <Link
          href="#calendar"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          View Calendar
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2563eb]">
            <Calendar className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1e2a4a]">Team Meeting</p>
            <p className="text-xs text-muted-foreground">Meeting Room A</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#1e2a4a]">
            09:00
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#16a34a]">
            <Users className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1e2a4a]">
              Interview - UI/UX Designer
            </p>
            <p className="text-xs text-muted-foreground">Shinta Wijaya</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#1e2a4a]">
            11:30
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]">
            <DollarSign className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1e2a4a]">
              Payroll Review
            </p>
            <p className="text-xs text-muted-foreground">
              Review September Payroll
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#1e2a4a]">
            14:00
          </span>
        </div>
      </div>
      <Link
        href="#events"
        className="mt-4 inline-flex text-sm font-semibold text-[#2563eb] hover:underline"
      >
        View All Events
      </Link>
    </div>
  );
}

export type RecentActivityItem = {
  id: string;
  actorName: string;
  initials: string;
  label: string;
  createdAt: Date;
  timeAgo: string;
  relativeTime?: string;
};

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="rounded-[20px] border bg-white p-5 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
          Recent Activity
        </h3>
        <Link
          href="/dashboard/audit"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[#f1f5f9] text-xs font-semibold text-[#1e2a4a]">
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-tight text-[#1e2a4a]">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.timeAgo ?? item.relativeTime}
                </p>
              </div>
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
