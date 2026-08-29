import type { PrismaClient } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import { cents } from "@/lib/money";
import { canTransition } from "@/lib/recruitment/pipeline";
import type {
  CandidateId,
  CandidateStage,
  CandidateView,
  JobId,
  NewCandidate,
} from "@/lib/recruitment/types";
import type { EmployeeId, EmployeeView, TenantId } from "@/lib/types";

type StoredCandidate = {
  id: string;
  tenantId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  emailEnc: string;
  phoneEnc: string | null;
  stage: string;
  hiredEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredEmployee = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  ssnEnc: string;
  bankEnc: string;
  compensation: number;
  hireDate: string;
  status: string;
  department?: string | null;
  position?: string | null;
  employmentType?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
};

function toView(d: StoredCandidate): CandidateView {
  return {
    id: d.id as CandidateId,
    tenantId: d.tenantId as TenantId,
    jobId: d.jobId as JobId,
    firstName: d.firstName,
    lastName: d.lastName,
    email: decrypt(d.emailEnc),
    phone: d.phoneEnc ? decrypt(d.phoneEnc) : null,
    stage: d.stage as CandidateStage,
    hiredEmployeeId: d.hiredEmployeeId as EmployeeId | null,
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

function toEmployeeView(d: StoredEmployee): EmployeeView {
  return {
    id: d.id as EmployeeId,
    tenantId: d.tenantId as TenantId,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    ssn: decrypt(d.ssnEnc),
    bank: decrypt(d.bankEnc),
    compensation: d.compensation as EmployeeView["compensation"],
    hireDate: d.hireDate,
    status: d.status as EmployeeView["status"],
    department:
      (d.department as EmployeeView["department"] | null) ?? "Engineering",
    position: d.position ?? "Employee",
    employmentType:
      (d.employmentType as EmployeeView["employmentType"] | null) ??
      "Full Time",
    avatarUrl: d.avatarUrl ?? "",
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

export function candidateRepo(prisma: PrismaClient, tenantId: TenantId) {
  return {
    toView,
    toEmployeeView,

    async create(input: NewCandidate): Promise<CandidateView> {
      const job = await prisma.job.findFirst({
        where: { id: input.jobId as string, tenantId },
      });
      if (!job) throw new Error("Job not found for tenant");

      const created = await prisma.candidate.create({
        data: {
          tenantId,
          jobId: input.jobId as string,
          firstName: input.firstName,
          lastName: input.lastName,
          emailEnc: encrypt(input.email),
          phoneEnc: input.phone ? encrypt(input.phone) : null,
          stage: "applied",
        },
      });
      return toView(created as unknown as StoredCandidate);
    },

    async list(): Promise<CandidateView[]> {
      const rows = await prisma.candidate.findMany({ where: { tenantId } });
      return (rows as unknown as StoredCandidate[]).map(toView);
    },

    async listByJob(jobId: JobId): Promise<CandidateView[]> {
      const rows = await prisma.candidate.findMany({
        where: { tenantId, jobId: jobId as string },
      });
      return (rows as unknown as StoredCandidate[]).map(toView);
    },

    async getById(id: CandidateId): Promise<CandidateView | null> {
      const row = await prisma.candidate.findFirst({
        where: { id: id as string, tenantId },
      });
      return row ? toView(row as unknown as StoredCandidate) : null;
    },

    async moveStage(
      id: CandidateId,
      to: CandidateStage,
    ): Promise<CandidateView> {
      const row = await prisma.candidate.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Candidate not found");
      const stored = row as unknown as StoredCandidate;
      const from = stored.stage as CandidateStage;
      if (!canTransition(from, to)) {
        throw new Error(`Invalid transition from ${from} to ${to}`);
      }
      await prisma.candidate.updateMany({
        where: { id: id as string, tenantId },
        data: { stage: to },
      });
      return toView({ ...stored, stage: to } as StoredCandidate);
    },

    async hire(
      id: CandidateId,
      input: { compensation: number; hireDate: string },
    ): Promise<EmployeeView> {
      const row = await prisma.candidate.findFirst({
        where: { id: id as string, tenantId },
      });
      if (!row) throw new Error("Candidate not found");
      const stored = row as unknown as StoredCandidate;

      if (stored.hiredEmployeeId) {
        const existing = await prisma.employee.findFirst({
          where: { id: stored.hiredEmployeeId, tenantId },
        });
        if (existing)
          return toEmployeeView(existing as unknown as StoredEmployee);
      }

      if (stored.stage !== "offer")
        throw new Error("Candidate must be in offer stage to hire");

      const view = toView(stored);
      const emp = await prisma.employee.create({
        data: {
          tenantId,
          firstName: view.firstName,
          lastName: view.lastName,
          email: view.email,
          ssnEnc: encrypt(""),
          bankEnc: encrypt(""),
          compensation: cents(input.compensation),
          hireDate: input.hireDate,
          status: "active",
        },
      });
      await prisma.candidate.updateMany({
        where: { id: id as string, tenantId },
        data: {
          stage: "hired",
          hiredEmployeeId: (emp as unknown as StoredEmployee).id,
        },
      });
      return toEmployeeView(emp as unknown as StoredEmployee);
    },
  };
}
