"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  Briefcase,
  Calendar,
  Eye,
  Handshake,
  MessageSquare,
  MoreVertical,
  Star,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type InterviewRecord,
  useInterviewsStore,
} from "@/lib/stores/interviews-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export type InterviewStatus =
  | "feedback_needed"
  | "completed"
  | "in_progress"
  | "scheduled";

export type { InterviewRecord };

export interface UpcomingItem {
  id: string;
  name: string;
  role: string;
  statusText: string;
  statusKind: "next" | "completed" | "scheduled";
  position: string;
  source: string;
  recruiter: string;
}

export interface FeedbackEntry {
  id: string;
  name: string;
  role: string;
  rating: string;
  excerpt: string;
}

const STATUS_STYLE: Record<
  InterviewStatus,
  { label: string; className: string }
> = {
  feedback_needed: {
    label: "Feedback Diperlukan",
    className: "bg-[#fffbeb] text-amber-700 border-amber-200",
  },
  completed: {
    label: "Selesai",
    className: "bg-[#f0fdf4] text-green-700 border-green-200",
  },
  in_progress: {
    label: "Sedang Berlangsung",
    className: "bg-[#fffbeb] text-amber-700 border-amber-200",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-[#f0fdf4] text-green-700 border-green-200",
  },
};

const UPCOMING_BADGE: Record<
  UpcomingItem["statusKind"],
  { label: string; className: string }
> = {
  next: {
    label: "Next 2 day",
    className: "bg-[#fffbeb] text-amber-700 border-amber-200",
  },
  completed: {
    label: "Selesai",
    className: "bg-[#f0fdf4] text-green-700 border-green-200",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-[#f0fdf4] text-green-700 border-green-200",
  },
};

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

function Stars({ filled = 4 }: { filled?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star
        className={cn(
          "size-3.5",
          filled > 0
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30",
        )}
      />
      <Star
        className={cn(
          "size-3.5",
          filled > 1
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30",
        )}
      />
      <Star
        className={cn(
          "size-3.5",
          filled > 2
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30",
        )}
      />
      <Star
        className={cn(
          "size-3.5",
          filled > 3
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30",
        )}
      />
      <Star
        className={cn(
          "size-3.5",
          filled > 4
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted-foreground/30",
        )}
      />
    </span>
  );
}

const MOCK_UPCOMING: UpcomingItem[] = [
  {
    id: "up-1",
    name: "Sarah Wijaya",
    role: "Product Manager",
    statusText: "Next 2 day",
    statusKind: "next",
    position: "Product Manager",
    source: "LinkedIn",
    recruiter: "Galih",
  },
  {
    id: "up-2",
    name: "John Smith",
    role: "Frontend Dev",
    statusText: "Selesai",
    statusKind: "completed",
    position: "Frontend Dev",
    source: "Referral",
    recruiter: "Tim Dev",
  },
  {
    id: "up-3",
    name: "Jane Doe",
    role: "Marketing Lead",
    statusText: "Terjadwal",
    statusKind: "scheduled",
    position: "Marketing Lead",
    source: "Direct",
    recruiter: "CEO",
  },
  {
    id: "up-4",
    name: "Mike Ross",
    role: "UX Designer",
    statusText: "Terjadwal",
    statusKind: "scheduled",
    position: "UX Designer",
    source: "Referral",
    recruiter: "Tim Dev",
  },
  {
    id: "up-5",
    name: "Mike Ross",
    role: "UX Designer",
    statusText: "Terjadwal",
    statusKind: "scheduled",
    position: "UX Designer",
    source: "Referral",
    recruiter: "Tim Dev",
  },
];

const MOCK_FEEDBACK: FeedbackEntry[] = [
  {
    id: "fb-1",
    name: "Sarah Wijaya",
    role: "Product Manager and product short bios",
    rating: "4.2/5",
    excerpt: "Frontend Developer, Imi shmua comentans, shortiwans, short bios",
  },
  {
    id: "fb-2",
    name: "John Smith",
    role: "Product Manager and product short bios",
    rating: "4.2/5",
    excerpt: "Product Manager and product submitlent short bios",
  },
  {
    id: "fb-3",
    name: "Mike Ross",
    role: "Interview Manager and short bios",
    rating: "4.2/5",
    excerpt: "Frontend Developer, Imi shmua comentans, shortiwans, short bios",
  },
];

export function InterviewsClient({
  initialInterviews,
  initialCandidates,
}: {
  initialInterviews: InterviewRecord[];
  initialCandidates?: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const interviews = useInterviewsStore((s) => s.interviews);
  const hydrate = useInterviewsStore((s) => s.hydrate);
  const { jobFilter, setJobFilter } = useInterviewsStore(
    useShallow((s) => ({
      jobFilter: s.jobFilter,
      setJobFilter: s.setJobFilter,
    })),
  );
  const { sourceFilter, setSourceFilter } = useInterviewsStore(
    useShallow((s) => ({
      sourceFilter: s.sourceFilter,
      setSourceFilter: s.setSourceFilter,
    })),
  );
  const { recruiterFilter, setRecruiterFilter } = useInterviewsStore(
    useShallow((s) => ({
      recruiterFilter: s.recruiterFilter,
      setRecruiterFilter: s.setRecruiterFilter,
    })),
  );
  const selected = useInterviewsStore((s) => s.selected);
  const setSelected = useInterviewsStore((s) => s.setSelected);
  const selectedIds = useInterviewsStore((s) => s.selectedIds);
  const open = useInterviewsStore((s) => s.open);
  const setOpen = useInterviewsStore((s) => s.setOpen);
  const draftStatus = useInterviewsStore((s) => s.draftStatus);
  const setDraftStatus = useInterviewsStore((s) => s.setDraftStatus);
  const toggleRow = useInterviewsStore((s) => s.toggleRow);
  const toggleAllStore = useInterviewsStore((s) => s.toggleAll);
  const handleRowClick = useInterviewsStore((s) => s.handleRowClick);
  const error = useInterviewsStore((s) => s.error);
  const setError = useInterviewsStore((s) => s.setError);

  useEffect(() => {
    hydrate(initialInterviews);
  }, [initialInterviews, hydrate]);

  // Keep initialCandidates param for prop compatibility (no store needed)
  void initialCandidates;

  const filtered = useMemo(() => {
    return interviews.filter((r) => {
      const byJob = jobFilter === "all" || r.position === jobFilter;
      const bySource = sourceFilter === "all" || r.source === sourceFilter;
      const byRecruiter =
        recruiterFilter === "all" || r.recruiter === recruiterFilter;
      return byJob && bySource && byRecruiter;
    });
  }, [interviews, jobFilter, sourceFilter, recruiterFilter]);

  const filteredUpcoming = useMemo(() => {
    return MOCK_UPCOMING.filter((u) => {
      const byJob = jobFilter === "all" || u.position === jobFilter;
      const bySource = sourceFilter === "all" || u.source === sourceFilter;
      const byRecruiter =
        recruiterFilter === "all" || u.recruiter === recruiterFilter;
      return byJob && bySource && byRecruiter;
    });
  }, [jobFilter, recruiterFilter, sourceFilter]);

  const positions = useMemo(
    () => [...new Set(interviews.map((r) => r.position))],
    [interviews],
  );
  const sources = useMemo(
    () => [...new Set(interviews.map((r) => r.source))],
    [interviews],
  );
  const recruiters = useMemo(
    () => [...new Set(interviews.map((r) => r.recruiter))],
    [interviews],
  );

  const allPageSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  function toggleAll(checked: boolean) {
    toggleAllStore(
      filtered.map((r) => r.id),
      checked,
    );
  }

  const createMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      router.refresh();
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      if (error.data?.code === "FORBIDDEN")
        setError("You do not have permission.");
      else setError(error.message);
    },
  });

  const updateStatusMutation = trpc.interview.updateStatus.useMutation({
    onSuccess: () => {
      setOpen(false);
      router.refresh();
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      if (error.data?.code === "FORBIDDEN")
        setError("You do not have permission.");
      else setError(error.message);
    },
  });

  const removeMutation = trpc.interview.remove.useMutation({
    onSuccess: () => {
      router.refresh();
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      if (error.data?.code === "FORBIDDEN")
        setError("You do not have permission.");
      else setError(error.message);
    },
  });
  // Expose mutations for potential future UI (kept to satisfy required mutation types)
  void createMutation;
  void removeMutation;

  function handleSave() {
    if (!selected) return;
    setError(null);
    updateStatusMutation.mutate({
      id: selected.id,
      status: draftStatus,
    });
  }

  const isPending = updateStatusMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#2b2b46]">
            Manajemen Wawancara, Galih 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan lacak jadwal serta feedback wawancara.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm text-[#2b2b46] shadow-sm">
          <Calendar className="size-4 text-muted-foreground" />
          Thursday, 22 May 2025
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-row items-center gap-4 rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5] shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Wawancara Hari Ini
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              {interviews.length}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUp className="size-3" />
              10% vs kemarin
            </p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-4 rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5] shrink-0">
            <Handshake className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total Wawancara Terjadwal
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              35
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Bulan ini</p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-4 rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#fef9c3] text-amber-600 shrink-0">
            <MessageSquare className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Feedback Tertunda
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              12
            </p>
            <p className="mt-1 text-xs text-amber-600">Perlu tindak lanjut</p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-4 rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0fdf4] text-emerald-600 shrink-0">
            <UserRound className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Pewawancara Aktif
            </p>
            <p className="mt-1 text-[24px] font-bold leading-none text-[#2b2b46]">
              6
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Terlibat hari ini
            </p>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[16px] font-semibold text-[#2b2b46]">
            Jadwal Wawancara Hari Ini
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-muted">
                <SelectValue placeholder="Job position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#fbfaf9]">
                <TableRow className="hover:bg-[#fbfaf9]">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={(v) => toggleAll(Boolean(v))}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Kandidat
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Posisi
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Waktu
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Jenis Wawancara
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Pewawancara
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right text-xs font-medium tracking-wider text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="h-4 animate-pulse bg-muted" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada jadwal wawancara untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const style = STATUS_STYLE[r.status];
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/20">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={(v) => toggleRow(r.id, Boolean(v))}
                            aria-label={`Select ${r.candidateName}`}
                          />
                        </TableCell>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => handleRowClick(r)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Avatar className="size-8">
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-semibold text-[#2b2b46]",
                                  avatarBg(r.candidateName),
                                )}
                              >
                                {r.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-[#2b2b46]">
                              {r.candidateName}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.position}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.time}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.interviewType}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.interviewer}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => handleRowClick(r)}
                        >
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              style.className,
                            )}
                          >
                            {style.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7"
                              onClick={() => handleRowClick(r)}
                              aria-label={`View ${r.candidateName}`}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-7"
                                  aria-label={`Actions for ${r.candidateName}`}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRowClick(r)}
                                >
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelected(r);
                                    setDraftStatus("completed");
                                    setOpen(true);
                                  }}
                                >
                                  Tandai Selesai
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelected(r);
                                    setDraftStatus("scheduled");
                                    setOpen(true);
                                  }}
                                >
                                  Tandai Terjadwal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <h3 className="text-[15px] font-semibold text-[#2b2b46]">
            Wawancara Mendatang
          </h3>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {filteredUpcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tidak ada wawancara mendatang.
              </p>
            ) : (
              filteredUpcoming.map((u) => {
                const badge = UPCOMING_BADGE[u.statusKind];
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold text-[#2b2b46]",
                          avatarBg(u.name),
                        )}
                      >
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#2b2b46]">
                        {u.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({u.role})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{u.role}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="rounded-[16px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]">
          <h3 className="text-[15px] font-semibold text-[#2b2b46]">
            Tinjauan Feedback Terbaru
          </h3>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {MOCK_FEEDBACK.map((f) => (
              <div key={f.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold text-[#2b2b46]",
                      avatarBg(f.name),
                    )}
                  >
                    {getInitials(f.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#2b2b46]">
                    {f.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.role}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-[#2b2b46]">
                      {f.rating}
                    </span>
                    <Stars filled={4} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {f.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#2b2b46]">
              Detail Wawancara
            </DialogTitle>
            <DialogDescription>
              Kelola status dan feedback wawancara kandidat.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback
                    className={cn(
                      "text-sm font-semibold text-[#2b2b46]",
                      avatarBg(selected.candidateName),
                    )}
                  >
                    {selected.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[#2b2b46]">
                    {selected.candidateName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.position}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="font-medium text-[#2b2b46]">{selected.time}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Jenis Wawancara
                  </p>
                  <p className="font-medium text-[#2b2b46]">
                    {selected.interviewType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pewawancara</p>
                  <p className="font-medium text-[#2b2b46]">
                    {selected.interviewer}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select
                    value={draftStatus}
                    onValueChange={(v) => setDraftStatus(v as InterviewStatus)}
                  >
                    <SelectTrigger className="mt-1 h-8 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feedback_needed">
                        Feedback Diperlukan
                      </SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="in_progress">
                        Sedang Berlangsung
                      </SelectItem>
                      <SelectItem value="scheduled">Terjadwal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
