/**
 * Unified AI Gateway Client
 * Central hub for all LLM operations with multi-model support, fallback logic, and observability
 */

import { CostCalculator } from './costCalculator';
import { ObservabilityService } from './observability';
import { FallbackManager } from './fallback';
import { LoopHarness, type LoopHarnessConfig } from './loopHarness';
import type {
  AIGatewayConfig,
  LLMRequest,
  LLMResponse,
  ModelTier,
  ToolCall,
} from './types';

export class UnifiedAIGatewayClient {
  private config: AIGatewayConfig;
  private costCalculator: CostCalculator;
  private observability: ObservabilityService;
  private fallbackManager: FallbackManager;
  private loopHarness?: LoopHarness;
  private cache: Map<string, LLMResponse> = new Map();

  constructor(config: AIGatewayConfig, loopHarnessConfig?: LoopHarnessConfig) {
    this.config = config;
    this.costCalculator = new CostCalculator();
    this.observability = new ObservabilityService();
    this.fallbackManager = new FallbackManager(config.fallbackOrder);

    if (loopHarnessConfig) {
      this.loopHarness = new LoopHarness(loopHarnessConfig);
    }
  }

  /**
   * Main invoke method
   */
  async invoke(request: LLMRequest): Promise<LLMResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Determine model to use
      const model = this.selectModel(request.model || 'balanced');

      // Check cache
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        await this.observability.logCacheHit(requestId, cacheKey);
        return cached;
      }

      // Apply Loop Harness guards if enabled
      if (this.loopHarness) {
        const harness = this.loopHarness;
        const content = JSON.stringify(request.messages);
        const guards = harness.runAllGuards(content, 'invoke', {
          content_check: true,
        });

        if (!guards.passed) {
          throw new Error(`Loop Harness violation: ${guards.violations.join(', ')}`);
        }
      }

      // Invoke model
      const response = await this.callModel(model, request);

      // Calculate cost
      const cost = this.costCalculator.calculate(
        model,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      // Cache response
      this.cache.set(cacheKey, response);

      // Log observability
      const latency = Date.now() - startTime;
      await this.observability.log({
        requestId,
        model,
        tokens: response.usage.totalTokens,
        cost,
        latency,
        provider: this.getProvider(model),
        status: 'success',
        metadata: request.metadata,
      });

      return {
        ...response,
        metadata: {
          ...response.metadata,
          latencyMs: latency,
          costUSD: cost,
          provider: this.getProvider(model),
          fallbackUsed: false,
          timestamp: startTime,
        },
      };
    } catch (error) {
      // Try fallback
      return this.handleFallback(request, requestId, startTime, error);
    }
  }

  /**
   * Handle fallback logic
   */
  private async handleFallback(
    request: LLMRequest,
    requestId: string,
    startTime: number,
    primaryError: unknown
  ): Promise<LLMResponse> {
    const fallbackModel = this.fallbackManager.getNextModel();

    if (!fallbackModel) {
      await this.observability.logError({
        requestId,
        error: String(primaryError),
        fallbackFailed: true,
      });
      throw primaryError;
    }

    try {
      const response = await this.callModel(fallbackModel, request);

      const cost = this.costCalculator.calculate(
        fallbackModel,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      const latency = Date.now() - startTime;

      await this.observability.logFallback({
        requestId,
        primaryModel: this.selectModel(request.model || 'balanced'),
        primaryProvider: this.getProvider(this.selectModel(request.model || 'balanced')),
        primaryError: String(primaryError),
        fallbackModel,
        fallbackProvider: this.getProvider(fallbackModel),
        fallbackSuccess: true,
        timestamp: startTime,
      });

      await this.observability.log({
        requestId,
        model: fallbackModel,
        tokens: response.usage.totalTokens,
        cost,
        latency,
        provider: this.getProvider(fallbackModel),
        status: 'success_fallback',
        metadata: request.metadata,
      });

      return {
        ...response,
        metadata: {
          ...response.metadata,
          latencyMs: latency,
          costUSD: cost,
          provider: this.getProvider(fallbackModel),
          fallbackUsed: true,
          fallbackReason: String(primaryError),
          timestamp: startTime,
        },
      };
    } catch (fallbackError) {
      await this.observability.logError({
        requestId,
        error: String(fallbackError),
        fallbackFailed: true,
      });
      throw fallbackError;
    }
  }

  /**
   * Select model based on tier
   */
  private selectModel(tier: ModelTier | string): string {
    if (tier in this.config.models) {
      return this.config.models[tier as ModelTier];
    }
    return tier;
  }

  /**
   * Get provider for model
   */
  private getProvider(model: string): string {
    if (model.includes('gpt')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gemini')) return 'google';
    if (model.includes('grok')) return 'xai';
    return 'unknown';
  }

  /**
   * Call actual model (placeholder)
   */
  private async callModel(model: string, request: LLMRequest): Promise<LLMResponse> {
    // This would be replaced with actual API calls to Vercel AI Gateway
    // For now, returning mock response
    return {
      id: `resp_${Date.now()}`,
      model,
      provider: this.getProvider(model),
      content: 'Mock response from ' + model,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      metadata: {
        latencyMs: 500,
        costUSD: 0.001,
        provider: this.getProvider(model),
        fallbackUsed: false,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: LLMRequest): string {
    const content = JSON.stringify(request.messages);
    return `cache_${Buffer.from(content).toString('base64').substring(0, 32)}`;
  }

  /**
   * Get observability stats
   */
  async getStats() {
    return {
      requests: await this.observability.getRequestStats(),
      comparisons: await this.observability.getModelComparisonStats(),
      costs: await this.observability.getCostBreakdown(),
      fallbacks: await this.observability.getFallbackStats(),
    };
  }

  /**
   * Get loop harness status
   */
  getLoopHarnessStatus() {
    if (!this.loopHarness) {
      return null;
    }
    return this.loopHarness.getStatus();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cost for tokens
   */
  estimateCost(model: string, tokens: number): number {
    return this.costCalculator.estimateCost(model, tokens);
  }

  /**
   * Compare models
   */
  compareModels(inputTokens: number, outputTokens: number): Record<string, number> {
    return this.costCalculator.compareCosts(inputTokens, outputTokens);
  }
}
