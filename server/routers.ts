import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  runCompetitorAnalysisAgent,
  runCopywritingAgent,
  runLeadScoringAgent,
  runMediaBuyingAgent,
  runOptimizationAgent,
  runStrategyAgent,
  runVisualAgent,
} from "./agentEngine";
import { integrationRouter as oauthIntegrationRouter } from "./routers/integrationRouter";
import {
  createAdCreative,
  createCampaign,
  createCompetitorData,
  createLead,
  createOptimizationRule,
  deleteCampaign,
  deleteCompetitorData,
  deleteLead,
  getAdCreativesByCampaign,
  getAdCreativesByUserId,
  getAgentActivityLog,
  getAgentTasksByUserId,
  getAnalyticsByCampaign,
  getCampaignById,
  getCampaignsByUserId,
  getCompetitorsByUserId,
  getDashboardStats,
  getIntegrationSettings,
  getLeadsByUserId,
  getOptimizationRulesByUserId,
  updateAdCreative,
  updateCampaign,
  updateLead,
  updateOptimizationRule,
  upsertIntegrationSettings,
} from "./db";

// ─── Campaign Router ──────────────────────────────────────────────────────────
const campaignRouter = router({
  list: protectedProcedure.query(({ ctx }) => getCampaignsByUserId(ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        objective: z.string().optional(),
        budget: z.string().optional(),
        targetAudience: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await createCampaign({ ...input, userId: ctx.user.id, status: "draft" });
      return campaign;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        objective: z.string().optional(),
        status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
        budget: z.string().optional(),
        targetAudience: z.string().optional(),
        strategyBrief: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const campaign = await getCampaignById(id);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await updateCampaign(id, data);
      return campaign;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.id);
      if (!campaign || campaign.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteCampaign(input.id);
      return { success: true };
    }),
});

// ─── Agent Router ─────────────────────────────────────────────────────────────
const agentRouter = router({
  tasks: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ ctx, input }) => getAgentTasksByUserId(ctx.user.id, input.limit ?? 50)),

  activityLog: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ ctx, input }) => getAgentActivityLog(ctx.user.id, input.limit ?? 50)),

  runStrategy: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        product: z.string(),
        targetMarket: z.string().optional(),
        budget: z.number().optional(),
        competitors: z.array(z.string()).optional(),
        objectives: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...payload } = input;
      return runStrategyAgent({
        userId: ctx.user.id,
        campaignId,
        taskType: "market_strategy",
        payload: payload as Record<string, unknown>,
      });
    }),

  runCopywriting: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        product: z.string(),
        audience: z.string().optional(),
        tone: z.string().optional(),
        platform: z.string().optional(),
        strategy: z.string().optional(),
        variants: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...payload } = input;
      return runCopywritingAgent({
        userId: ctx.user.id,
        campaignId,
        taskType: "generate_copy",
        payload: payload as Record<string, unknown>,
      });
    }),

  runVisual: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        prompt: z.string(),
        style: z.string().optional(),
        brand: z.string().optional(),
        platform: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...payload } = input;
      return runVisualAgent({
        userId: ctx.user.id,
        campaignId,
        taskType: "generate_visual",
        payload: payload as Record<string, unknown>,
      });
    }),

  runMediaBuying: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        budget: z.number().optional(),
        objective: z.string().optional(),
        audience: z.string().optional(),
        campaignName: z.string().optional(),
        strategy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...payload } = input;
      return runMediaBuyingAgent({
        userId: ctx.user.id,
        campaignId,
        taskType: "media_buying_plan",
        payload: payload as Record<string, unknown>,
      });
    }),

  runOptimization: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        metrics: z.record(z.string(), z.number()).optional(),
        rules: z.array(z.record(z.string(), z.unknown())).optional(),
        campaignData: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, ...payload } = input;
      return runOptimizationAgent({
        userId: ctx.user.id,
        campaignId,
        taskType: "optimization_analysis",
        payload: payload as Record<string, unknown>,
      });
    }),

  runCompetitorAnalysis: protectedProcedure
    .input(
      z.object({
        competitorName: z.string(),
        website: z.string().optional(),
        industry: z.string().optional(),
        ourProduct: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return runCompetitorAnalysisAgent({
        userId: ctx.user.id,
        taskType: "competitor_analysis",
        payload: input as Record<string, unknown>,
      });
    }),

  scoreLeads: protectedProcedure
    .input(z.object({ leadId: z.number(), lead: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await runLeadScoringAgent({
        userId: ctx.user.id,
        taskType: "lead_scoring",
        payload: { lead: input.lead },
      });
      // Update the lead with score
      const classification = result.result.classification as string;
      const statusMap: Record<string, "hot" | "warm" | "cold"> = {
        hot: "hot",
        warm: "warm",
        cold: "cold",
      };
      await updateLead(input.leadId, {
        score: result.result.score as number,
        scoreReason: result.result.reason as string,
        status: statusMap[classification] || "warm",
      });
      return result;
    }),
});

// ─── Creative Router ──────────────────────────────────────────────────────────
const creativeRouter = router({
  list: protectedProcedure.query(({ ctx }) => getAdCreativesByUserId(ctx.user.id)),

  byCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(({ ctx, input }) => getAdCreativesByCampaign(input.campaignId)),

  create: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        type: z.enum(["image", "copy", "headline", "cta", "video_script", "carousel"]),
        platform: z.enum(["meta", "google", "tiktok", "line", "general"]).optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        imagePrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createAdCreative({ ...input, userId: ctx.user.id });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "approved", "rejected", "active", "archived"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateAdCreative(input.id, { status: input.status });
    }),
});

// ─── Lead Router ──────────────────────────────────────────────────────────────
const leadRouter = router({
  list: protectedProcedure.query(({ ctx }) => getLeadsByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        source: z.string().optional(),
        campaignId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createLead({ ...input, userId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "attempting", "connected", "qualified", "hot", "warm", "cold", "converted", "lost"]).optional(),
        score: z.number().optional(),
        notes: z.string().optional(),
        hubspotId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateLead(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteLead(input.id)),
});

// ─── Analytics Router ─────────────────────────────────────────────────────────
const analyticsRouter = router({
  byCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number(), from: z.date().optional(), to: z.date().optional() }))
    .query(({ ctx, input }) => getAnalyticsByCampaign(input.campaignId, input.from, input.to)),

  dashboard: protectedProcedure.query(({ ctx }) => getDashboardStats(ctx.user.id)),
});

// ─── Competitor Router ────────────────────────────────────────────────────────
const competitorRouter = router({
  list: protectedProcedure.query(({ ctx }) => getCompetitorsByUserId(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        competitorName: z.string(),
        website: z.string().optional(),
        industry: z.string().optional(),
        insights: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const competitor = await createCompetitorData({ ...input, userId: ctx.user.id });
      return competitor;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteCompetitorData(input.id);
      return { success: true };
    }),
});

// ─── Optimization Rules Router ────────────────────────────────────────────────
const optimizationRouter = router({
  rules: protectedProcedure.query(({ ctx }) => getOptimizationRulesByUserId(ctx.user.id)),

  createRule: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        ruleName: z.string(),
        ruleType: z.enum(["stop_loss", "scale_winners", "aggressive_scaling", "fight_fatigue", "custom"]),
        conditions: z.record(z.string(), z.unknown()),
        actions: z.record(z.string(), z.unknown()),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createOptimizationRule({ ...input, userId: ctx.user.id });
    }),

  toggleRule: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(({ ctx, input }) => updateOptimizationRule(input.id, { isActive: input.isActive })),
});

// ─── Integration Settings Router ──────────────────────────────────────────────
const integrationRouter = router({
  get: protectedProcedure.query(({ ctx }) => getIntegrationSettings(ctx.user.id)),

  save: protectedProcedure
    .input(
      z.object({
        hubspotApiKey: z.string().optional(),
        hubspotPortalId: z.string().optional(),
        metaAccessToken: z.string().optional(),
        metaAdAccountId: z.string().optional(),
        metaPixelId: z.string().optional(),
        isHubspotConnected: z.boolean().optional(),
        isMetaConnected: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertIntegrationSettings({ ...input, userId: ctx.user.id });
    }),
  
  // OAuth routes
  oauth: oauthIntegrationRouter,
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  campaign: campaignRouter,
  agent: agentRouter,
  creative: creativeRouter,
  lead: leadRouter,
  analytics: analyticsRouter,
  competitor: competitorRouter,
  optimization: optimizationRouter,
  integration: integrationRouter,
});

export type AppRouter = typeof appRouter;
