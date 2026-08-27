import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { meRouter } from "./me";

export const appRouter = createTRPCRouter({
  health: publicProcedure
    .input(z.object({}).optional())
    .query(() => ({ status: "pong" as const, ts: new Date().toISOString() })),
  me: meRouter,
});

export type AppRouter = typeof appRouter;
