import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../init";
import { auditRouter } from "./audit";
import { billingRouter } from "./billing";
import { candidateRouter } from "./candidate";
import { employeeRouter } from "./employee";
import { integrationRouter } from "./integration";
import { jobRouter } from "./job";
import { meRouter } from "./me";
import { orgRouter } from "./org";
import { payrunRouter } from "./payrun";
import { reportingRouter } from "./reporting";
import { leaveRouter, timeEntryRouter } from "./timeEntry";
export const appRouter = createTRPCRouter({
  health: publicProcedure
    .input(z.object({}).optional())
    .query(() => ({ status: "pong" as const, ts: new Date().toISOString() })),
  me: meRouter,
  org: orgRouter,
  employee: employeeRouter,
  payrun: payrunRouter,
  timeEntry: timeEntryRouter,
  leave: leaveRouter,
  job: jobRouter,
  candidate: candidateRouter,
  billing: billingRouter,
  integration: integrationRouter,
  reporting: reportingRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
