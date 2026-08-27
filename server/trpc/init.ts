import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import type { Role, SessionUser, TenantId, TRPCContext } from "@/lib/types";

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const createTRPCContext = async ({
  headers,
}: {
  headers: Headers;
}): Promise<TRPCContext> => {
  const s = await auth.api.getSession({ headers });
  if (!s?.session) return { session: null };
  const tenantId = s.session.activeOrganizationId;
  if (!tenantId) return { session: null };
  let role: string | undefined;
  try {
    const res = await auth.api.getActiveMemberRole({ headers });
    role = res.role;
  } catch {
    return { session: null };
  }
  if (!role) return { session: null };
  const roles: Role[] = [role as Role];
  return {
    session: {
      id: s.user.id,
      tenantId: tenantId as TenantId,
      roles,
    } satisfies SessionUser,
  };
};

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const rbacProcedure = (role: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.session.roles.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });
