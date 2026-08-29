import { z } from "zod";
import type { DepartmentId, Role } from "@/lib/types";
import { departmentRepo } from "@/server/repo/department";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

const iconKeyEnum = z.enum([
  "engineering",
  "marketing",
  "product",
  "hr",
  "finance",
  "sales",
  "support",
  "legal",
  "operations",
  "design",
  "qa",
  "data",
]);

const locationEnum = z.enum(["HQ", "Branch", "Remote"]);
const statusEnum = z.enum(["Active", "Inactive"]);

const createSchema = z.object({
  name: z.string().min(1),
  iconKey: iconKeyEnum,
  headName: z.string().min(1),
  headEmail: z.string().email(),
  headAvatarUrl: z.string().optional().nullable(),
  location: locationEnum,
  activeEmployees: z.number().int().min(0).optional(),
  budgetUtil: z.number().int().min(0).max(100).optional(),
  status: statusEnum.optional(),
});

const updateSchema = createSchema.partial();

export const departmentRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(createSchema)
    .mutation(({ ctx, input }) => {
      const repo = departmentRepo(ctx.prisma, ctx.session.tenantId);
      return repo.create(input);
    }),

  list: protectedProcedure.query(({ ctx }) => {
    const repo = departmentRepo(ctx.prisma, ctx.session.tenantId);
    return repo.list();
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = departmentRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getById(input.id as DepartmentId);
    }),

  update: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string(), patch: updateSchema }))
    .mutation(({ ctx, input }) => {
      const repo = departmentRepo(ctx.prisma, ctx.session.tenantId);
      return repo.update(input.id as DepartmentId, input.patch);
    }),

  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const repo = departmentRepo(ctx.prisma, ctx.session.tenantId);
      return repo.remove(input.id as DepartmentId);
    }),
});
