# Design Specifications - AI Gateway Integration
## Automated Marketing Agency v4.0

**Phase:** 2 - Design & Architecture  
**Status:** In Progress  
**Last Updated:** July 4, 2026

---

## 1. Unified LLM Client Architecture

### 1.1 Core Client Interface

```typescript
// server/aiGateway/types.ts
export type ModelTier = 'fast' | 'balanced' | 'powerful' | 'reasoning';

export interface AIGatewayConfig {
  apiKey: string;
  baseUrl: string;
  models: {
    fast: string;      // Gemini 2.5 Flash ($0.075/1M input)
    balanced: string;  // GPT-4o ($5/1M input)
    powerful: string;  // GPT-4 Turbo ($10/1M input)
    reasoning: string; // o1 ($15/1M input)
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
```

### 1.2 Client Implementation

```typescript
// server/aiGateway/client.ts
import { AIGatewayConfig, LLMRequest, LLMResponse, ModelTier } from './types';
import { ObservabilityService } from './observability';
import { CostCalculator } from './costCalculator';
import { FallbackManager } from './fallback';

export class AIGatewayClient {
  private config: AIGatewayConfig;
  private observability: ObservabilityService;
  private costCalculator: CostCalculator;
  private fallbackManager: FallbackManager;
  private requestCache: Map<string, LLMResponse>;

  constructor(config: AIGatewayConfig) {
    this.config = config;
    this.observability = new ObservabilityService();
    this.costCalculator = new CostCalculator();
    this.fallbackManager = new FallbackManager(config.fallbackOrder);
    this.requestCache = new Map();
  }

  /**
   * Main invoke method with automatic model selection
   */
  async invoke(request: LLMRequest): Promise<LLMResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.requestCache.get(cacheKey);
      if (cached) {
        await this.observability.logCacheHit(requestId, cacheKey);
        return cached;
      }

      // Select model based on tier
      const model = this.selectModel(request.model);

      // Call AI Gateway
      const response = await this.callGateway(model, request, requestId);

      // Calculate cost
      const cost = this.costCalculator.calculate(
        model,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      // Build response with metadata
      const result: LLMResponse = {
        ...response,
        metadata: {
          latencyMs: Date.now() - startTime,
          costUSD: cost,
          provider: this.getProvider(model),
          fallbackUsed: false,
          timestamp: Date.now(),
        },
      };

      // Cache result
      this.requestCache.set(cacheKey, result);

      // Log observability
      await this.observability.log({
        requestId,
        model,
        tokens: response.usage.totalTokens,
        cost,
        latency: Date.now() - startTime,
        provider: this.getProvider(model),
        status: 'success',
        metadata: request.metadata,
      });

      return result;
    } catch (error) {
      return this.handleFallback(request, error, requestId, startTime);
    }
  }

  /**
   * Compare multiple models on the same task
   */
  async compareModels(
    request: LLMRequest,
    models: ModelTier[] = ['fast', 'balanced', 'powerful']
  ): Promise<ModelComparison> {
    const taskId = this.generateRequestId();
    const timestamp = Date.now();
    const results: { [key: string]: LLMResponse } = {};
    const costs: { [key: string]: number } = {};

    // Run all models in parallel
    const promises = models.map(async (modelTier) => {
      try {
        const response = await this.invoke({
          ...request,
          model: modelTier,
          metadata: {
            ...request.metadata,
            taskId,
            comparisonMode: true,
          },
        });
        results[modelTier] = response;
        costs[modelTier] = response.metadata.costUSD;
      } catch (error) {
        results[modelTier] = { error: error.message };
      }
    });

    await Promise.all(promises);

    // Analyze results
    const analysis = this.analyzeComparison(results, costs);

    const comparison: ModelComparison = {
      taskId,
      timestamp,
      models: models.reduce(
        (acc, model) => {
          acc[model] = { response: results[model] };
          return acc;
        },
        {} as any
      ),
      analysis,
    };

    // Log comparison
    await this.observability.logComparison(comparison);

    return comparison;
  }

  /**
   * Batch invoke for multiple requests
   */
  async batchInvoke(requests: LLMRequest[]): Promise<LLMResponse[]> {
    const batchId = this.generateRequestId();
    const startTime = Date.now();

    try {
      const responses = await Promise.all(
        requests.map((req) =>
          this.invoke({
            ...req,
            metadata: {
              ...req.metadata,
              batchId,
            },
          })
        )
      );

      await this.observability.logBatch({
        batchId,
        requestCount: requests.length,
        totalCost: responses.reduce((sum, r) => sum + r.metadata.costUSD, 0),
        totalLatency: Date.now() - startTime,
      });

      return responses;
    } catch (error) {
      await this.observability.logError({
        batchId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private selectModel(tier?: ModelTier | string): string {
    if (!tier) return this.config.models.balanced;
    if (tier in this.config.models) {
      return this.config.models[tier as ModelTier];
    }
    return tier;
  }

  private async callGateway(
    model: string,
    request: LLMRequest,
    requestId: string
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        tools: request.tools,
        tool_choice: request.toolChoice,
        response_format: request.responseFormat,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AI Gateway error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  private async handleFallback(
    request: LLMRequest,
    error: Error,
    requestId: string,
    startTime: number
  ): Promise<LLMResponse> {
    const fallbackModel = this.fallbackManager.getNextModel();

    if (!fallbackModel) {
      await this.observability.logError({
        requestId,
        error: error.message,
        fallbackFailed: true,
      });
      throw error;
    }

    try {
      const response = await this.callGateway(fallbackModel, request, requestId);

      const cost = this.costCalculator.calculate(
        fallbackModel,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      const result: LLMResponse = {
        ...response,
        metadata: {
          latencyMs: Date.now() - startTime,
          costUSD: cost,
          provider: this.getProvider(fallbackModel),
          fallbackUsed: true,
          fallbackReason: error.message,
          timestamp: Date.now(),
        },
      };

      await this.observability.log({
        requestId,
        model: fallbackModel,
        tokens: response.usage.totalTokens,
        cost,
        latency: Date.now() - startTime,
        provider: this.getProvider(fallbackModel),
        status: 'success_fallback',
        fallbackReason: error.message,
      });

      return result;
    } catch (fallbackError) {
      return this.handleFallback(request, fallbackError as Error, requestId, startTime);
    }
  }

  private getProvider(model: string): string {
    if (model.includes('gpt')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gemini')) return 'google';
    if (model.includes('grok')) return 'xai';
    return 'unknown';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(request: LLMRequest): string {
    return `${request.model}_${JSON.stringify(request.messages)}`;
  }

  private analyzeComparison(
    results: { [key: string]: LLMResponse },
    costs: { [key: string]: number }
  ) {
    const validResults = Object.entries(results).filter(
      ([_, r]) => !('error' in r)
    );

    const latencies = validResults.map(([_, r]) => r.metadata.latencyMs);
    const fastestModel = validResults.reduce((prev, [model, r]) =>
      r.metadata.latencyMs < (prev[1]?.metadata.latencyMs ?? Infinity)
        ? [model, r]
        : prev
    )[0];

    const cheapestModel = Object.entries(costs).reduce((prev, [model, cost]) =>
      cost < prev[1] ? [model, cost] : prev
    )[0];

    return {
      fastestModel,
      cheapestModel,
      bestQuality: 'balanced', // Can be enhanced with quality scoring
      recommendation: `Use ${cheapestModel} for cost efficiency or ${fastestModel} for speed`,
    };
  }
}
```

---

## 2. Model Selection Strategy

### 2.1 Decision Tree

```
Task Type Detection
├─ Quick Response (< 2s requirement)
│  └─ Use: fast (Gemini 2.5 Flash)
│     Cost: $0.075/1M input
│     Use Cases: Real-time chat, quick summaries
│
├─ Balanced Quality/Speed (2-10s)
│  └─ Use: balanced (GPT-4o)
│     Cost: $5/1M input
│     Use Cases: Content generation, analysis
│
├─ Complex Reasoning (10-60s)
│  └─ Use: powerful (GPT-4 Turbo)
│     Cost: $10/1M input
│     Use Cases: Strategic planning, optimization
│
└─ Deep Analysis (> 60s)
   └─ Use: reasoning (o1)
      Cost: $15/1M input
      Use Cases: Complex problem solving, research
```

### 2.2 Agent-Specific Model Mapping

| Agent | Primary | Fallback 1 | Fallback 2 | Reasoning |
|-------|---------|-----------|-----------|-----------|
| Strategy | powerful | balanced | fast | Needs complex analysis |
| Copywriting | balanced | fast | powerful | Quality matters, speed ok |
| Visual AI | fast | balanced | powerful | Quick generation |
| Media Buying | balanced | powerful | fast | Data analysis needed |
| Optimization | powerful | balanced | fast | Complex optimization |
| Video Gen | fast | balanced | powerful | Quick turnaround |
| Image Gen | fast | balanced | powerful | Quick turnaround |
| CEO Agent | reasoning | powerful | balanced | Deep strategic thinking |

---

## 3. Fallback Strategy

### 3.1 Fallback Chain

```
Primary Model (OpenAI GPT-4 Turbo)
    ↓ (on failure)
Fallback 1 (Anthropic Claude 3 Opus)
    ↓ (on failure)
Fallback 2 (Google Gemini 2.0 Pro)
    ↓ (on failure)
Fallback 3 (xAI Grok)
    ↓ (on failure)
Error Response
```

### 3.2 Fallback Triggers

- **Rate Limit:** Switch to next provider
- **Timeout:** Retry with fallback model
- **Authentication Error:** Skip provider, use fallback
- **Provider Outage:** Use fallback immediately
- **Quality Issues:** Log and try fallback

---

## 4. Observability Schema

### 4.1 Database Tables

```sql
-- Core request logging
CREATE TABLE llm_requests (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  model VARCHAR(50),
  provider VARCHAR(50),
  agent_name VARCHAR(100),
  function_name VARCHAR(100),
  task_id VARCHAR(36),
  batch_id VARCHAR(36),
  
  -- Request details
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  
  -- Performance
  latency_ms INT,
  
  -- Cost
  cost_usd DECIMAL(10, 6),
  
  -- Status
  status VARCHAR(20), -- success, fallback, error
  fallback_used BOOLEAN,
  fallback_reason TEXT,
  error_message TEXT,
  
  -- Metadata
  user_id VARCHAR(36),
  metadata JSON,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_model (model),
  INDEX idx_provider (provider),
  INDEX idx_agent (agent_name),
  INDEX idx_task (task_id)
);

-- Model comparison tracking
CREATE TABLE llm_model_comparisons (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  model_1 VARCHAR(50),
  model_1_tokens INT,
  model_1_cost DECIMAL(10, 6),
  model_1_latency INT,
  
  model_2 VARCHAR(50),
  model_2_tokens INT,
  model_2_cost DECIMAL(10, 6),
  model_2_latency INT,
  
  model_3 VARCHAR(50),
  model_3_tokens INT,
  model_3_cost DECIMAL(10, 6),
  model_3_latency INT,
  
  winner VARCHAR(50),
  analysis JSON,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_task (task_id)
);

-- Daily cost tracking
CREATE TABLE llm_cost_tracking (
  id VARCHAR(36) PRIMARY KEY,
  date DATE,
  provider VARCHAR(50),
  model VARCHAR(50),
  
  request_count INT,
  total_tokens INT,
  total_cost DECIMAL(10, 2),
  
  avg_latency_ms INT,
  success_rate DECIMAL(5, 2),
  
  UNIQUE KEY unique_date_provider_model (date, provider, model),
  INDEX idx_date (date),
  INDEX idx_provider (provider)
);

-- Fallback tracking
CREATE TABLE llm_fallback_events (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  request_id VARCHAR(50),
  
  primary_model VARCHAR(50),
  primary_provider VARCHAR(50),
  primary_error VARCHAR(255),
  
  fallback_model VARCHAR(50),
  fallback_provider VARCHAR(50),
  fallback_success BOOLEAN,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_primary_provider (primary_provider)
);

-- Cache statistics
CREATE TABLE llm_cache_stats (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  cache_hits INT,
  cache_misses INT,
  cache_hit_rate DECIMAL(5, 2),
  
  tokens_saved INT,
  cost_saved DECIMAL(10, 2),
  
  INDEX idx_timestamp (timestamp)
);
```

---

## 5. Cost Calculation

### 5.1 Pricing Structure

```typescript
// server/aiGateway/costCalculator.ts
const MODEL_PRICING = {
  // OpenAI
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gpt-4o': { input: 5 / 1_000_000, output: 15 / 1_000_000 },
  'gpt-4-turbo': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
  'o1': { input: 15 / 1_000_000, output: 60 / 1_000_000 },

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
  calculate(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) throw new Error(`Unknown model: ${model}`);

    return inputTokens * pricing.input + outputTokens * pricing.output;
  }

  estimateCost(model: string, estimatedTokens: number): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) throw new Error(`Unknown model: ${model}`);

    // Rough estimate: 70% input, 30% output
    return (
      estimatedTokens * 0.7 * pricing.input +
      estimatedTokens * 0.3 * pricing.output
    );
  }
}
```

---

## 6. Integration Points

### 6.1 Migration Map

| Current | New | File |
|---------|-----|------|
| invokeLLM | aiGateway.invoke | agentEngine.ts |
| invokeLLM | aiGateway.invoke | ceoAgentEngine.ts |
| invokeLLM | aiGateway.invoke | performanceAnalyticsEngine.ts |
| invokeLLM | aiGateway.invoke | crossSystemEngine.ts |
| invokeLLM | aiGateway.compareModels | Dashboard (new) |

---

## 7. Configuration Management

### 7.1 Environment Variables

```bash
# AI Gateway Configuration
VERCEL_AI_GATEWAY_API_KEY=xxx
VERCEL_AI_GATEWAY_BASE_URL=https://api.vercel.ai/v1

# Model Configuration
LLM_FAST_MODEL=gemini-2.5-flash
LLM_BALANCED_MODEL=gpt-4o
LLM_POWERFUL_MODEL=gpt-4-turbo
LLM_REASONING_MODEL=o1

# Provider API Keys
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
GOOGLE_GEMINI_API_KEY=xxx
XAI_API_KEY=xxx

# Observability
LLM_TRACKING_ENABLED=true
LLM_COST_TRACKING_ENABLED=true
LLM_CACHE_ENABLED=true
LLM_CACHE_TTL=3600

# Performance
LLM_REQUEST_TIMEOUT=30000
LLM_MAX_RETRIES=3
LLM_BATCH_SIZE=10
```

---

## 8. Error Handling

### 8.1 Error Categories

| Error | Handling | Fallback |
|-------|----------|----------|
| Rate Limit | Wait + Retry | Use fallback provider |
| Timeout | Retry with longer timeout | Use fallback model |
| Auth Error | Log + Alert | Use fallback provider |
| Invalid Request | Log + Return error | None |
| Provider Down | Immediate fallback | Try next provider |

---

**Status:** Design Complete ✓  
**Next Phase:** Phase 3 - Setup & Configuration
