import { createTRPCRouter, protectedProcedure, rbacProcedure } from "../init";

export const meRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ctx.session),
  requireOwner: rbacProcedure("owner").query(() => ({ ok: true as const })),
});
