import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

export async function getServerTrpc() {
  const h = await headers();
  const ctx = await createTRPCContext({ headers: h });
  return createCaller(ctx);
}
