import { PrismaClient } from "@prisma/client";

// Single Prisma instance for domain models (Tenant, Employee). Better Auth and
// pay-run transactions use the native driver from lib/mongo.ts.
const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma._prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = prisma;
}
