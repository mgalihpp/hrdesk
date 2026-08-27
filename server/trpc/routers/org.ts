import { z } from "zod";
import type { Role } from "@/lib/types";
import { orgRepo } from "../../repo/org";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

const updateSchema = z.object({
  plan: z.enum(["free", "growth", "scale"]).optional(),
  taxLocale: z.enum(["US", "ID"]).optional(),
  brandingName: z.string().optional(),
  brandingLogoUrl: z.string().optional(),
});

export const orgRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => {
    const repo = orgRepo(ctx.prisma, ctx.session.tenantId);
    return repo.get();
  }),
  update: rbacAnyProcedure(WRITE_ROLES)
    .input(updateSchema)
    .mutation(({ ctx, input }) => {
      const repo = orgRepo(ctx.prisma, ctx.session.tenantId);
      return repo.update(input);
    }),
});
