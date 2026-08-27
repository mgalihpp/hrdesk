import type { PrismaClient } from "@prisma/client";
import type { Db } from "mongodb";
import { describe, expect, it } from "vitest";
import type { SessionUser, TenantId } from "@/lib/types";
import { appRouter } from "./routers/_app";

const tid = (s: string) => s as TenantId;

const fakeMongo = {
  collection: () => ({
    find: () => ({ toArray: async () => [] }),
    findOne: async () => null,
    insertOne: async () => ({ insertedId: "x" }),
    updateOne: async () => ({ modifiedCount: 0 }),
    deleteOne: async () => ({ deletedCount: 0 }),
  }),
} as unknown as Db;

const fakePrisma = {
  employee: {
    create: async () => ({}),
    findMany: async () => [],
    findFirst: async () => null,
    updateMany: async () => ({ count: 0 }),
    deleteMany: async () => ({ count: 0 }),
  },
  tenant: {
    findUnique: async () => null,
    create: async () => ({}),
    upsert: async () => ({}),
  },
} as unknown as PrismaClient;

const ownerSession: SessionUser = {
  id: "u1",
  tenantId: tid("org_a"),
  roles: ["owner"],
};
const employeeSession: SessionUser = {
  id: "u2",
  tenantId: tid("org_a"),
  roles: ["employee"],
};

describe("rbac", () => {
  it("rejects with no session", async () => {
    const caller = appRouter.createCaller({
      session: null,
      mongo: fakeMongo,
      prisma: fakePrisma,
    });
    await expect(caller.me.me()).rejects.toThrow(/UNAUTHORIZED/);
  });
  it("passes for owner", async () => {
    const caller = appRouter.createCaller({
      session: ownerSession,
      mongo: fakeMongo,
      prisma: fakePrisma,
    });
    const res = await caller.me.me();
    expect(res.tenantId).toBe("org_a");
  });
  it("rejects non-owner from owner-only", async () => {
    const caller = appRouter.createCaller({
      session: employeeSession,
      mongo: fakeMongo,
      prisma: fakePrisma,
    });
    await expect(caller.me.requireOwner()).rejects.toThrow(/FORBIDDEN/);
  });
});
