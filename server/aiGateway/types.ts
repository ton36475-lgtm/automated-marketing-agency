/**
 * AI Gateway Types
 * Unified type definitions for multi-model LLM integration
 */

export type ModelTier = 'fast' | 'balanced' | 'powerful' | 'reasoning';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<ContentBlock>;
}

export interface ContentBlock {
  type: 'text' | 'image_url' | 'file_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
  file_url?: {
    url: string;
    mime_type?: string;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export type ToolChoice = 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };

export interface ResponseFormat {
  type: 'json_schema' | 'text';
  json_schema?: {
    name: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
}

export interface AIGatewayConfig {
  apiKey: string;
  baseUrl: string;
  models: {
    fast: string;
    balanced: string;
    powerful: string;
    reasoning: string;
  };
  fallbackOrder: string[];
  requestTimeout: number;
  maxRetries: number;
  observability: {
    trackTokens: boolean;
    trackLatency: boolean;
    trackCost: boolean;
    trackFallbacks: boolean;
  };
}

export interface LLMRequest {
  messages: Message[];
  model?: ModelTier | string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  responseFormat?: ResponseFormat;
  metadata?: {
    taskId?: string;
    agentName?: string;
    functionName?: string;
    userId?: string;
    batchId?: string;
    comparisonMode?: boolean;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    latencyMs: number;
    costUSD: number;
    provider: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
    timestamp: number;
  };
}

export interface ModelComparison {
  taskId: string;
  timestamp: number;
  models: {
    [modelName: string]: {
      response: LLMResponse;
      quality?: number;
      winner?: boolean;
    };
  };
  analysis: {
    fastestModel: string;
    cheapestModel: string;
    bestQuality: string;
    recommendation: string;
  };
}

export interface ObservabilityLog {
  requestId: string;
  model: string;
  tokens: number;
  cost: number;
  latency: number;
  provider: string;
  status: 'success' | 'success_fallback' | 'error';
  metadata?: Record<string, unknown>;
  fallbackReason?: string;
}

export interface BatchLog {
  batchId: string;
  requestCount: number;
  totalCost: number;
  totalLatency: number;
}

export interface ErrorLog {
  requestId?: string;
  batchId?: string;
  error: string;
  fallbackFailed?: boolean;
}

export interface ModelPricing {
  input: number;
  output: number;
}

export interface CostBreakdown {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface FallbackEvent {
  requestId: string;
  primaryModel: string;
  primaryProvider: string;
  primaryError: string;
  fallbackModel: string;
  fallbackProvider: string;
  fallbackSuccess: boolean;
  timestamp: number;
}

export interface CacheEntry {
  key: string;
  response: LLMResponse;
  timestamp: number;
  ttl: number;
}

export interface ModelStats {
  model: string;
  provider: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  fallbackCount: number;
}

export interface ProviderStats {
  provider: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  fallbackCount: number;
}

export interface DailyStats {
  date: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  models: { [model: string]: ModelStats };
  providers: { [provider: string]: ProviderStats };
}
