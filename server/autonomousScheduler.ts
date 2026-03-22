import { CronJob } from "cron";
import type { CronJob as CronJobType } from "cron";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { eq } from "drizzle-orm";
import { scheduledTasks } from "../drizzle/schema";

interface ScheduledTaskConfig {
  campaignId?: number;
  agentType?: string;
  parameters?: Record<string, any>;
}

interface TaskExecutionContext {
  taskId: number;
  userId: number;
  campaignId?: number;
  config: ScheduledTaskConfig;
}

class AutonomousScheduler {
  private jobs: Map<number, CronJob> = new Map();
  private db: Awaited<ReturnType<typeof getDb>> | null = null;

  async initialize() {
    this.db = await getDb();
    if (!this.db) {
      console.error("[Scheduler] Database not available");
      return;
    }

    const tasks = await this.db.select().from(scheduledTasks).where(eq(scheduledTasks.isActive, true));
    
    for (const task of tasks) {
      this.scheduleTask(task as any);
    }

    console.log(`[Scheduler] Initialized with ${tasks.length} active tasks`);
  }

  scheduleTask(task: any) {
    try {
      const job = new CronJob(
        task.cronExpression,
        () => this.executeTask(task),
        null,
        true,
        "UTC"
      );

      this.jobs.set(task.id, job);
      console.log(`[Scheduler] Task ${task.id} (${task.name}) scheduled with cron: ${task.cronExpression}`);
    } catch (error) {
      console.error(`[Scheduler] Failed to schedule task ${task.id}:`, error);
    }
  }

  private async executeTask(task: any) {
    console.log(`[Scheduler] Executing task ${task.id} (${task.name})`);

    try {
      const context: TaskExecutionContext = {
        taskId: task.id,
        userId: task.userId,
        campaignId: task.campaignId,
        config: task.config || {},
      };

      switch (task.type) {
        case "campaign":
          await this.executeCampaignTask(context);
          break;
        case "content":
          await this.executeContentTask(context);
          break;
        case "analysis":
          await this.executeAnalysisTask(context);
          break;
        case "optimization":
          await this.executeOptimizationTask(context);
          break;
        case "report":
          await this.executeReportTask(context);
          break;
        default:
          console.warn(`[Scheduler] Unknown task type: ${task.type}`);
      }

      // Update last run time
      if (this.db) {
        await this.db
          .update(scheduledTasks)
          .set({ lastRun: new Date() })
          .where(eq(scheduledTasks.id, task.id));
      }

      console.log(`[Scheduler] Task ${task.id} completed successfully`);
    } catch (error) {
      console.error(`[Scheduler] Task ${task.id} failed:`, error);
    }
  }

  private async executeCampaignTask(context: TaskExecutionContext) {
    // Campaign automation: optimization, budget allocation, etc.
    const decision = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an autonomous marketing campaign manager. Make decisions about campaign optimization, budget allocation, and scaling based on performance metrics.",
        },
        {
          role: "user",
          content: `Analyze campaign ${context.campaignId} and provide optimization recommendations. Current config: ${JSON.stringify(context.config)}`,
        },
      ],
    });

    console.log(`[Scheduler] Campaign task decision:`, decision.choices[0]?.message.content);
  }

  private async executeContentTask(context: TaskExecutionContext) {
    // Content creation: generate new ad copy, images, videos
    const contentPlan = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a content creation strategist. Generate content creation plans for marketing campaigns.",
        },
        {
          role: "user",
          content: `Create content plan for campaign ${context.campaignId}. Parameters: ${JSON.stringify(context.config.parameters)}`,
        },
      ],
    });

    console.log(`[Scheduler] Content task plan:`, contentPlan.choices[0]?.message.content);
  }

  private async executeAnalysisTask(context: TaskExecutionContext) {
    // Analysis: competitor analysis, market research, performance analysis
    const analysis = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a market analyst. Provide deep insights into market trends and competitor activities.",
        },
        {
          role: "user",
          content: `Analyze market for campaign ${context.campaignId}. Focus areas: ${JSON.stringify(context.config.parameters)}`,
        },
      ],
    });

    console.log(`[Scheduler] Analysis task result:`, analysis.choices[0]?.message.content);
  }

  private async executeOptimizationTask(context: TaskExecutionContext) {
    // Optimization: ROAS optimization, budget reallocation, bid strategy
    const optimization = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an optimization expert. Provide specific, actionable optimization recommendations based on performance data.",
        },
        {
          role: "user",
          content: `Optimize campaign ${context.campaignId}. Current metrics: ${JSON.stringify(context.config.parameters)}`,
        },
      ],
    });

    console.log(`[Scheduler] Optimization task result:`, optimization.choices[0]?.message.content);
  }

  private async executeReportTask(context: TaskExecutionContext) {
    // Report generation: performance reports, analytics summaries
    const report = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a reporting specialist. Generate comprehensive marketing performance reports.",
        },
        {
          role: "user",
          content: `Generate report for campaign ${context.campaignId}. Report type: ${context.config.parameters?.reportType || "performance"}`,
        },
      ],
    });

    console.log(`[Scheduler] Report task result:`, report.choices[0]?.message.content);
  }

  addTask(task: any) {
    this.scheduleTask(task);
  }

  removeTask(taskId: number) {
    const job = this.jobs.get(taskId);
    if (job) {
      job.stop();
      this.jobs.delete(taskId);
      console.log(`[Scheduler] Task ${taskId} removed`);
    }
  }

  updateTask(task: any) {
    this.removeTask(task.id);
    this.scheduleTask(task);
  }

  getTaskStatus(taskId: number) {
    const job = this.jobs.get(taskId);
    return {
      scheduled: !!job,
      running: job ? (job as any).running || false : false,
    };
  }

  getAllTasks() {
    return Array.from(this.jobs.entries()).map(([id, job]) => ({
      id,
      running: (job as any).running || false,
    }));
  }
}

export const autonomousScheduler = new AutonomousScheduler();
