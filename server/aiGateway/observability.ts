/**
 * Observability Service
 * Tracks and logs all LLM requests for monitoring and analysis
 */

import type {
  ObservabilityLog,
  BatchLog,
  ErrorLog,
  FallbackEvent,
  ModelComparison,
} from './types';

export class ObservabilityService {
  private logs: ObservabilityLog[] = [];
  private comparisons: ModelComparison[] = [];
  private fallbacks: FallbackEvent[] = [];

  /**
   * Log a single LLM request
   */
  async log(data: ObservabilityLog): Promise<void> {
    try {
      this.logs.push(data);
      console.log(
        `[LLM] ${data.model} | ${data.tokens} tokens | $${data.cost.toFixed(4)} | ${data.latency}ms | ${data.status}`
      );
    } catch (error) {
      console.error('Failed to log observability data:', error);
    }
  }

  /**
   * Log cache hit
   */
  async logCacheHit(requestId: string, cacheKey: string): Promise<void> {
    try {
      console.log(`[CACHE HIT] ${requestId} | ${cacheKey}`);
    } catch (error) {
      console.error('Failed to log cache hit:', error);
    }
  }

  /**
   * Log batch operation
   */
  async logBatch(data: BatchLog): Promise<void> {
    try {
      console.log(
        `[BATCH] ${data.batchId}: ${data.requestCount} requests, $${data.totalCost.toFixed(4)} cost, ${data.totalLatency}ms latency`
      );
    } catch (error) {
      console.error('Failed to log batch:', error);
    }
  }

  /**
   * Log error
   */
  async logError(data: ErrorLog): Promise<void> {
    try {
      console.error(
        `[ERROR] ${data.error}${data.fallbackFailed ? ' (fallback failed)' : ''}`
      );
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  /**
   * Log model comparison
   */
  async logComparison(comparison: ModelComparison): Promise<void> {
    try {
      this.comparisons.push(comparison);
      console.log(
        `[COMPARISON] ${comparison.taskId} | Winner: ${comparison.analysis.recommendation}`
      );
    } catch (error) {
      console.error('Failed to log comparison:', error);
    }
  }

  /**
   * Log fallback event
   */
  async logFallback(event: FallbackEvent): Promise<void> {
    try {
      this.fallbacks.push(event);
      console.log(
        `[FALLBACK] ${event.requestId} | ${event.primaryModel} → ${event.fallbackModel} | Success: ${event.fallbackSuccess}`
      );
    } catch (error) {
      console.error('Failed to log fallback event:', error);
    }
  }

  /**
   * Get request stats
   */
  async getRequestStats(days: number = 7) {
    try {
      const stats = this.logs;

      return {
        totalRequests: stats.length,
        totalTokens: stats.reduce((sum: number, r: any) => sum + r.tokens, 0),
        totalCost: stats.reduce((sum: number, r: any) => sum + r.cost, 0),
        avgLatency:
          stats.reduce((sum: number, r: any) => sum + r.latency, 0) /
          (stats.length || 1),
        successRate:
          (stats.filter((r: any) => r.status === 'success').length /
            (stats.length || 1)) *
          100,
      };
    } catch (error) {
      console.error('Failed to get request stats:', error);
      return null;
    }
  }

  /**
   * Get model comparison stats
   */
  async getModelComparisonStats(days: number = 7) {
    try {
      return {
        totalComparisons: this.comparisons.length,
        comparisons: this.comparisons.map((c: any) => ({
          taskId: c.taskId,
          timestamp: c.timestamp,
          winner: c.analysis.recommendation,
          analysis: c.analysis,
        })),
      };
    } catch (error) {
      console.error('Failed to get model comparison stats:', error);
      return null;
    }
  }

  /**
   * Get cost breakdown by provider
   */
  async getCostBreakdown(days: number = 7) {
    try {
      const breakdown: Record<string, number> = {};
      let total = 0;

      for (const log of this.logs as any[]) {
        if (!breakdown[log.provider]) {
          breakdown[log.provider] = 0;
        }
        breakdown[log.provider] += log.cost;
        total += log.cost;
      }

      return {
        total,
        breakdown,
        percentage: Object.entries(breakdown).reduce(
          (acc: Record<string, any>, [provider, cost]) => {
            acc[provider] = ((cost / total) * 100).toFixed(2);
            return acc;
          },
          {} as Record<string, any>
        ),
      };
    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      return null;
    }
  }

  /**
   * Get fallback stats
   */
  async getFallbackStats() {
    try {
      const successCount = this.fallbacks.filter((f) => f.fallbackSuccess).length;
      const failureCount = this.fallbacks.length - successCount;

      return {
        totalFallbacks: this.fallbacks.length,
        successCount,
        failureCount,
        successRate:
          (successCount / (this.fallbacks.length || 1)) * 100,
        byProvider: this.fallbacks.reduce(
          (acc: Record<string, number>, f) => {
            const key = `${f.primaryProvider} → ${f.fallbackProvider}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          {}
        ),
      };
    } catch (error) {
      console.error('Failed to get fallback stats:', error);
      return null;
    }
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs(): void {
    this.logs = [];
    this.comparisons = [];
    this.fallbacks = [];
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return {
      requests: this.logs,
      comparisons: this.comparisons,
      fallbacks: this.fallbacks,
    };
  }
}
