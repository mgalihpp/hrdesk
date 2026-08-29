import "server-only";

import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { headers } from "next/headers";
import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

const createCaller = createCallerFactory(appRouter);

export async function getServerTrpc() {
  const h = await headers();
  const ctx = await createTRPCContext({
    req: { headers: h },
  } as FetchCreateContextFnOptions);
  return createCaller(ctx);
}
