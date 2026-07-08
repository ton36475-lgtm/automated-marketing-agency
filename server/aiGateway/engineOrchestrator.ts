/**
 * Engine Orchestrator - Harness Tool Implementation
 * Enables AI-to-AI communication between CEO, Performance Monitor, and Cross-System Analyzer
 */

import { UnifiedAIGatewayClient } from "./client";
import { AIGatewayConfig } from "./types";

export interface EngineRequest {
  engineId: string;
  taskType: string;
  context: Record<string, unknown>;
  tools?: string[];
  timeout?: number;
}

export interface EngineResponse {
  engineId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  latency?: number;
}

export class EngineOrchestrator {
  private client: UnifiedAIGatewayClient;
  private config: AIGatewayConfig;
  private engineRegistry: Map<string, EngineHandler> = new Map();

  constructor(client: UnifiedAIGatewayClient, config: AIGatewayConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Register an engine handler
   */
  registerEngine(engineId: string, handler: EngineHandler): void {
    this.engineRegistry.set(engineId, handler);
  }

  /**
   * Call another engine from within an AI task
   */
  async callEngine(request: EngineRequest): Promise<EngineResponse> {
    const startTime = Date.now();

    try {
      const handler = this.engineRegistry.get(request.engineId);
      if (!handler) {
        throw new Error(`Engine not found: ${request.engineId}`);
      }

      // Execute the engine handler
      const result = await handler.execute(request.context);

      const latency = Date.now() - startTime;

      return {
        engineId: request.engineId,
        success: true,
        data: result,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        engineId: request.engineId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        latency,
      };
    }
  }

  /**
   * Create a tool definition for calling another engine
   */
  createEngineTool(engineId: string, description: string) {
    return {
      name: `call_${engineId}`,
      description,
      inputSchema: {
        type: "object" as const,
        properties: {
          context: {
            type: "object",
            description: "Context data to pass to the engine",
          },
        },
        required: ["context"],
      },
    };
  }

  /**
   * Handle tool calls from AI models
   */
  async handleToolCall(toolName: string, toolInput: Record<string, unknown>): Promise<unknown> {
    // Extract engine ID from tool name (e.g., "call_performance_monitor" → "performance_monitor")
    const engineId = toolName.replace("call_", "");

    const request: EngineRequest = {
      engineId,
      taskType: "tool_call",
      context: toolInput.context as Record<string, unknown>,
    };

    return this.callEngine(request);
  }
}

/**
 * Engine Handler Interface
 */
export interface EngineHandler {
  engineId: string;
  execute(context: Record<string, unknown>): Promise<unknown>;
}

/**
 * CEO Engine Handler
 */
export class CEOEngineHandler implements EngineHandler {
  engineId = "ceo_gem";

  constructor(private ceoEngine: any) {}

  async execute(context: Record<string, unknown>): Promise<unknown> {
    // CEO analyzes the context and makes decisions
    return this.ceoEngine.analyzeAndDecide(context);
  }
}

/**
 * Performance Monitor Engine Handler
 */
export class PerformanceMonitorHandler implements EngineHandler {
  engineId = "performance_monitor";

  constructor(private performanceEngine: any) {}

  async execute(context: Record<string, unknown>): Promise<unknown> {
    // Performance monitor analyzes agent metrics
    return this.performanceEngine.analyzePerformance(context);
  }
}

/**
 * Cross-System Analyzer Engine Handler
 */
export class CrossSystemAnalyzerHandler implements EngineHandler {
  engineId = "cross_system_analyzer";

  constructor(private crossSystemEngine: any) {}

  async execute(context: Record<string, unknown>): Promise<unknown> {
    // Cross-system analyzer finds synergies
    return this.crossSystemEngine.analyzeSynergies(context);
  }
}

/**
 * Create orchestrator with all engines
 */
export function createEngineOrchestrator(
  client: UnifiedAIGatewayClient,
  config: AIGatewayConfig,
  engines: {
    ceoEngine?: any;
    performanceEngine?: any;
    crossSystemEngine?: any;
  }
): EngineOrchestrator {
  const orchestrator = new EngineOrchestrator(client, config);

  if (engines.ceoEngine) {
    orchestrator.registerEngine("ceo_gem", new CEOEngineHandler(engines.ceoEngine));
  }

  if (engines.performanceEngine) {
    orchestrator.registerEngine("performance_monitor", new PerformanceMonitorHandler(engines.performanceEngine));
  }

  if (engines.crossSystemEngine) {
    orchestrator.registerEngine("cross_system_analyzer", new CrossSystemAnalyzerHandler(engines.crossSystemEngine));
  }

  return orchestrator;
}
