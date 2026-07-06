/**
 * Cost Calculator
 * Calculates costs for different LLM models
 */

import type { ModelPricing, CostBreakdown } from './types';

const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gpt-4o': { input: 5 / 1_000_000, output: 15 / 1_000_000 },
  'gpt-4-turbo': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
  'o1': { input: 15 / 1_000_000, output: 60 / 1_000_000 },
  'o1-mini': { input: 3 / 1_000_000, output: 12 / 1_000_000 },

  // Anthropic
  'claude-3-5-haiku': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
  'claude-3-5-sonnet': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-3-opus': { input: 15 / 1_000_000, output: 75 / 1_000_000 },

  // Google
  'gemini-2.5-flash': { input: 0.075 / 1_000_000, output: 0.30 / 1_000_000 },
  'gemini-2-pro': { input: 2 / 1_000_000, output: 6 / 1_000_000 },

  // xAI
  'grok-2': { input: 2 / 1_000_000, output: 10 / 1_000_000 },
};

export class CostCalculator {
  /**
   * Calculate cost for a single request
   */
  calculate(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      console.warn(`Unknown model: ${model}, using default pricing`);
      return 0;
    }

    return inputTokens * pricing.input + outputTokens * pricing.output;
  }

  /**
   * Estimate cost based on estimated tokens
   */
  estimateCost(model: string, estimatedTokens: number): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      console.warn(`Unknown model: ${model}, using default pricing`);
      return 0;
    }

    // Rough estimate: 70% input, 30% output
    return (
      estimatedTokens * 0.7 * pricing.input +
      estimatedTokens * 0.3 * pricing.output
    );
  }

  /**
   * Get detailed cost breakdown
   */
  getBreakdown(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): CostBreakdown {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown model: ${model}`);
    }

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
    };
  }

  /**
   * Compare costs across models
   */
  compareCosts(
    inputTokens: number,
    outputTokens: number,
    models: string[] = Object.keys(MODEL_PRICING)
  ): Record<string, number> {
    const costs: Record<string, number> = {};

    for (const model of models) {
      costs[model] = this.calculate(model, inputTokens, outputTokens);
    }

    return costs;
  }

  /**
   * Get cheapest model for given tokens
   */
  getCheapestModel(inputTokens: number, outputTokens: number): string {
    const costs = this.compareCosts(inputTokens, outputTokens);
    return Object.entries(costs).reduce((prev, [model, cost]) =>
      cost < prev[1] ? [model, cost] : prev
    )[0];
  }

  /**
   * Get model pricing
   */
  getPricing(model: string): ModelPricing | null {
    return MODEL_PRICING[model] || null;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): string[] {
    return Object.keys(MODEL_PRICING);
  }

  /**
   * Add custom model pricing
   */
  addModel(model: string, pricing: ModelPricing): void {
    MODEL_PRICING[model] = pricing;
  }

  /**
   * Calculate savings from using cache
   */
  calculateCacheSavings(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Cache saves input tokens (output is generated fresh)
    const pricing = MODEL_PRICING[model];
    if (!pricing) return 0;

    return inputTokens * pricing.input;
  }

  /**
   * Calculate cost per token
   */
  getCostPerToken(model: string): { input: number; output: number } {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      throw new Error(`Unknown model: ${model}`);
    }

    return {
      input: pricing.input,
      output: pricing.output,
    };
  }
}
