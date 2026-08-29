import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, TenantId, TRPCContext } from "@/lib/types";

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const createTRPCContext = async ({
  headers,
}: {
  headers: Headers;
}): Promise<TRPCContext> => {
  const s = await auth.api.getSession({ headers });
  if (!s?.session) return { session: null, prisma };
  const tenantId = s.session.activeOrganizationId;
  if (!tenantId) return { session: null, prisma };
  let role: string | undefined;
  try {
    const res = await auth.api.getActiveMemberRole({ headers });
    role = res.role;
  } catch {
    return { session: null, prisma };
  }
  if (!role) return { session: null, prisma };
  const roles: Role[] = [role as Role];
  return {
    session: {
      id: s.user.id,
      tenantId: tenantId as TenantId,
      roles,
    },
    prisma,
  };
};

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { session: ctx.session, prisma: ctx.prisma } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const rbacProcedure = (role: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.session.roles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const rbacAnyProcedure = (roles: Role[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.session.roles.some((r) => roles.includes(r))) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
