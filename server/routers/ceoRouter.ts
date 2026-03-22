import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getExecutiveGems,
  getExecutiveGemById,
  createExecutiveGem,
  updateExecutiveGem,
  deleteExecutiveGem,
  getCeoDecisions,
  getCeoDecisionById,
  updateCeoDecision,
  getBoardMeetings,
  getBoardMeetingById,
  getSystemDirectives,
  updateSystemDirective,
  getPerformanceSnapshots,
  getCeoDashboardStats,
} from "../db";
import {
  runCeoAnalysis,
  runBoardMeeting,
  issueCeoDirective,
  takePerformanceSnapshot,
  DEFAULT_GEMS,
} from "../ceoAgentEngine";

export const ceoRouter = router({
  // ─── Dashboard Stats ─────────────────────────────────────────────────────
  dashboard: protectedProcedure.query(({ ctx }) => getCeoDashboardStats(ctx.user.id)),

  // ─── Executive Gems CRUD ─────────────────────────────────────────────────
  gems: router({
    list: protectedProcedure.query(({ ctx }) => getExecutiveGems(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const gem = await getExecutiveGemById(input.id);
        if (!gem || gem.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return gem;
      }),

    create: protectedProcedure
      .input(
        z.object({
          gemName: z.string().min(1),
          gemRole: z.enum(["ceo", "cmo", "cto", "cfo", "coo", "strategy", "creative", "media", "optimization", "analytics"]),
          systemPrompt: z.string().optional(),
          personality: z.string().optional(),
          goals: z.array(z.string()).optional(),
          kpis: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createExecutiveGem({
          ...input,
          userId: ctx.user.id,
          goals: input.goals || null,
          kpis: input.kpis || null,
          systemPrompt: input.systemPrompt || null,
          personality: input.personality || null,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          gemName: z.string().optional(),
          systemPrompt: z.string().optional(),
          personality: z.string().optional(),
          goals: z.array(z.string()).optional(),
          kpis: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const gem = await getExecutiveGemById(id);
        if (!gem || gem.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await updateExecutiveGem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const gem = await getExecutiveGemById(input.id);
        if (!gem || gem.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteExecutiveGem(input.id);
        return { success: true };
      }),

    // Initialize default board
    initializeBoard: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getExecutiveGems(ctx.user.id);
      if (existing.length > 0) {
        return { success: true, message: "Board already initialized", count: existing.length };
      }

      for (const gem of DEFAULT_GEMS) {
        await createExecutiveGem({
          ...gem,
          userId: ctx.user.id,
          systemPrompt: gem.systemPrompt,
          personality: gem.personality,
        });
      }

      return { success: true, message: "Executive board initialized", count: DEFAULT_GEMS.length };
    }),
  }),

  // ─── CEO Decisions ───────────────────────────────────────────────────────
  decisions: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => getCeoDecisions(ctx.user.id, input.limit ?? 50)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const decision = await getCeoDecisionById(input.id);
        if (!decision || decision.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return decision;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "approved", "executed", "rejected", "reverted"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const decision = await getCeoDecisionById(input.id);
        if (!decision || decision.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await updateCeoDecision(input.id, {
          status: input.status,
          executedAt: input.status === "executed" ? new Date() : undefined,
        });
        return { success: true };
      }),
  }),

  // ─── Board Meetings ──────────────────────────────────────────────────────
  meetings: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => getBoardMeetings(ctx.user.id, input.limit ?? 20)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const meeting = await getBoardMeetingById(input.id);
        if (!meeting || meeting.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        return meeting;
      }),

    // Trigger a new board meeting
    trigger: protectedProcedure
      .input(
        z.object({
          topic: z.string().min(1),
          triggerType: z.enum(["scheduled", "event", "manual", "emergency"]).optional(),
          triggerReason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return runBoardMeeting({
          userId: ctx.user.id,
          topic: input.topic,
          triggerType: input.triggerType || "manual",
          triggerReason: input.triggerReason,
        });
      }),
  }),

  // ─── System Directives ───────────────────────────────────────────────────
  directives: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => getSystemDirectives(ctx.user.id, input.limit ?? 50)),

    issue: protectedProcedure
      .input(
        z.object({
          fromGemId: z.number(),
          toGemRole: z.string(),
          directive: z.string().min(1),
          priority: z.enum(["low", "medium", "high", "critical"]).optional(),
          deadline: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return issueCeoDirective({
          userId: ctx.user.id,
          fromGemId: input.fromGemId,
          toGemRole: input.toGemRole,
          directive: input.directive,
          priority: input.priority || "medium",
          deadline: input.deadline,
        });
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "acknowledged", "in_progress", "completed", "failed"]),
          response: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateSystemDirective(id, {
          ...data,
          completedAt: input.status === "completed" ? new Date() : undefined,
        });
        return { success: true };
      }),
  }),

  // ─── Performance Snapshots ───────────────────────────────────────────────
  snapshots: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => getPerformanceSnapshots(ctx.user.id, input.limit ?? 30)),

    take: protectedProcedure.mutation(({ ctx }) => takePerformanceSnapshot(ctx.user.id)),
  }),

  // ─── CEO AI Actions ──────────────────────────────────────────────────────
  analyze: protectedProcedure
    .input(
      z.object({
        analysisType: z.enum(["full_review", "campaign_review", "budget_review", "performance_review", "emergency_assessment"]),
        context: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return runCeoAnalysis({
        userId: ctx.user.id,
        analysisType: input.analysisType,
        context: input.context,
      });
    }),
});
