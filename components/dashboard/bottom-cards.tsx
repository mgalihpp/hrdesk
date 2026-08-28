import { Briefcase, Calendar, DollarSign, Mail, Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function RecruitmentOverview() {
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
        <div className="rounded-xl border bg-white px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef3ff] text-[#2563eb]">
              <Briefcase className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Open Positions</p>
              <p className="text-lg font-bold leading-none text-[#1e2a4a]">8</p>
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
                42
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
                13
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
              <p className="text-lg font-bold leading-none text-[#1e2a4a]">4</p>
            </div>
          </div>
        </div>
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

export function RecentActivity() {
  return (
    <div className="rounded-[20px] border bg-white p-5 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1e2a4a]">
          Recent Activity
        </h3>
        <Link
          href="#activity"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#f1f5f9] text-xs font-semibold text-[#1e2a4a]">
              SW
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-[#1e2a4a]">
              Sarah Wijaya joined the company
            </p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#1e2a5a] text-white text-xs font-semibold">
              BS
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-[#1e2a4a]">
              Budi Santoso leave request approved
            </p>
            <p className="text-xs text-muted-foreground">3 hours ago</p>
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#eef2ff] text-xs font-semibold text-[#1e2a4a]">
              SP
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-[#1e2a4a]">
              Payroll for August 2025 completed
            </p>
            <p className="text-xs text-muted-foreground">Yesterday, 17:30</p>
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#f1f5f9] text-xs font-semibold text-[#1e2a4a]">
              AT
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight text-[#1e2a4a]">
              New candidate applied for Product Manager
            </p>
            <p className="text-xs text-muted-foreground">Yesterday, 14:15</p>
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#94a3b8]" />
        </div>
      </div>
    </div>
  );
}
