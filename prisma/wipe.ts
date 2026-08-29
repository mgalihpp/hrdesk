import { prisma } from "../lib/prisma";

async function wipe() {
  console.log("== WIPE hrdesk — delete all collections ==");
  // Order: leaf -> root, to avoid orphan references (Mongo no FK but logical)
  const ops: Array<[string, () => Promise<unknown>]> = [
    ["PayItem", () => prisma.payItem.deleteMany({})],
    ["Payslip", () => prisma.payslip.deleteMany({})],
    ["PayRun", () => prisma.payRun.deleteMany({})],
    ["TimeEntry", () => prisma.timeEntry.deleteMany({})],
    ["Leave", () => prisma.leave.deleteMany({})],
    ["Event", () => prisma.event.deleteMany({})],
    ["Interview", () => prisma.interview.deleteMany({})],
    ["Candidate", () => prisma.candidate.deleteMany({})],
    ["Job", () => prisma.job.deleteMany({})],
    ["Invoice", () => prisma.invoice.deleteMany({})],
    ["Subscription", () => prisma.subscription.deleteMany({})],
    ["IntegrationSync", () => prisma.integrationSync.deleteMany({})],
    [
      "IntegrationConnection",
      () => prisma.integrationConnection.deleteMany({}),
    ],
    ["AuditLog", () => prisma.auditLog.deleteMany({})],
    ["Department", () => prisma.department.deleteMany({})],
    ["Employee", () => prisma.employee.deleteMany({})],
    ["Tenant", () => prisma.tenant.deleteMany({})],
    // Auth / Org
    ["Invitation", () => prisma.invitation.deleteMany({})],
    ["Member", () => prisma.member.deleteMany({})],
    ["Organization", () => prisma.organization.deleteMany({})],
    ["Verification", () => prisma.verification.deleteMany({})],
    ["Session", () => prisma.session.deleteMany({})],
    ["Account", () => prisma.account.deleteMany({})],
    ["User", () => prisma.user.deleteMany({})],
  ];

  for (const [name, fn] of ops) {
    try {
      const res = (await fn()) as { count: number };
      console.log(`  ✓ ${name}: deleted ${res.count}`);
    } catch (e) {
      console.error(`  ✗ ${name} failed:`, (e as Error).message);
    }
  }
  console.log("WIPE done — database empty");
}

wipe()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
