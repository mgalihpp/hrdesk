"use client";

import {
  ArrowUp,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  GripVertical,
  Tag,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { canTransition, nextStages } from "@/lib/recruitment/pipeline";
import type { CandidateStage } from "@/lib/recruitment/types";
import { cn } from "@/lib/utils";

export type CandidateDisplay = {
  id: string;
  name: string;
  role: string;
  stage: CandidateStage;
  appliedAt: string;
  avatar: string;
  initials: string;
  source: string;
  rating?: string;
  status?: string;
  job: string;
  recruiter: string;
};

type CandidateStageColumn = "applied" | "screening" | "interview" | "offer";

const STAGE_CONFIG: Record<
  CandidateStageColumn,
  { label: string; columnBg: string; headerText: string }
> = {
  applied: {
    label: "New Application",
    columnBg: "bg-[#eef7ff]",
    headerText: "text-[#2b2b46]",
  },
  screening: {
    label: "Screening",
    columnBg: "bg-[#eff6ff]",
    headerText: "text-[#2b2b46]",
  },
  interview: {
    label: "Interviewing",
    columnBg: "bg-[#fffbeb]",
    headerText: "text-[#2b2b46]",
  },
  offer: {
    label: "Offered",
    columnBg: "bg-[#f0fdf4]",
    headerText: "text-[#2b2b46]",
  },
};

const STAGE_ORDER: CandidateStageColumn[] = [
  "applied",
  "screening",
  "interview",
  "offer",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] ?? "U").toUpperCase();
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

function avatarBg(name: string): string {
  const colors = [
    "bg-[#f4d4eb]",
    "bg-[#e6fbff]",
    "bg-[#fff3e6]",
    "bg-[#e6fff0]",
    "bg-[#e6e8ff]",
    "bg-[#fef9c3]",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length] ?? "bg-[#f4d4eb]";
}

function matchesFilters(
  c: CandidateDisplay,
  jobPos: string,
  candidateFilter: string,
  source: string,
  recruiter: string,
): boolean {
  const byJob = jobPos === "all" || c.job === jobPos;
  const byCandidate = candidateFilter === "all" || c.name === candidateFilter;
  const bySource = source === "all" || c.source === source;
  const byRecruiter = recruiter === "all" || c.recruiter === recruiter;
  return byJob && byCandidate && bySource && byRecruiter;
}

const MOCK_CANDIDATES: CandidateDisplay[] = [
  {
    id: "c-1",
    name: "Jane Doe",
    role: "Frontend Developer",
    stage: "applied",
    appliedAt: "14.25",
    avatar: "",
    initials: getInitials("Jane Doe"),
    source: "Referral",
    rating: "4.8",
    job: "Frontend Developer",
    recruiter: "Galih",
  },
  {
    id: "c-2",
    name: "Sarah Wijaya",
    role: "Product Manager",
    stage: "applied",
    appliedAt: "14.22",
    avatar: "",
    initials: getInitials("Sarah Wijaya"),
    source: "LinkedIn",
    status: "Current",
    job: "Product Manager",
    recruiter: "Alex",
  },
  {
    id: "c-3",
    name: "John Smith",
    role: "Backend Developer",
    stage: "applied",
    appliedAt: "14.20",
    avatar: "",
    initials: getInitials("John Smith"),
    source: "Direct",
    rating: "4.5",
    job: "Backend Developer",
    recruiter: "Maya",
  },
  {
    id: "c-4",
    name: "Emily Chen",
    role: "UI/UX Designer",
    stage: "applied",
    appliedAt: "14.18",
    avatar: "",
    initials: getInitials("Emily Chen"),
    source: "Referral",
    rating: "4.9",
    job: "UI/UX Designer",
    recruiter: "Galih",
  },
  {
    id: "c-5",
    name: "Michael Brown",
    role: "Data Analyst",
    stage: "applied",
    appliedAt: "14.15",
    avatar: "",
    initials: getInitials("Michael Brown"),
    source: "LinkedIn",
    status: "New",
    job: "Data Analyst",
    recruiter: "Alex",
  },
  {
    id: "c-6",
    name: "Aisha Khan",
    role: "Product Manager",
    stage: "screening",
    appliedAt: "13.40",
    avatar: "",
    initials: getInitials("Aisha Khan"),
    source: "Direct",
    rating: "4.6",
    job: "Product Manager",
    recruiter: "Maya",
  },
  {
    id: "c-7",
    name: "David Lee",
    role: "Frontend Developer",
    stage: "screening",
    appliedAt: "13.30",
    avatar: "",
    initials: getInitials("David Lee"),
    source: "Referral",
    status: "Screening",
    job: "Frontend Developer",
    recruiter: "Galih",
  },
  {
    id: "c-8",
    name: "Priya Patel",
    role: "Backend Developer",
    stage: "screening",
    appliedAt: "13.12",
    avatar: "",
    initials: getInitials("Priya Patel"),
    source: "LinkedIn",
    rating: "4.7",
    job: "Backend Developer",
    recruiter: "Alex",
  },
  {
    id: "c-9",
    name: "Carlos Rivera",
    role: "UI/UX Designer",
    stage: "screening",
    appliedAt: "12.55",
    avatar: "",
    initials: getInitials("Carlos Rivera"),
    source: "Direct",
    rating: "4.4",
    job: "UI/UX Designer",
    recruiter: "Maya",
  },
  {
    id: "c-10",
    name: "Olivia Taylor",
    role: "Product Manager",
    stage: "interview",
    appliedAt: "12.30",
    avatar: "",
    initials: getInitials("Olivia Taylor"),
    source: "Referral",
    status: "Interview",
    job: "Product Manager",
    recruiter: "Galih",
  },
  {
    id: "c-11",
    name: "James Wilson",
    role: "Frontend Developer",
    stage: "interview",
    appliedAt: "12.10",
    avatar: "",
    initials: getInitials("James Wilson"),
    source: "LinkedIn",
    rating: "4.3",
    job: "Frontend Developer",
    recruiter: "Alex",
  },
  {
    id: "c-12",
    name: "Sofia Garcia",
    role: "Backend Developer",
    stage: "interview",
    appliedAt: "11.50",
    avatar: "",
    initials: getInitials("Sofia Garcia"),
    source: "Direct",
    rating: "4.8",
    job: "Backend Developer",
    recruiter: "Maya",
  },
  {
    id: "c-13",
    name: "Liam Johnson",
    role: "UI/UX Designer",
    stage: "interview",
    appliedAt: "11.20",
    avatar: "",
    initials: getInitials("Liam Johnson"),
    source: "Referral",
    status: "Interview",
    job: "UI/UX Designer",
    recruiter: "Galih",
  },
  {
    id: "c-14",
    name: "Emma Davis",
    role: "Product Manager",
    stage: "offer",
    appliedAt: "10.40",
    avatar: "",
    initials: getInitials("Emma Davis"),
    source: "LinkedIn",
    status: "Offered",
    job: "Product Manager",
    recruiter: "Alex",
  },
  {
    id: "c-15",
    name: "Noah Martinez",
    role: "Frontend Developer",
    stage: "offer",
    appliedAt: "10.10",
    avatar: "",
    initials: getInitials("Noah Martinez"),
    source: "Direct",
    rating: "4.9",
    job: "Frontend Developer",
    recruiter: "Maya",
  },
  {
    id: "c-16",
    name: "Ava Anderson",
    role: "Backend Developer",
    stage: "offer",
    appliedAt: "09.55",
    avatar: "",
    initials: getInitials("Ava Anderson"),
    source: "Referral",
    status: "Offered",
    job: "Backend Developer",
    recruiter: "Galih",
  },
];

const RECENT_ACTIVITY = [
  {
    title: "Jane Doe moved to Screening",
    name: "Jane Doe",
    time: "2h ago",
    color: "bg-[#2b7fff]",
  },
  {
    title: "Sarah Wijaya scheduled interview",
    name: "Sarah Wijaya",
    time: "5h ago",
    color: "bg-[#00acca]",
  },
  {
    title: "Aisha Khan submitted application",
    name: "Aisha Khan",
    time: "1 day ago",
    color: "bg-[#f59e0b]",
  },
  {
    title: "Offer sent to Emma Davis",
    name: "Emma Davis",
    time: "2 days ago",
    color: "bg-emerald-500",
  },
];

const TOP_RATINGS = [
  {
    name: "Emily Chen",
    role: "UI/UX Designer",
    bio: "Exceptional portfolio with strong design systems focus.",
    rating: "4.9",
  },
  {
    name: "Noah Martinez",
    role: "Frontend Developer",
    bio: "Deep React expertise and solid performance track.",
    rating: "4.9",
  },
  {
    name: "Jane Doe",
    role: "Frontend Developer",
    bio: "Strong CS fundamentals and clean component work.",
    rating: "4.8",
  },
];

function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const radius = 58;
  const stroke = 18;
  const norm = 2 * Math.PI * radius;
  return (
    <div className="relative flex size-[140px] items-center justify-center">
      <svg
        width={140}
        height={140}
        viewBox="0 0 140 140"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {data.map((d) => {
          const dash = (d.value / total) * norm;
          const gap = norm - dash;
          const offset = (acc / total) * norm;
          acc += d.value;
          return (
            <circle
              key={d.label}
              cx={70}
              cy={70}
              r={radius}
              fill="transparent"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[18px] font-bold leading-none text-[#2b2b46]">
          {total}
        </span>
        <span className="text-[11px] text-muted-foreground">Total</span>
      </div>
    </div>
  );
}

export function CandidatesClient() {
  const [candidates, setCandidates] =
    useState<CandidateDisplay[]>(MOCK_CANDIDATES);
  const [jobFilter, setJobFilter] = useState("all");
  const [candidateFilter, setCandidateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] =
    useState<CandidateStageColumn | null>(null);
  const [selected, setSelected] = useState<CandidateDisplay | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      candidates.filter((c) =>
        matchesFilters(
          c,
          jobFilter,
          candidateFilter,
          sourceFilter,
          recruiterFilter,
        ),
      ),
    [candidates, jobFilter, candidateFilter, sourceFilter, recruiterFilter],
  );

  const counts = useMemo(() => {
    const m: Record<CandidateStageColumn, number> = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
    };
    for (const c of filtered) {
      if (c.stage in m) m[c.stage as CandidateStageColumn] += 1;
    }
    return m;
  }, [filtered]);

  const totalCounts = useMemo(() => {
    const m: Record<CandidateStageColumn, number> = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
    };
    for (const c of candidates) {
      if (c.stage in m) m[c.stage as CandidateStageColumn] += 1;
    }
    return m;
  }, [candidates]);

  const jobs = useMemo(
    () => [...new Set(candidates.map((c) => c.job))],
    [candidates],
  );
  const sources = useMemo(
    () => [...new Set(candidates.map((c) => c.source))],
    [candidates],
  );
  const recruiters = useMemo(
    () => [...new Set(candidates.map((c) => c.recruiter))],
    [candidates],
  );
  const candidateNames = useMemo(
    () => [...new Set(candidates.map((c) => c.name))],
    [candidates],
  );

  const sourceData = useMemo(() => {
    const bySource: Record<string, number> = {};
    for (const c of candidates)
      bySource[c.source] = (bySource[c.source] ?? 0) + 1;
    const colorMap: Record<string, string> = {
      Referral: "#2b7fff",
      LinkedIn: "#1d4ed8",
      Direct: "#bbf7d0",
    };
    return Object.entries(bySource).map(([label, value]) => ({
      label,
      value,
      color: colorMap[label] ?? "#94a3b8",
    }));
  }, [candidates]);

  function handleDrop(target: CandidateStageColumn) {
    if (!draggedId) return;
    const dragged = candidates.find((c) => c.id === draggedId);
    if (!dragged) {
      setDragOverColumn(null);
      return;
    }
    if (dragged.stage === target) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }
    if (!canTransition(dragged.stage, target as CandidateStage)) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === draggedId ? { ...c, stage: target as CandidateStage } : c,
      ),
    );
    setDraggedId(null);
    setDragOverColumn(null);
  }

  function moveStage(id: string, to: CandidateStage) {
    const from = candidates.find((c) => c.id === id)?.stage;
    if (!from || !canTransition(from, to)) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: to } : c)),
    );
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, stage: to } : prev,
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Candidate Management, Galih 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track candidate profiles.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm text-[#2b2b46] shadow-sm">
          <Calendar className="size-4 text-muted-foreground" />
          Thursday, 22 May 2025
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total Candidates
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              2,540
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUp className="size-3" />
              3.1% vs last month
            </p>
          </div>
        </Card>
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e6fbff] text-[#00acca]">
              <ClipboardCheck className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Active Applications
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {totalCounts.applied + totalCounts.screening}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across applied and screening
            </p>
          </div>
        </Card>
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#fff3e6] text-amber-600">
              <CalendarDays className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Scheduled Interviews
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {totalCounts.interview}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              In interview stage
            </p>
          </div>
        </Card>
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e6fff0] text-emerald-600">
              <Tag className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Offers Extended
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {totalCounts.offer}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Offers awaiting response
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[16px] border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[16px] font-semibold text-[#2b2b46]">
            Candidate Pipeline
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Job position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j} value={j}>
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={candidateFilter} onValueChange={setCandidateFilter}>
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Candidate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                {candidateNames.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Recruiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recruiters</SelectItem>
                {recruiters.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {STAGE_ORDER.map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const list = filtered.filter((c) => c.stage === stage);
            const isDragOver = dragOverColumn === stage;
            return (
              <section
                key={stage}
                aria-label={cfg.label}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverColumn !== stage) setDragOverColumn(stage);
                }}
                onDragLeave={() => {
                  if (dragOverColumn === stage) setDragOverColumn(null);
                }}
                onDrop={() => {
                  handleDrop(stage);
                  setDragOverColumn(null);
                }}
                className={cn(
                  "flex min-h-[320px] w-[280px] min-w-[280px] shrink-0 snap-start flex-col rounded-[12px] p-3 transition",
                  cfg.columnBg,
                  isDragOver && "ring-2 ring-[#00acca]/20 bg-[#00acca]/5",
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex items-center gap-2 text-[13px] font-semibold",
                    cfg.headerText,
                  )}
                >
                  <span>{cfg.label}</span>
                  <span className="text-muted-foreground">
                    ({counts[stage]})
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {list.map((c) => {
                    const isDragging = draggedId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        draggable
                        onDragStart={() => setDraggedId(c.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => {
                          setSelected(c);
                          setOpen(true);
                        }}
                        className={cn(
                          "flex cursor-grab flex-col gap-2 rounded-[12px] border border-black/5 bg-white p-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)] transition hover:shadow-md active:cursor-grabbing",
                          isDragging && "opacity-50 ring-2 ring-[#00acca]/30",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarFallback
                              className={cn(
                                "text-xs font-semibold text-[#2b2b46]",
                                avatarBg(c.name),
                              )}
                            >
                              {c.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-[13px] font-semibold text-[#2b2b46]">
                              {c.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {c.role}
                            </p>
                          </div>
                          <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Application: {c.appliedAt}
                          </span>
                          {c.rating ? (
                            <span className="rounded-full bg-[#fff7e6] px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Rating {c.rating}
                            </span>
                          ) : c.status ? (
                            <span className="rounded-full bg-[#e6fff0] px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              {c.status}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                  {list.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No candidates
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex h-[260px] flex-col rounded-[16px] border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <h3 className="text-sm font-semibold text-[#2b2b46]">
            Pipeline Insights
          </h3>
          <div className="flex flex-1 items-center gap-4 pt-2">
            <DonutChart data={sourceData} />
            <div className="flex flex-col gap-2">
              {sourceData.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-semibold text-[#2b2b46]">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex h-[260px] flex-col rounded-[16px] border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <h3 className="text-sm font-semibold text-[#2b2b46]">
            Recent Candidate Activity
          </h3>
          <div className="mt-4 flex flex-1 flex-col gap-3">
            {RECENT_ACTIVITY.map((a) => (
              <div key={a.title} className="flex items-center gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold text-[#2b2b46]",
                      avatarBg(a.name),
                    )}
                  >
                    {getInitials(a.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium leading-tight text-[#2b2b46]">
                    {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
                <span className={cn("size-2 shrink-0 rounded-full", a.color)} />
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <button
            type="button"
            className="text-left text-xs font-medium text-[#00acca]"
          >
            View all activity
          </button>
        </Card>

        <Card className="flex h-[260px] flex-col rounded-[16px] border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <h3 className="text-sm font-semibold text-[#2b2b46]">
            Top Candidate Ratings
          </h3>
          <div className="mt-3 flex flex-1 flex-col gap-3">
            {TOP_RATINGS.map((t) => (
              <div key={t.name} className="flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold text-[#2b2b46]",
                      avatarBg(t.name),
                    )}
                  >
                    {getInitials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#2b2b46]">
                      {t.name}
                    </p>
                    <Badge className="rounded-full bg-[#e6fff0] px-2 py-0 text-[10px] font-medium text-emerald-700">
                      Current
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {t.bio}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700">
                  {t.rating}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.role} · {selected.job} · {selected.source} ·{" "}
                  {selected.recruiter}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 py-2">
                <Avatar className="size-10">
                  <AvatarFallback
                    className={cn(
                      "font-semibold text-[#2b2b46]",
                      avatarBg(selected.name),
                    )}
                  >
                    {selected.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#2b2b46]">
                    {selected.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Application: {selected.appliedAt}
                  </p>
                </div>
                {selected.rating ? (
                  <span className="ml-auto rounded-full bg-[#fff7e6] px-2 py-1 text-xs font-medium text-amber-700">
                    Rating {selected.rating}
                  </span>
                ) : selected.status ? (
                  <span className="ml-auto rounded-full bg-[#e6fff0] px-2 py-1 text-xs font-medium text-emerald-700">
                    {selected.status}
                  </span>
                ) : null}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#2b2b46]">
                  Move stage
                </p>
                <div className="flex flex-wrap gap-2">
                  {nextStages(selected.stage).map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => moveStage(selected.id, n)}
                    >
                      Move to{" "}
                      {STAGE_CONFIG[n as CandidateStageColumn]?.label ?? n}
                    </Button>
                  ))}
                  {nextStages(selected.stage).length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No further transitions
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
