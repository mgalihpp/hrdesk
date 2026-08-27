import { describe, expect, it } from "vitest";
import type { SessionUser, TenantId } from "@/lib/types";
import { appRouter } from "./routers/_app";

const tid = (s: string) => s as TenantId;

const session = (roles: SessionUser["roles"]): SessionUser => ({
  id: "u1",
  tenantId: tid("tenant-1"),
  roles,
});

describe("tRPC RBAC middleware", () => {
  it("throws UNAUTHORIZED when there is no session", async () => {
    const caller = appRouter.createCaller({ session: null });
    await expect(caller.me.me()).rejects.toThrow(/UNAUTHORIZED/);
  });

  it("lets an owner through the owner-only procedure", async () => {
    const caller = appRouter.createCaller({ session: session(["owner"]) });
    await expect(caller.me.requireOwner()).resolves.toEqual({ ok: true });
  });

  it("rejects a non-owner from the owner-only procedure", async () => {
    const caller = appRouter.createCaller({ session: session(["employee"]) });
    await expect(caller.me.requireOwner()).rejects.toThrow(/FORBIDDEN/);
  });
});
