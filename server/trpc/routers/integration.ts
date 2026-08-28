import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  INTEGRATION_CATALOG,
  isKnownProvider,
} from "@/lib/integrations/registry";
import type { IntegrationConnectionId, IntegrationSyncId } from "@/lib/types";
import { integrationRepo } from "@/server/repo/integration";
import {
  createTRPCRouter,
  protectedProcedure,
  rbacAnyProcedure,
} from "../init";

export const integrationRouter = createTRPCRouter({
  catalog: protectedProcedure.query(() => INTEGRATION_CATALOG),

  listConnections: protectedProcedure.query(({ ctx }) => {
    return integrationRepo(ctx.prisma, ctx.session.tenantId).listConnections();
  }),

  getConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return integrationRepo(
        ctx.prisma,
        ctx.session.tenantId,
      ).getConnectionById(input.id as IntegrationConnectionId);
    }),

  connect: rbacAnyProcedure(["owner", "admin"])
    .input(
      z.object({
        provider: z.string(),
        credentials: z.record(z.string(), z.unknown()).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!isKnownProvider(input.provider)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown provider: ${input.provider}`,
        });
      }
      return integrationRepo(ctx.prisma, ctx.session.tenantId).upsertConnection(
        {
          provider: input.provider as unknown as never,
          credentials: (input.credentials ?? null) as unknown as Record<
            string,
            unknown
          > | null,
          config: (input.config ?? null) as unknown as Record<
            string,
            unknown
          > | null,
        },
      );
    }),

  disconnect: rbacAnyProcedure(["owner", "admin"])
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return integrationRepo(ctx.prisma, ctx.session.tenantId).disconnect(
        input.id as IntegrationConnectionId,
      );
    }),

  listSyncs: protectedProcedure
    .input(z.object({ connectionId: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      return integrationRepo(ctx.prisma, ctx.session.tenantId).listSyncs(
        input?.connectionId as IntegrationSyncId | undefined as unknown as
          | IntegrationConnectionId
          | undefined,
      );
    }),

  triggerSync: rbacAnyProcedure(["owner", "admin"])
    .input(
      z.object({
        connectionId: z.string(),
        direction: z.enum(["inbound", "outbound"]).default("outbound"),
        payload: z.record(z.string(), z.unknown()).optional(),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return integrationRepo(ctx.prisma, ctx.session.tenantId).createSync({
        connectionId: input.connectionId as IntegrationConnectionId,
        direction: input.direction as unknown as never,
        payload: input.payload as unknown as
          | Record<string, unknown>
          | undefined,
        idempotencyKey: input.idempotencyKey ?? null,
      });
    }),

  ingestWebhook: rbacAnyProcedure(["owner", "admin"])
    .input(
      z.object({
        provider: z.string(),
        externalId: z.string().optional(),
        payload: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!isKnownProvider(input.provider)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown provider: ${input.provider}`,
        });
      }
      return integrationRepo(ctx.prisma, ctx.session.tenantId).ingestWebhook({
        provider: input.provider as unknown as never,
        externalId: input.externalId,
        payload: input.payload as unknown as Record<string, unknown>,
      });
    }),

  retrySync: rbacAnyProcedure(["owner", "admin"])
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return integrationRepo(ctx.prisma, ctx.session.tenantId).updateSyncStatus(
        input.id as IntegrationSyncId,
        "pending",
      );
    }),
});
