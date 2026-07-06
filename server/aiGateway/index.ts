/**
 * AI Gateway Module
 * Unified multi-model LLM orchestration with observability and quality guardrails
 */

export * from './types';
export * from './costCalculator';
export * from './observability';
export * from './fallback';
export * from './loopHarness';
export { UnifiedAIGatewayClient } from './client';

// Create singleton instance
import { UnifiedAIGatewayClient } from './client';
import type { AIGatewayConfig } from './types';

let aiGatewayClient: UnifiedAIGatewayClient | null = null;

export function initializeAIGateway(config: AIGatewayConfig) {
  aiGatewayClient = new UnifiedAIGatewayClient(config);
  return aiGatewayClient;
}

export function getAIGatewayClient(): UnifiedAIGatewayClient {
  if (!aiGatewayClient) {
    throw new Error('AI Gateway not initialized. Call initializeAIGateway first.');
  }
  return aiGatewayClient;
}
