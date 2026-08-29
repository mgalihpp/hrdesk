import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, TenantId, TRPCContext } from "@/lib/types";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions | { headers: Headers },
): Promise<TRPCContext> => {
  const headers =
    (opts as FetchCreateContextFnOptions).req?.headers ??
    (opts as { headers: Headers }).headers;
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
