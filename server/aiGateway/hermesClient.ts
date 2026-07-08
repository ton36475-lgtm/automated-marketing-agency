/**
 * Hermes Client - AI Orchestration Integration
 * Enables multi-model AI-to-AI communication with Harness Tool concepts
 */

import { EngineOrchestrator, EngineRequest, EngineResponse } from "./engineOrchestrator";
import { UnifiedAIGatewayClient } from "./client";
import type { AIGatewayConfig } from "./types";

export interface HermesConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxConcurrent?: number;
}

export interface HermesTask {
  id: string;
  engineId: string;
  context: Record<string, unknown>;
  priority?: "low" | "normal" | "high";
  timeout?: number;
  retries?: number;
}

export interface HermesTaskResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Hermes Client - Main orchestration hub
 */
export class HermesClient {
  private config: HermesConfig;
  private orchestrator: EngineOrchestrator;
  private taskQueue: Map<string, HermesTask> = new Map();
  private taskResults: Map<string, HermesTaskResult> = new Map();
  private activeTaskCount = 0;

  constructor(
    config: HermesConfig,
    aiGatewayClient: UnifiedAIGatewayClient,
    aiGatewayConfig: AIGatewayConfig,
    orchestrator: EngineOrchestrator
  ) {
    this.config = {
      timeout: 30000,
      maxConcurrent: 3,
      ...config,
    };
    this.orchestrator = orchestrator;
  }

  /**
   * Submit a task for orchestration
   */
  async submitTask(task: HermesTask): Promise<string> {
    const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.taskQueue.set(taskId, { ...task, id: taskId });
    this.processQueue();
    return taskId;
  }

  /**
   * Process queued tasks
   */
  private async processQueue(): Promise<void> {
    while (this.activeTaskCount < (this.config.maxConcurrent || 3) && this.taskQueue.size > 0) {
      const entry = this.taskQueue.entries().next().value as [string, HermesTask] | undefined;
      if (!entry) break;
      const [taskId, task] = entry;

      this.taskQueue.delete(taskId);
      this.activeTaskCount++;

      this.executeTask(taskId, task).finally(() => {
        this.activeTaskCount--;
        this.processQueue();
      });
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(taskId: string, task: HermesTask): Promise<void> {
    const startTime = Date.now();

    try {
      const request: EngineRequest = {
        engineId: task.engineId,
        taskType: "orchestrated_task",
        context: task.context,
        timeout: task.timeout || this.config.timeout,
      };

      const response = await this.orchestrator.callEngine(request);

      const executionTime = Date.now() - startTime;

      this.taskResults.set(taskId, {
        taskId,
        success: response.success,
        result: response.data,
        error: response.error,
        executionTime,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.taskResults.set(taskId, {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });
    }
  }

  /**
   * Get task result
   */
  getTaskResult(taskId: string): HermesTaskResult | undefined {
    return this.taskResults.get(taskId);
  }

  /**
   * Wait for task completion
   */
  async waitForTask(taskId: string, timeout?: number): Promise<HermesTaskResult> {
    const startTime = Date.now();
    const timeoutMs = timeout || this.config.timeout || 30000;

    while (true) {
      const result = this.taskResults.get(taskId);
      if (result) {
        return result;
      }

      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Batch submit multiple tasks
   */
  async submitBatch(tasks: HermesTask[]): Promise<string[]> {
    return Promise.all(tasks.map(task => this.submitTask(task)));
  }

  /**
   * Wait for all tasks in batch
   */
  async waitForBatch(taskIds: string[], timeout?: number): Promise<HermesTaskResult[]> {
    return Promise.all(taskIds.map(taskId => this.waitForTask(taskId, timeout)));
  }

  /**
   * Get orchestration stats
   */
  getStats() {
    return {
      queuedTasks: this.taskQueue.size,
      activeTasks: this.activeTaskCount,
      completedTasks: this.taskResults.size,
      totalCost: Array.from(this.taskResults.values()).reduce((sum, r) => sum + (r.cost || 0), 0),
      avgExecutionTime:
        this.taskResults.size > 0
          ? Array.from(this.taskResults.values()).reduce((sum, r) => sum + r.executionTime, 0) / this.taskResults.size
          : 0,
    };
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; details: Record<string, unknown> }> {
    try {
      const stats = this.getStats();

      // Check if system is healthy
      const isHealthy = this.activeTaskCount < (this.config.maxConcurrent || 3);
      const status = isHealthy ? "healthy" : "degraded";

      return {
        status,
        details: {
          ...stats,
          apiKeyConfigured: !!this.config.apiKey,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

/**
 * Create Hermes client with all integrations
 */
export function createHermesClient(
  hermesConfig: HermesConfig,
  aiGatewayClient: UnifiedAIGatewayClient,
  aiGatewayConfig: AIGatewayConfig,
  orchestrator: EngineOrchestrator
): HermesClient {
  return new HermesClient(hermesConfig, aiGatewayClient, aiGatewayConfig, orchestrator);
}
