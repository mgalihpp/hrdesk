import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";

export const appRouter = createTRPCRouter({
  health: publicProcedure.input(z.object({}).optional()).query(() => ({
    status: "pong" as const,
    ts: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
