import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { orchestrationState, campaigns } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

interface Agent {
  type: string;
  status: "idle" | "running" | "waiting" | "error";
  currentTask?: string;
  priority: number;
}

interface Task {
  id: string;
  type: string;
  agentType: string;
  status: "pending" | "running" | "completed" | "failed";
  priority: number;
  data: Record<string, any>;
  dependencies?: string[];
}

interface OrchestrationContext {
  campaignId: number;
  userId: number;
  agents: Map<string, Agent>;
  taskQueue: Task[];
  decisions: Record<string, any>;
  state: "idle" | "running" | "paused" | "error";
}

class OrchestrationEngine {
  private db: Awaited<ReturnType<typeof getDb>> | null = null;
  private contexts: Map<number, OrchestrationContext> = new Map();
  private agentTypes = ["strategy", "copywriting", "visual", "media_buying", "optimization"];

  async initialize() {
    this.db = await getDb();
    console.log("[Orchestration] Engine initialized");
  }

  async startCampaignOrchestration(campaignId: number, userId: number) {
    if (!this.db) {
      throw new Error("Database not available");
    }

    const campaign = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);

    if (campaign.length === 0) {
      throw new Error("Campaign not found");
    }

    // Initialize orchestration context
    const context: OrchestrationContext = {
      campaignId,
      userId,
      agents: new Map(
        this.agentTypes.map((type) => [
          type,
          {
            type,
            status: "idle",
            priority: this.getAgentPriority(type),
          },
        ])
      ),
      taskQueue: [],
      decisions: {},
      state: "running",
    };

    this.contexts.set(campaignId, context);

    // Save to database
    await this.db
      .insert(orchestrationState)
      .values({
        userId,
        campaignId,
        activeAgents: Array.from(context.agents.values()),
        taskQueue: [],
        decisions: {},
        state: "running",
      })
      .onDuplicateKeyUpdate({
        set: {
          activeAgents: Array.from(context.agents.values()),
          taskQueue: [],
          decisions: {},
          state: "running",
        },
      });

    console.log(`[Orchestration] Started orchestration for campaign ${campaignId}`);

    // Begin orchestration workflow
    await this.orchestrateWorkflow(context);
  }

  private async orchestrateWorkflow(context: OrchestrationContext) {
    try {
      // Phase 1: Strategy Agent - Analyze and plan
      await this.executeAgentPhase(context, "strategy", {
        campaignId: context.campaignId,
        action: "analyze_and_plan",
      });

      // Phase 2: Copywriting Agent - Generate content
      await this.executeAgentPhase(context, "copywriting", {
        campaignId: context.campaignId,
        action: "generate_copy",
        strategyDecisions: context.decisions.strategy,
      });

      // Phase 3: Visual Agent - Create visuals
      await this.executeAgentPhase(context, "visual", {
        campaignId: context.campaignId,
        action: "generate_visuals",
        copyDecisions: context.decisions.copywriting,
      });

      // Phase 4: Media Buying Agent - Set up campaigns
      await this.executeAgentPhase(context, "media_buying", {
        campaignId: context.campaignId,
        action: "setup_campaigns",
        creatives: context.decisions.visual,
      });

      // Phase 5: Optimization Agent - Monitor and optimize
      await this.executeAgentPhase(context, "optimization", {
        campaignId: context.campaignId,
        action: "monitor_and_optimize",
      });

      context.state = "idle";
      console.log(`[Orchestration] Campaign ${context.campaignId} orchestration completed`);
    } catch (error) {
      context.state = "error";
      console.error(`[Orchestration] Campaign ${context.campaignId} orchestration failed:`, error);
    }

    await this.updateOrchestrationState(context);
  }

  private async executeAgentPhase(
    context: OrchestrationContext,
    agentType: string,
    taskData: Record<string, any>
  ) {
    const agent = context.agents.get(agentType);
    if (!agent) return;

    agent.status = "running";
    agent.currentTask = taskData.action;

    console.log(`[Orchestration] Executing ${agentType} agent: ${taskData.action}`);

    try {
      // Use LLM to make agent decisions
      const decision = await invokeLLM({
        messages: [
          {
            role: "system",
            content: this.getAgentSystemPrompt(agentType),
          },
          {
            role: "user",
            content: `Execute task: ${taskData.action}\nContext: ${JSON.stringify(taskData)}`,
          },
        ],
      });

      const result = decision.choices[0]?.message.content;
      context.decisions[agentType] = result;

      agent.status = "idle";
      console.log(`[Orchestration] ${agentType} agent completed`);
    } catch (error) {
      agent.status = "error";
      console.error(`[Orchestration] ${agentType} agent failed:`, error);
      throw error;
    }
  }

  private getAgentSystemPrompt(agentType: string): string {
    const prompts: Record<string, string> = {
      strategy:
        "You are a marketing strategy expert. Analyze market conditions, define target audiences, set KPIs, and create comprehensive campaign strategies.",
      copywriting:
        "You are a master copywriter. Create compelling ad copy, headlines, CTAs, and marketing messages that drive conversions.",
      visual:
        "You are a creative director. Provide detailed descriptions for visual assets, design briefs, and creative direction for ad campaigns.",
      media_buying:
        "You are a media buying expert. Determine optimal platforms, audience targeting, budget allocation, and bidding strategies.",
      optimization:
        "You are a performance optimization specialist. Monitor metrics, identify optimization opportunities, and recommend scaling strategies.",
    };

    return prompts[agentType] || "You are a marketing automation agent.";
  }

  private getAgentPriority(agentType: string): number {
    const priorities: Record<string, number> = {
      strategy: 5,
      copywriting: 4,
      visual: 3,
      media_buying: 2,
      optimization: 1,
    };

    return priorities[agentType] || 0;
  }

  private async updateOrchestrationState(context: OrchestrationContext) {
    if (!this.db) return;

    await this.db
      .update(orchestrationState)
      .set({
        activeAgents: Array.from(context.agents.values()),
        taskQueue: context.taskQueue,
        decisions: context.decisions,
        state: context.state,
      })
      .where(eq(orchestrationState.campaignId, context.campaignId));
  }

  async pauseOrchestration(campaignId: number) {
    const context = this.contexts.get(campaignId);
    if (context) {
      context.state = "paused";
      await this.updateOrchestrationState(context);
      console.log(`[Orchestration] Campaign ${campaignId} paused`);
    }
  }

  async resumeOrchestration(campaignId: number) {
    const context = this.contexts.get(campaignId);
    if (context) {
      context.state = "running";
      await this.updateOrchestrationState(context);
      await this.orchestrateWorkflow(context);
      console.log(`[Orchestration] Campaign ${campaignId} resumed`);
    }
  }

  async getOrchestrationStatus(campaignId: number) {
    const context = this.contexts.get(campaignId);
    if (!context) {
      if (!this.db) return null;
      const state = await this.db
        .select()
        .from(orchestrationState)
        .where(eq(orchestrationState.campaignId, campaignId))
        .limit(1);
      return state[0] || null;
    }

    return {
      campaignId: context.campaignId,
      state: context.state,
      agents: Array.from(context.agents.values()),
      taskQueue: context.taskQueue,
      decisions: context.decisions,
    };
  }
}

export const orchestrationEngine = new OrchestrationEngine();
