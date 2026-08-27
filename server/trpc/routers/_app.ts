import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { employeeRouter } from "./employee";
import { meRouter } from "./me";
import { orgRouter } from "./org";

export const appRouter = createTRPCRouter({
  health: publicProcedure
    .input(z.object({}).optional())
    .query(() => ({ status: "pong" as const, ts: new Date().toISOString() })),
  me: meRouter,
  org: orgRouter,
  employee: employeeRouter,
});

export type AppRouter = typeof appRouter;
