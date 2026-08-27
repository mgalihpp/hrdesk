import { z } from "zod";
import type { EmployeeId, Role } from "@/lib/types";
import { employeeRepo, type NewEmployee } from "../../repo/employee";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

const WRITE_ROLES: Role[] = ["owner", "admin", "hr"];

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  ssn: z.string().min(1),
  bank: z.string().min(1),
  compensation: z.number().int().nonnegative(),
  hireDate: z.string().min(1),
  status: z.enum(["active", "on_leave", "terminated"]),
});

const updateSchema = createSchema.partial();

export const employeeRouter = createTRPCRouter({
  create: rbacAnyProcedure(WRITE_ROLES)
    .input(createSchema)
    .mutation(({ ctx, input }) => {
      const repo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      return repo.create(input as NewEmployee);
    }),
  list: protectedProcedure.query(({ ctx }) => {
    const repo = employeeRepo(ctx.prisma, ctx.session.tenantId);
    return repo.list();
  }),
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const repo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      return repo.getById(input.id as EmployeeId);
    }),
  update: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string(), patch: updateSchema }))
    .mutation(({ ctx, input }) => {
      const repo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      return repo.update(input.id as EmployeeId, input.patch);
    }),
  remove: rbacAnyProcedure(WRITE_ROLES)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const repo = employeeRepo(ctx.prisma, ctx.session.tenantId);
      return repo.remove(input.id as EmployeeId);
    }),
});
