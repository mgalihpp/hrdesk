import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAccessControl, organization } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

// Statements are the verbs our RBAC vocabulary allows. Every role is a subset.
const ac = createAccessControl({
  employee: ["create", "read", "update", "delete"],
  payroll: ["run", "read", "adjust"],
  org: ["read", "update", "invite"],
} as const);

const owner = ac.newRole({
  employee: ["create", "read", "update", "delete"],
  payroll: ["run", "read", "adjust"],
  org: ["read", "update", "invite"],
});
const admin = ac.newRole({
  employee: ["create", "read", "update", "delete"],
  payroll: ["read"],
  org: ["read", "update", "invite"],
});
const hr = ac.newRole({
  employee: ["create", "read", "update", "delete"],
  payroll: ["read"],
  org: ["read"],
});
const manager = ac.newRole({
  employee: ["read", "update"],
  payroll: ["read"],
  org: ["read"],
});
const employee = ac.newRole({
  employee: ["read"],
  payroll: ["read"],
  org: ["read"],
});
const payrollAdmin = ac.newRole({
  employee: ["read"],
  payroll: ["run", "read", "adjust"],
  org: ["read"],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    organization({
      ac,
      roles: { owner, admin, hr, manager, employee, payrollAdmin },
    }),
    nextCookies(),
  ],
});
