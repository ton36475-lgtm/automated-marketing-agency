import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import HubSpotService, { saveHubSpotIntegration, getHubSpotIntegration, disconnectHubSpot } from "../integrations/hubspotService";
import MetaAdsService, { saveMetaAdsIntegration, getMetaAdsIntegration, disconnectMetaAds } from "../integrations/metaAdsService";
import { TRPCError } from "@trpc/server";

// OAuth config from environment
const HUBSPOT_CONFIG = {
  clientId: process.env.HUBSPOT_CLIENT_ID || "",
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET || "",
  redirectUri: process.env.HUBSPOT_REDIRECT_URI || "",
};

const META_CONFIG = {
  appId: process.env.META_APP_ID || "",
  appSecret: process.env.META_APP_SECRET || "",
  redirectUri: process.env.META_REDIRECT_URI || "",
};

export const integrationRouter = router({
  // ─── HubSpot OAuth ────────────────────────────────────────────────────────
  hubspot: router({
    /**
     * Get HubSpot authorization URL
     */
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      const hubspot = new HubSpotService(HUBSPOT_CONFIG);
      const state = `${ctx.user.id}_${Date.now()}`;
      return {
        url: hubspot.getAuthorizationUrl(state),
        state,
      };
    }),

    /**
     * Handle HubSpot OAuth callback
     */
    callback: publicProcedure
      .input(
        z.object({
          code: z.string(),
          state: z.string(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const hubspot = new HubSpotService(HUBSPOT_CONFIG);
          const { accessToken } = await hubspot.exchangeCodeForToken(input.code);

          // Verify connection
          hubspot.setAccessToken(accessToken);
          const verification = await hubspot.verifyConnection();

          if (!verification.valid) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to verify HubSpot connection",
            });
          }

          // Save to database
          await saveHubSpotIntegration(input.userId, accessToken);

          return { success: true, message: "HubSpot connected successfully" };
        } catch (error) {
          console.error("[Integration] HubSpot callback error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to connect HubSpot",
          });
        }
      }),

    /**
     * Get HubSpot connection status
     */
    status: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getHubSpotIntegration(ctx.user.id);
      return {
        connected: settings?.isHubspotConnected || false,
        portalId: settings?.hubspotPortalId || null,
      };
    }),

    /**
     * Disconnect HubSpot
     */
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await disconnectHubSpot(ctx.user.id);
      return { success: true, message: "HubSpot disconnected" };
    }),

    /**
     * Sync leads from HubSpot
     */
    syncLeads: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const settings = await getHubSpotIntegration(ctx.user.id);

        if (!settings?.hubspotApiKey || !settings.isHubspotConnected) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "HubSpot not connected",
          });
        }

        try {
          const hubspot = new HubSpotService(HUBSPOT_CONFIG);
          hubspot.setAccessToken(settings.hubspotApiKey);

          const { contacts } = await hubspot.getContacts(input.limit);

          return {
            success: true,
            count: contacts.length,
            leads: contacts,
          };
        } catch (error) {
          console.error("[Integration] HubSpot sync error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to sync leads from HubSpot",
          });
        }
      }),
  }),

  // ─── Meta Ads OAuth ──────────────────────────────────────────────────────
  metaAds: router({
    /**
     * Get Meta Ads authorization URL
     */
    getAuthUrl: protectedProcedure.query(({ ctx }) => {
      const meta = new MetaAdsService(META_CONFIG);
      const state = `${ctx.user.id}_${Date.now()}`;
      return {
        url: meta.getAuthorizationUrl(state),
        state,
      };
    }),

    /**
     * Handle Meta Ads OAuth callback
     */
    callback: publicProcedure
      .input(
        z.object({
          code: z.string(),
          state: z.string(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const meta = new MetaAdsService(META_CONFIG);
          const { accessToken } = await meta.exchangeCodeForToken(input.code);

          // Get ad accounts
          meta.setCredentials(accessToken, "");
          const accounts = await meta.getAdAccounts();

          if (accounts.length === 0) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "No ad accounts found",
            });
          }

          // Save first account by default
          await saveMetaAdsIntegration(input.userId, accessToken, accounts[0].id);

          return {
            success: true,
            message: "Meta Ads connected successfully",
            accounts,
          };
        } catch (error) {
          console.error("[Integration] Meta Ads callback error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to connect Meta Ads",
          });
        }
      }),

    /**
     * Get Meta Ads connection status
     */
    status: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getMetaAdsIntegration(ctx.user.id);
      return {
        connected: settings?.isMetaConnected || false,
        adAccountId: settings?.metaAdAccountId || null,
      };
    }),

    /**
     * Get available ad accounts
     */
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getMetaAdsIntegration(ctx.user.id);

      if (!settings?.metaAccessToken || !settings.isMetaConnected) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Meta Ads not connected",
        });
      }

      try {
        const meta = new MetaAdsService(META_CONFIG);
        meta.setCredentials(settings.metaAccessToken, settings.metaAdAccountId || "");

        const accounts = await meta.getAdAccounts();
        return { accounts };
      } catch (error) {
        console.error("[Integration] Failed to get Meta accounts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch ad accounts",
        });
      }
    }),

    /**
     * Switch ad account
     */
    switchAccount: protectedProcedure
      .input(z.object({ adAccountId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const settings = await getMetaAdsIntegration(ctx.user.id);

        if (!settings?.metaAccessToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Meta Ads not connected",
          });
        }

        await saveMetaAdsIntegration(ctx.user.id, settings.metaAccessToken, input.adAccountId);

        return { success: true, message: "Ad account switched" };
      }),

    /**
     * Disconnect Meta Ads
     */
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await disconnectMetaAds(ctx.user.id);
      return { success: true, message: "Meta Ads disconnected" };
    }),
  }),

  // ─── Integration Status ──────────────────────────────────────────────────
  status: protectedProcedure.query(async ({ ctx }) => {
    const hubspotSettings = await getHubSpotIntegration(ctx.user.id);
    const metaSettings = await getMetaAdsIntegration(ctx.user.id);

    return {
      hubspot: {
        connected: hubspotSettings?.isHubspotConnected || false,
        portalId: hubspotSettings?.hubspotPortalId || null,
      },
      metaAds: {
        connected: metaSettings?.isMetaConnected || false,
        adAccountId: metaSettings?.metaAdAccountId || null,
      },
    };
  }),
});
