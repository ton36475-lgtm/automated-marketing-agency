import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { initializeSeoModule, syncSeoData, getSeoStatus } from "../connectors/travobetSeoConnector";
import { initializeTradingModule, syncTradingData, getTradingStatus } from "../connectors/polymarketTradingConnector";
import { runCrossSystemAnalysis, getCrossSystemOverview, getAnalysisHistory } from "../connectors/crossSystemEngine";
import { getSystemModules } from "../db";

export const crossSystemRouter = router({
  // ─── System Modules ─────────────────────────────────────────────────────
  modules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getSystemModules(ctx.user.id);
    }),

    overview: protectedProcedure.query(async ({ ctx }) => {
      return getCrossSystemOverview(ctx.user.id);
    }),
  }),

  // ─── Travobet SEO ──────────────────────────────────────────────────────
  seo: router({
    initialize: protectedProcedure.mutation(async ({ ctx }) => {
      return initializeSeoModule(ctx.user.id);
    }),

    sync: protectedProcedure.mutation(async ({ ctx }) => {
      return syncSeoData(ctx.user.id);
    }),

    status: protectedProcedure.query(async ({ ctx }) => {
      return getSeoStatus(ctx.user.id);
    }),
  }),

  // ─── Polymarket Trading ────────────────────────────────────────────────
  trading: router({
    initialize: protectedProcedure.mutation(async ({ ctx }) => {
      return initializeTradingModule(ctx.user.id);
    }),

    sync: protectedProcedure.mutation(async ({ ctx }) => {
      return syncTradingData(ctx.user.id);
    }),

    status: protectedProcedure.query(async ({ ctx }) => {
      return getTradingStatus(ctx.user.id);
    }),
  }),

  // ─── Cross-System Analysis ─────────────────────────────────────────────
  analysis: router({
    run: protectedProcedure
      .input(z.object({
        type: z.enum(["cross_system_review", "synergy_analysis", "risk_assessment", "resource_optimization", "unified_report"]).default("cross_system_review"),
      }))
      .mutation(async ({ ctx, input }) => {
        return runCrossSystemAnalysis(ctx.user.id, input.type);
      }),

    latest: protectedProcedure.query(async ({ ctx }) => {
      const overview = await getCrossSystemOverview(ctx.user.id);
      return overview.latestAnalysis;
    }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ ctx, input }) => {
        return getAnalysisHistory(ctx.user.id, input.limit);
      }),
  }),
});
