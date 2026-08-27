import { initTRPC } from "@trpc/server";
import type { TRPCContext } from "@/lib/types";

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const createTRPCContext = async (_opts: {
  headers: Headers;
}): Promise<TRPCContext> => {
  // Better Auth session bridge lands in PR-2.
  return { session: null };
};
