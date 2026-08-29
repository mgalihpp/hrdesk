import { hashPassword } from "@better-auth/utils/password";
import { encrypt } from "../lib/crypto";
import { cents } from "../lib/money";
import { runPayroll } from "../lib/payroll/engine";
import { US_2026_SINGLE_BRACKETS } from "../lib/payroll/tax";
import { prisma } from "../lib/prisma";

const SEED_PASSWORD = "Mgalihpp123!";

async function main() {
  console.log("== SaaSDesk Real Seed — mgalihpp (full model coverage) ==");

  // 1. User — primary owner mgalihpp
  let user = await prisma.user.findFirst({ where: { name: "mgalihpp" } });
  if (!user) {
    user =
      (await prisma.user.findFirst({
        where: { email: "muhammadgalih451@gmail.com" },
      })) ??
      (await prisma.user.findFirst({
        where: { email: "mgalihpp@saasdesk.local" },
      }));
  }
  if (!user) {
    console.log("User mgalihpp not found → creating...");
    const hashed = await hashPassword(SEED_PASSWORD);
    const now = new Date();
    user = await prisma.user.create({
      data: {
        name: "mgalihpp",
        email: "muhammadgalih451@gmail.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.account.create({
      data: {
        issuer: "local:credential",
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashed,
      },
    });
    console.log(`Created user ${user.id} (${user.email})`);
  } else {
    console.log(`Found user: ${user.id} name=${user.name} email=${user.email}`);
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }
    const acct = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    const hashed = await hashPassword(SEED_PASSWORD);
    if (!acct) {
      await prisma.account.create({
        data: {
          issuer: "local:credential",
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashed,
        },
      });
    } else {
      await prisma.account.update({
        where: { id: acct.id },
        data: { password: hashed },
      });
    }
    console.log(`→ Password synced to ${SEED_PASSWORD}`);
  }

  // 2. Organization / Tenant
  const members = await prisma.member.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  let organizationId: string;
  let organization: { id: string; name: string; slug: string } | null = null;
  if (members.length > 0) {
    const ownerMember = members.find((m) => m.role === "owner") ?? members[0];
    organizationId = ownerMember.organizationId;
    organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    console.log(
      `Using organization ${organizationId} (${organization?.name}) role=${ownerMember.role}`,
    );
  } else {
    organization = await prisma.organization.create({
      data: {
        name: "Mgalihpp Workspace",
        slug: `mgalihpp-${Date.now().toString(36).slice(-4)}`,
      },
    });
    organizationId = organization.id;
    await prisma.member.create({
      data: { organizationId, userId: user.id, role: "owner" },
    });
    console.log(
      `Created organization ${organizationId} (${organization.name})`,
    );
  }
  if (!organization)
    throw new Error(`Organization ${organizationId!} not found`);
  const tenantId = organizationId;
  console.log(`TenantId = ${tenantId}`);

  const tenant = await prisma.tenant.upsert({
    where: { tenantId },
    update: {
      plan: "professional",
      taxLocale: "US",
      brandingName: "Mgalihpp",
      brandingLogoUrl: "",
    },
    create: {
      tenantId,
      plan: "professional",
      taxLocale: "US",
      brandingName: "Mgalihpp",
      brandingLogoUrl: "",
    },
  });
  console.log(
    `Tenant upserted: ${tenant.tenantId} plan=${tenant.plan} locale=${tenant.taxLocale}`,
  );

  const idempotencyKey = (suffix: string) => `${tenantId}:${suffix}`;

  // Clean previous tenant data (idempotent re-seed) — children first
  await prisma.payItem.deleteMany({ where: { tenantId } });
  await prisma.payslip.deleteMany({ where: { tenantId } });
  await prisma.payRun.deleteMany({ where: { tenantId } });
  await prisma.timeEntry.deleteMany({ where: { tenantId } });
  await prisma.leave.deleteMany({ where: { tenantId } });
  await prisma.event.deleteMany({ where: { tenantId } });
  await prisma.interview.deleteMany({ where: { tenantId } });
  await prisma.candidate.deleteMany({ where: { tenantId } });
  await prisma.job.deleteMany({ where: { tenantId } });
  await prisma.department.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.subscription.deleteMany({ where: { tenantId } });
  await prisma.integrationSync.deleteMany({ where: { tenantId } });
  await prisma.integrationConnection.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  console.log("→ Cleaned previous tenant data");

  // 3. Departments — realistic structure (headEmail = real employee email, not .local)
  const departmentsData = [
    {
      name: "Engineering",
      iconKey: "code-2",
      headName: "Budi Santoso",
      headEmail: "budi.santoso@saasdesk.id",
      location: "Jakarta",
      status: "Active",
    },
    {
      name: "Product",
      iconKey: "lightbulb",
      headName: "Sinta Wijaya",
      headEmail: "sinta.wijaya@saasdesk.id",
      location: "Bandung",
      status: "Active",
    },
    {
      name: "Design",
      iconKey: "palette",
      headName: "Raka Pratama",
      headEmail: "raka.pratama@saasdesk.id",
      location: "Yogyakarta",
      status: "Active",
    },
    {
      name: "Marketing",
      iconKey: "megaphone",
      headName: "Dewi Lestari",
      headEmail: "dewi.lestari@saasdesk.id",
      location: "Surabaya",
      status: "Active",
    },
    {
      name: "Finance",
      iconKey: "wallet",
      headName: "Agus Hermawan",
      headEmail: "agus.hermawan@saasdesk.id",
      location: "Jakarta",
      status: "Active",
    },
    {
      name: "HR",
      iconKey: "users",
      headName: "mgalihpp",
      headEmail: user.email,
      location: "Jakarta",
      status: "Active",
    },
  ];
  for (const d of departmentsData) {
    await prisma.department.create({
      data: {
        tenantId,
        name: d.name,
        iconKey: d.iconKey,
        headName: d.headName,
        headEmail: d.headEmail,
        headAvatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(d.headEmail)}`,
        location: d.location,
        activeEmployees: 0,
        budgetUtil: 0,
        status: d.status,
      },
    });
  }
  console.log(`→ ${departmentsData.length} departments seeded`);

  // 4. Employees — 15 realistic (covers dashboard table, payroll, attendance)
  const employeesSeed: Array<{
    firstName: string;
    lastName: string;
    email: string;
    ssn: string;
    bank: string;
    compensation: number;
    hireDate: string;
    status: string;
    department: string;
    position: string;
    employmentType: string;
  }> = [
    {
      firstName: "Budi",
      lastName: "Santoso",
      email: "budi.santoso@saasdesk.id",
      ssn: "3171012301900001",
      bank: "BCA-1234567890",
      compensation: 18000000,
      hireDate: "2023-03-15",
      status: "active",
      department: "Engineering",
      position: "Senior Software Engineer",
      employmentType: "Full Time",
    },
    {
      firstName: "Sinta",
      lastName: "Wijaya",
      email: "sinta.wijaya@saasdesk.id",
      ssn: "3171014501920002",
      bank: "Mandiri-9876543210",
      compensation: 16500000,
      hireDate: "2022-07-01",
      status: "active",
      department: "Product",
      position: "Product Manager",
      employmentType: "Full Time",
    },
    {
      firstName: "Raka",
      lastName: "Pratama",
      email: "raka.pratama@saasdesk.id",
      ssn: "3404121103910003",
      bank: "BRI-1122334455",
      compensation: 14000000,
      hireDate: "2023-11-20",
      status: "active",
      department: "Design",
      position: "UI/UX Designer",
      employmentType: "Full Time",
    },
    {
      firstName: "Dewi",
      lastName: "Lestari",
      email: "dewi.lestari@saasdesk.id",
      ssn: "3573015605930004",
      bank: "BNI-5566778899",
      compensation: 13500000,
      hireDate: "2024-01-10",
      status: "active",
      department: "Marketing",
      position: "Marketing Manager",
      employmentType: "Full Time",
    },
    {
      firstName: "Agus",
      lastName: "Hermawan",
      email: "agus.hermawan@saasdesk.id",
      ssn: "3171020708850005",
      bank: "BCA-9988776655",
      compensation: 15500000,
      hireDate: "2021-05-05",
      status: "active",
      department: "Finance",
      position: "Finance Lead",
      employmentType: "Full Time",
    },
    {
      firstName: "Alya",
      lastName: "Putri",
      email: "alya.putri@saasdesk.id",
      ssn: "3171032202950006",
      bank: "Mandiri-1212121212",
      compensation: 9500000,
      hireDate: "2024-06-01",
      status: "active",
      department: "Engineering",
      position: "Frontend Engineer",
      employmentType: "Full Time",
    },
    {
      firstName: "Fajar",
      lastName: "Nugroho",
      email: "fajar.nugroho@saasdesk.id",
      ssn: "3273011508930007",
      bank: "BRI-3434343434",
      compensation: 11000000,
      hireDate: "2023-09-12",
      status: "active",
      department: "Engineering",
      position: "Backend Engineer",
      employmentType: "Full Time",
    },
    {
      firstName: "Nadia",
      lastName: "Sari",
      email: "nadia.sari@saasdesk.id",
      ssn: "3171041802940008",
      bank: "BNI-5656565656",
      compensation: 9000000,
      hireDate: "2024-08-01",
      status: "active",
      department: "Engineering",
      position: "Support Specialist",
      employmentType: "Contract",
    },
    {
      firstName: "Galih",
      lastName: "Pratama",
      email: user.email,
      ssn: "3171051001950009",
      bank: "BCA-0001112223",
      compensation: 25000000,
      hireDate: "2020-01-15",
      status: "active",
      department: "Engineering",
      position: "CTO / Owner",
      employmentType: "Full Time",
    },
    {
      firstName: "Rina",
      lastName: "Marlina",
      email: "rina.marlina@saasdesk.id",
      ssn: "3201016706900010",
      bank: "Mandiri-7878787878",
      compensation: 7500000,
      hireDate: "2024-03-01",
      status: "on_leave",
      department: "HR",
      position: "HR Specialist",
      employmentType: "Part Time",
    },
    {
      firstName: "Kevin",
      lastName: "Tan",
      email: "kevin.tan@saasdesk.id",
      ssn: "3171061204920011",
      bank: "BCA-3344556677",
      compensation: 12000000,
      hireDate: "2023-05-18",
      status: "active",
      department: "Engineering",
      position: "DevOps Engineer",
      employmentType: "Full Time",
    },
    {
      firstName: "Maya",
      lastName: "Anggraini",
      email: "maya.anggraini@saasdesk.id",
      ssn: "3171072503930012",
      bank: "Mandiri-4455667788",
      compensation: 10500000,
      hireDate: "2024-02-12",
      status: "active",
      department: "Product",
      position: "Product Designer",
      employmentType: "Full Time",
    },
    {
      firstName: "Hendra",
      lastName: "Saputra",
      email: "hendra.saputra@saasdesk.id",
      ssn: "3171083008910013",
      bank: "BRI-5566778899",
      compensation: 8500000,
      hireDate: "2023-10-03",
      status: "active",
      department: "Marketing",
      position: "Content Strategist",
      employmentType: "Full Time",
    },
    {
      firstName: "Lina",
      lastName: "Kusuma",
      email: "lina.kusuma@saasdesk.id",
      ssn: "3171091505940014",
      bank: "BNI-6677889900",
      compensation: 7000000,
      hireDate: "2024-09-01",
      status: "terminated",
      department: "Finance",
      position: "Junior Analyst",
      employmentType: "Contract",
    },
    {
      firstName: "Arif",
      lastName: "Setiawan",
      email: "arif.setiawan@saasdesk.id",
      ssn: "3171101011900015",
      bank: "BCA-7788990011",
      compensation: 13000000,
      hireDate: "2022-11-25",
      status: "active",
      department: "Design",
      position: "Brand Designer",
      employmentType: "Full Time",
    },
  ];

  const createdEmployees: Array<{
    id: string;
    email: string;
    compensation: number;
    status: string;
    department: string;
  }> = [];
  for (const e of employeesSeed) {
    const created = await prisma.employee.create({
      data: {
        tenantId,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        ssnEnc: encrypt(e.ssn),
        bankEnc: encrypt(e.bank),
        compensation: e.compensation,
        hireDate: e.hireDate,
        status: e.status,
        department: e.department,
        position: e.position,
        employmentType: e.employmentType,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(e.email)}`,
      },
    });
    createdEmployees.push({
      id: created.id,
      email: e.email,
      compensation: e.compensation,
      status: e.status,
      department: e.department,
    });
  }
  console.log(`→ ${createdEmployees.length} employees seeded (encrypted PII)`);

  // Recompute department activeEmployees + budgetUtil (real aggregation)
  const deptCounts = new Map<string, number>();
  const deptBudget = new Map<string, number>();
  for (const emp of createdEmployees) {
    if (emp.status === "active")
      deptCounts.set(emp.department, (deptCounts.get(emp.department) ?? 0) + 1);
    deptBudget.set(
      emp.department,
      (deptBudget.get(emp.department) ?? 0) + emp.compensation,
    );
  }
  for (const [name, count] of deptCounts) {
    const budget = deptBudget.get(name) ?? 0;
    const util = Math.min(
      95,
      Math.max(25, Math.round((budget / 100000000) * 100)),
    ); // scale to 0-100
    await prisma.department.updateMany({
      where: { tenantId, name },
      data: { activeEmployees: count, budgetUtil: util },
    });
  }
  console.log("→ departments reconciled (activeEmployees, budgetUtil)");

  const empByEmail = Object.fromEntries(
    createdEmployees.map((x) => [x.email, x.id]),
  );
  const activeEmployeeIds = createdEmployees
    .filter((e) => e.status === "active")
    .map((e) => e.id);

  // 5. Jobs — 5 realistic postings
  const jobsData = [
    {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      description:
        "Build next-gen SaaS dashboard with Next.js 16, React 19, Tailwind v4. Own design system.",
      status: "open",
    },
    {
      title: "Product Manager",
      department: "Product",
      description:
        "Own roadmap for HR & Payroll, work with Eng & Design. Data-driven, SMB obsessed.",
      status: "open",
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      description:
        "Design system + marketing site in Figma, implement with shadcn / radix-luma.",
      status: "open",
    },
    {
      title: "Finance Analyst",
      department: "Finance",
      description:
        "Payroll reconciliation, tax reporting (PPh 21 → US 2026), billing & invoicing.",
      status: "closed",
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      description:
        "K8s, observability (OTel), payroll engine isolation, multi-tenant RLS.",
      status: "open",
    },
  ];
  const jobIds: string[] = [];
  for (const j of jobsData) {
    const created = await prisma.job.create({
      data: {
        tenantId,
        title: j.title,
        department: j.department,
        description: j.description,
        status: j.status,
      },
    });
    jobIds.push(created.id);
  }
  console.log(`→ ${jobIds.length} jobs seeded`);

  // 6. Candidates — 10 across full pipeline
  const candidatesSeed = [
    {
      jobIdx: 0,
      firstName: "Kevin",
      lastName: "Alvarez",
      email: "kevin.alvarez@example.com",
      phone: "+6281211110001",
      stage: "applied",
    },
    {
      jobIdx: 0,
      firstName: "Citra",
      lastName: "Kirana",
      email: "citra.kirana@example.com",
      phone: "+6281211110002",
      stage: "screening",
    },
    {
      jobIdx: 1,
      firstName: "Bayu",
      lastName: "Firmansyah",
      email: "bayu.firmansyah@example.com",
      phone: "+6281211110003",
      stage: "interview",
    },
    {
      jobIdx: 2,
      firstName: "Hana",
      lastName: "Sastri",
      email: "hana.sastri@example.com",
      phone: "+6281211110004",
      stage: "offer",
    },
    {
      jobIdx: 0,
      firstName: "Dimas",
      lastName: "Anggara",
      email: "dimas.anggara@example.com",
      phone: "+6281211110005",
      stage: "hired",
      hiredEmail: "alya.putri@saasdesk.id",
    },
    {
      jobIdx: 4,
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@example.com",
      phone: "+6281211110006",
      stage: "screening",
    },
    {
      jobIdx: 1,
      firstName: "Rio",
      lastName: "Fernando",
      email: "rio.fernando@example.com",
      phone: "+6281211110007",
      stage: "applied",
    },
    {
      jobIdx: 2,
      firstName: "Putri",
      lastName: "Ayunda",
      email: "putri.ayunda@example.com",
      phone: "+6281211110008",
      stage: "interview",
    },
    {
      jobIdx: 4,
      firstName: "Alex",
      lastName: "Morgan",
      email: "alex.morgan@example.com",
      phone: "+6281211110009",
      stage: "offer",
    },
    {
      jobIdx: 0,
      firstName: "Joko",
      lastName: "Widodo",
      email: "joko.widodo@example.com",
      phone: "+6281211110010",
      stage: "hired",
      hiredEmail: "kevin.tan@saasdesk.id",
    },
  ];
  const candidateIds: string[] = [];
  for (const c of candidatesSeed) {
    const hiredEmployeeId = (c as any).hiredEmail
      ? (empByEmail[(c as any).hiredEmail] ?? null)
      : null;
    const created = await prisma.candidate.create({
      data: {
        tenantId,
        jobId: jobIds[c.jobIdx],
        firstName: c.firstName,
        lastName: c.lastName,
        emailEnc: encrypt(c.email),
        phoneEnc: encrypt(c.phone),
        stage: c.stage,
        hiredEmployeeId,
      },
    });
    candidateIds.push(created.id);
  }
  console.log(`→ ${candidateIds.length} candidates seeded`);

  // 7. Interviews — 6
  const interviewsSeed = [
    {
      candidateIdx: 1,
      candidateName: "Citra Kirana",
      position: "Senior Frontend Engineer",
      time: new Date(Date.now() + 2 * 86400000).toISOString(),
      interviewType: "technical",
      interviewer: "Budi Santoso",
      source: "linkedin",
      recruiter: "Rina Marlina",
      status: "scheduled",
    },
    {
      candidateIdx: 2,
      candidateName: "Bayu Firmansyah",
      position: "Product Manager",
      time: new Date(Date.now() + 1 * 86400000).toISOString(),
      interviewType: "culture",
      interviewer: "Sinta Wijaya",
      source: "referral",
      recruiter: "Rina Marlina",
      status: "scheduled",
    },
    {
      candidateIdx: 3,
      candidateName: "Hana Sastri",
      position: "UI/UX Designer",
      time: new Date(Date.now() - 3 * 86400000).toISOString(),
      interviewType: "portfolio",
      interviewer: "Raka Pratama",
      source: "glints",
      recruiter: "Rina Marlina",
      status: "completed",
      feedback: "Strong portfolio, great culture fit",
      rating: "4.5",
    },
    {
      candidateIdx: 5,
      candidateName: "Sarah Chen",
      position: "DevOps Engineer",
      time: new Date(Date.now() + 5 * 86400000).toISOString(),
      interviewType: "system_design",
      interviewer: "Budi Santoso",
      source: "linkedin",
      recruiter: "Rina Marlina",
      status: "scheduled",
    },
    {
      candidateIdx: 7,
      candidateName: "Putri Ayunda",
      position: "UI/UX Designer",
      time: new Date(Date.now() - 1 * 86400000).toISOString(),
      interviewType: "technical",
      interviewer: "Raka Pratama",
      source: "dribbble",
      recruiter: "Rina Marlina",
      status: "completed",
      feedback: "Excellent taste, needs more code depth",
      rating: "4.0",
    },
    {
      candidateIdx: 8,
      candidateName: "Alex Morgan",
      position: "DevOps Engineer",
      time: new Date(Date.now() - 2 * 86400000).toISOString(),
      interviewType: "culture",
      interviewer: "Kevin Tan",
      source: "referral",
      recruiter: "Rina Marlina",
      status: "completed",
      feedback: "Offer extended",
      rating: "5.0",
    },
  ];
  for (const iv of interviewsSeed) {
    await prisma.interview.create({
      data: {
        tenantId,
        candidateId: candidateIds[iv.candidateIdx],
        candidateName: iv.candidateName,
        position: iv.position,
        time: iv.time,
        interviewType: iv.interviewType,
        interviewer: iv.interviewer,
        source: iv.source,
        recruiter: iv.recruiter,
        status: iv.status,
        feedback: (iv as any).feedback ?? null,
        rating: (iv as any).rating ?? null,
      },
    });
  }
  console.log(`→ ${interviewsSeed.length} interviews seeded`);

  // 8. Time Entries — 20 over last 14 days, mixed statuses
  const now = new Date();
  const mkTime = (daysAgo: number, startHour: number, endHour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const s = new Date(d);
    s.setHours(startHour, 0, 0, 0);
    const e = new Date(d);
    e.setHours(endHour, 0, 0, 0);
    return { s, e };
  };
  // 8. Time Entries — sinkron dengan payroll: buat untuk SEMUA active employees (13 orang), bukan subset
  // Jadi dashboard Attendance vs Next Payroll (13) tidak beda. Real workdays last 5 weekdays.
  const timeEntries: Array<{
    employeeId: string;
    type: string;
    s: Date;
    e: Date;
    status: string;
    approvedBy: string | null;
  }> = [];
  let entryIdx = 0;
  for (const empId of activeEmployeeIds) {
    for (let d = 1; d <= 7; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekend
      // stagger: sebagian approved (3 hari terakhir), sisanya pending — mirip real approval flow
      const isRecent = d <= 3;
      timeEntries.push({
        employeeId: empId,
        type: "clock",
        ...mkTime(d, 9, 18),
        status: isRecent ? "approved" : "pending",
        approvedBy: isRecent ? user.id : null,
      });
      // overtime untuk 30% employees di hari ke-2
      if (d === 2 && entryIdx % 3 === 0) {
        timeEntries.push({
          employeeId: empId,
          type: "overtime",
          ...mkTime(d, 18, 20),
          status: "pending",
          approvedBy: null,
        });
      }
      entryIdx++;
      if (timeEntries.length >= 65) break; // cap biar tidak membengkak
    }
    if (timeEntries.length >= 65) break;
  }

  for (const te of timeEntries) {
    await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: te.employeeId,
        type: te.type,
        startAt: te.s,
        endAt: te.e,
        status: te.status,
        approvedBy: te.approvedBy,
      },
    });
  }
  console.log(`→ ${timeEntries.length} time entries seeded`);

  // 9. Leaves — 5 (approved, pending, rejected flows)
  const leaves = [
    {
      email: "rina.marlina@saasdesk.id",
      type: "sick",
      startOffset: -2,
      endOffset: 1,
      status: "approved",
      reason: "Sakit flu, surat dokter terlampir",
      approvedBy: user.id,
    },
    {
      email: "dewi.lestari@saasdesk.id",
      type: "vacation",
      startOffset: 7,
      endOffset: 9,
      status: "pending",
      reason: "Libur keluarga ke Bali",
      approvedBy: null,
    },
    {
      email: "budi.santoso@saasdesk.id",
      type: "vacation",
      startOffset: 14,
      endOffset: 16,
      status: "pending",
      reason: "Cuti tahunan",
      approvedBy: null,
    },
    {
      email: "hendra.saputra@saasdesk.id",
      type: "sick",
      startOffset: -5,
      endOffset: -4,
      status: "approved",
      reason: "Demam",
      approvedBy: user.id,
    },
    {
      email: "maya.anggraini@saasdesk.id",
      type: "personal",
      startOffset: 3,
      endOffset: 3,
      status: "rejected",
      reason: "Keperluan keluarga mendadak",
      approvedBy: user.id,
    },
  ];
  for (const l of leaves) {
    const empId = empByEmail[l.email];
    if (!empId) continue;
    await prisma.leave.create({
      data: {
        tenantId,
        employeeId: empId,
        type: l.type,
        startDate: new Date(Date.now() + l.startOffset * 86400000)
          .toISOString()
          .slice(0, 10),
        endDate: new Date(Date.now() + l.endOffset * 86400000)
          .toISOString()
          .slice(0, 10),
        status: l.status,
        reason: l.reason,
        approvedBy: l.approvedBy,
      },
    });
  }
  console.log(`→ ${leaves.length} leaves seeded`);

  // 10. Events — 6 (meeting, payroll, holiday, onboarding)
  const events = [
    {
      title: "All-Hands Q3 Planning",
      location: "Jakarta HQ - Room A",
      startAt: new Date(Date.now() + 3 * 86400000),
      endAt: new Date(Date.now() + 3 * 86400000 + 2 * 3600000),
      type: "meeting",
    },
    {
      title: "Payroll Cutoff Agustus 2026",
      location: null,
      startAt: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
      endAt: null,
      type: "payroll",
    },
    {
      title: "1-on-1: Budi & Sinta",
      location: "Google Meet",
      startAt: new Date(Date.now() + 1 * 86400000),
      endAt: new Date(Date.now() + 1 * 86400000 + 3600000),
      type: "meeting",
    },
    {
      title: "Onboarding: Kevin Tan",
      location: "Jakarta HQ",
      startAt: new Date(Date.now() + 2 * 86400000),
      endAt: new Date(Date.now() + 2 * 86400000 + 4 * 3600000),
      type: "onboarding",
    },
    {
      title: "Libur Nasional - Kemerdekaan",
      location: "WFH",
      startAt: new Date(new Date().getFullYear(), 7, 17),
      endAt: null,
      type: "holiday",
    },
    {
      title: "Sprint Demo — Payroll Engine",
      location: "Jakarta HQ - Room B",
      startAt: new Date(Date.now() + 6 * 86400000),
      endAt: new Date(Date.now() + 6 * 86400000 + 90 * 60000),
      type: "meeting",
    },
  ];
  for (const ev of events) {
    await prisma.event.create({
      data: {
        tenantId,
        title: ev.title,
        location: ev.location,
        startAt: ev.startAt,
        endAt: ev.endAt as any,
        type: ev.type,
      } as any,
    });
  }
  console.log(`→ ${events.length} events seeded`);

  // 11. Subscription & Invoices — professional monthly, 3 invoices covering flow
  const toLocalDate = (d: Date) => d.toLocaleDateString("en-CA");
  const periodStart = toLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const periodEnd = toLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
  );
  const subscription = await prisma.subscription.upsert({
    where: { tenantId },
    update: {
      plan: "professional",
      status: "active",
      billingInterval: "monthly",
      seats: 15,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      renewsAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
    create: {
      tenantId,
      plan: "professional",
      status: "active",
      billingInterval: "monthly",
      seats: 15,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      renewsAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
  });
  console.log(
    `→ subscription ${subscription.id} professional monthly seats=15`,
  );

  const invoiceAmount = 29900000;
  const lastPeriodStart = toLocalDate(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const lastPeriodEnd = toLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 0),
  );
  const nextPeriodStart = toLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
  );
  const nextPeriodEnd = toLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 2, 0),
  );

  await prisma.invoice.create({
    data: {
      tenantId,
      subscriptionId: subscription.id,
      amount: invoiceAmount,
      status: "paid",
      billingInterval: "monthly",
      periodStart: lastPeriodStart,
      periodEnd: lastPeriodEnd,
      idempotencyKey: idempotencyKey(
        `invoice:${lastPeriodStart}:${lastPeriodEnd}`,
      ),
    },
  });
  await prisma.invoice.create({
    data: {
      tenantId,
      subscriptionId: subscription.id,
      amount: invoiceAmount,
      status: "open",
      billingInterval: "monthly",
      periodStart,
      periodEnd,
      idempotencyKey: idempotencyKey(`invoice:${periodStart}:${periodEnd}`),
    },
  });
  await prisma.invoice.create({
    data: {
      tenantId,
      subscriptionId: subscription.id,
      amount: invoiceAmount,
      status: "open",
      billingInterval: "monthly",
      periodStart: nextPeriodStart,
      periodEnd: nextPeriodEnd,
      idempotencyKey: idempotencyKey(`invoice:next:${nextPeriodStart}`),
    },
  });
  console.log("→ 3 invoices seeded (paid + open + next)");

  // 12. PayRuns — 3 months, engine-generated for correctness (draft → locked flow)
  const payPeriods = [
    {
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      end: new Date(now.getFullYear(), now.getMonth() - 1, 0),
      status: "locked" as const,
    },
    {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0),
      status: "locked" as const,
    },
    {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      status: "draft" as const,
    },
  ];
  const payRunIds: string[] = [];
  for (const pp of payPeriods) {
    const pStart = toLocalDate(pp.start);
    const pEnd = toLocalDate(pp.end);
    const idem = idempotencyKey(`payrun:${pStart}:${pEnd}`);

    // Build engine input: active employees only, deductions 0 (engine computes tax)
    const engineEmployees = activeEmployeeIds.map((eid) => {
      const emp = createdEmployees.find((e) => e.id === eid)!;
      return {
        employeeId: eid as any,
        tenantId: tenantId as any,
        gross: cents(emp.compensation),
        deductions: cents(0),
      };
    });

    const result = runPayroll({
      tenantId: tenantId as any,
      periodStart: pStart,
      periodEnd: pEnd,
      entityId: "default",
      employees: engineEmployees,
      taxBrackets: US_2026_SINGLE_BRACKETS,
      idempotencyKey: idem,
    });

    // Persist PayRun + Payslips + PayItems from engine result (ensures gross === tax+deductions+net)
    const payRun = await prisma.payRun.create({
      data: {
        tenantId,
        entityId: "default",
        periodStart: pStart,
        periodEnd: pEnd,
        status: pp.status,
        idempotencyKey: idem,
      },
    });
    payRunIds.push(payRun.id);

    for (const slip of result.payslips) {
      const payslip = await prisma.payslip.create({
        data: {
          tenantId,
          payRunId: payRun.id,
          employeeId: slip.employeeId as string,
          gross: slip.gross as unknown as number,
          deductions: slip.deductions as unknown as number,
          tax: slip.tax as unknown as number,
          net: slip.net as unknown as number,
        },
      });
      for (const it of slip.items) {
        await prisma.payItem.create({
          data: {
            tenantId,
            payslipId: payslip.id,
            payRunId: payRun.id,
            category: it.category,
            amount: it.amount as unknown as number,
            label: it.label,
          },
        });
      }
    }
    console.log(
      `→ payRun ${payRun.id} ${pStart}→${pEnd} status=${pp.status} (${result.payslips.length} payslips, totals gross=${result.totals.gross})`,
    );
  }

  // 13. Integration Connections + Syncs — real adapter lifecycle
  const connSlack = await prisma.integrationConnection.create({
    data: {
      tenantId,
      provider: "slack",
      status: "connected",
      credentialsEnc: encrypt(
        JSON.stringify({ token: "xoxb-fake-mgalihpp", team: "T123" }),
      ),
      configJson: JSON.stringify({
        channel: "#hr-notifications",
        notifyPayrun: true,
      }),
      lastSyncAt: new Date(),
    },
  });
  const connCal = await prisma.integrationConnection.create({
    data: {
      tenantId,
      provider: "google_calendar",
      status: "pending",
      credentialsEnc: encrypt(JSON.stringify({})),
      configJson: JSON.stringify({ calendarId: "primary", syncEvents: true }),
    },
  });
  const connXero = await prisma.integrationConnection.create({
    data: {
      tenantId,
      provider: "xero",
      status: "disconnected",
      credentialsEnc: encrypt(JSON.stringify({} as any)),
      configJson: JSON.stringify({ tenant: "demo" }),
    },
  });
  console.log("→ 3 integration connections seeded");

  const syncs = [
    {
      connectionId: connSlack.id,
      provider: "slack",
      direction: "outbound",
      status: "success",
      payload: { text: "Payrun July locked" },
    },
    {
      connectionId: connSlack.id,
      provider: "slack",
      direction: "outbound",
      status: "pending",
      payload: { text: "Payrun August draft" },
    },
    {
      connectionId: connCal.id,
      provider: "google_calendar",
      direction: "inbound",
      status: "success",
      payload: { events: 6 },
    },
    {
      connectionId: connCal.id,
      provider: "google_calendar",
      direction: "inbound",
      status: "failed",
      payload: { error: "rate_limited" },
      error: "429 rate limited",
    },
    {
      connectionId: connXero.id,
      provider: "xero",
      direction: "outbound",
      status: "failed",
      payload: { invoice: "inv_1" },
      error: "auth revoked",
    },
  ];
  for (let i = 0; i < syncs.length; i++) {
    const s = syncs[i];
    await prisma.integrationSync.create({
      data: {
        tenantId,
        connectionId: s.connectionId,
        provider: s.provider,
        direction: (s as any).direction,
        status: s.status,
        idempotencyKey: idempotencyKey(`sync:${s.provider}:${i}:${Date.now()}`),
        payloadJson: JSON.stringify((s as any).payload),
        error: (s as any).error ?? null,
        retryCount: s.status === "failed" ? 2 : 0,
        nextRetryAt:
          s.status === "failed" ? new Date(Date.now() + 3600000) : null,
      },
    });
  }
  console.log(`→ ${syncs.length} integration syncs seeded`);

  // 14. Audit Logs — full coverage of all action types (defensive: all now in AUDIT_ACTIONS)
  const audits = [
    {
      action: "employee.create",
      targetType: "employee",
      targetId: empByEmail["budi.santoso@saasdesk.id"],
      metadata: JSON.stringify({ by: user.email }),
    },
    {
      action: "employee.create",
      targetType: "employee",
      targetId: empByEmail["kevin.tan@saasdesk.id"],
      metadata: JSON.stringify({ by: user.email }),
    },
    {
      action: "payrun.create",
      targetType: "payrun",
      targetId: payRunIds[1],
      metadata: JSON.stringify({
        period: `${toLocalDate(payPeriods[1].start)}:${toLocalDate(payPeriods[1].end)}`,
      }),
    },
    {
      action: "payroll.run",
      targetType: "pay_run",
      targetId: payRunIds[0],
      metadata: JSON.stringify({
        period: `${toLocalDate(payPeriods[0].start)}:${toLocalDate(payPeriods[0].end)}`,
        legacy: true,
      }),
    },
    {
      action: "payrun.lock",
      targetType: "payrun",
      targetId: payRunIds[0],
      metadata: JSON.stringify({ lockedBy: user.email }),
    },
    {
      action: "tenant.update",
      targetType: "tenant",
      targetId: tenantId,
      metadata: JSON.stringify({ plan: "professional" }),
    },
    {
      action: "billing.upsertSubscription",
      targetType: "subscription",
      targetId: subscription.id,
      metadata: JSON.stringify({ plan: "professional", seats: 15 }),
    },
    {
      action: "billing.createInvoice",
      targetType: "invoice",
      targetId: subscription.id,
      metadata: JSON.stringify({ amount: invoiceAmount }),
    },
    {
      action: "integration.connect",
      targetType: "integration_connection",
      targetId: connSlack.id,
      metadata: JSON.stringify({ provider: "slack" }),
    },
    {
      action: "integration.disconnect",
      targetType: "integration_connection",
      targetId: connXero.id,
      metadata: JSON.stringify({ provider: "xero" }),
    },
    {
      action: "integration.trigger",
      targetType: "integration_sync",
      targetId: connSlack.id,
      metadata: JSON.stringify({ provider: "slack", direction: "outbound" }),
    },
    {
      action: "integration.ingestWebhook",
      targetType: "integration_sync",
      targetId: connCal.id,
      metadata: JSON.stringify({ provider: "google_calendar" }),
    },
    {
      action: "integration.retrySync",
      targetType: "integration_sync",
      targetId: connCal.id,
      metadata: JSON.stringify({ retryCount: 2 }),
    },
    {
      action: "reporting.export",
      targetType: "reporting",
      targetId: tenantId,
      metadata: JSON.stringify({
        from: toLocalDate(payPeriods[1].start),
        to: toLocalDate(payPeriods[1].end),
        format: "csv",
      }),
    },
  ];
  for (const a of audits) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: user.id,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId,
        metadata: a.metadata,
      },
    });
  }
  console.log(`→ ${audits.length} audit logs seeded`);

  // Summary
  console.log("\n=== SEED SUMMARY ===");
  console.log(`User       : ${user.name} (${user.email}) id=${user.id}`);
  console.log(
    `Org/Tenant : ${organization.name} (${organization.slug}) id=${tenantId}`,
  );
  console.log(`Login      : email=${user.email} password=${SEED_PASSWORD}`);
  console.log(
    `Departments: ${departmentsData.length}, Employees: ${createdEmployees.length} (active ${activeEmployeeIds.length})`,
  );
  console.log(
    `Jobs: ${jobIds.length}, Candidates: ${candidateIds.length}, Interviews: ${interviewsSeed.length}`,
  );
  console.log(
    `TimeEntries: ${timeEntries.length}, Leaves: ${leaves.length}, Events: ${events.length}`,
  );
  console.log(
    `PayRuns: ${payRunIds.length} (each ${activeEmployeeIds.length} payslips)`,
  );
  console.log(
    `Billing: sub=${subscription.id} invoices=3, Integrations: 3 conns + ${syncs.length} syncs, AuditLogs: ${audits.length}`,
  );
  console.log("Done. Tenant ready at /dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
