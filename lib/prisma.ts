import { PrismaClient } from "@prisma/client";

// Single Prisma instance for the whole app: domain models (Tenant, Employee)
// and Better Auth. It replaces the native MongoDB driver that lib/mongo.ts used
// to provide.
const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma._prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = prisma;
}
