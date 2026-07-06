import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CostCalculator } from './aiGateway/costCalculator';
import { ObservabilityService } from './aiGateway/observability';
import { FallbackManager } from './aiGateway/fallback';
import { LoopHarness } from './aiGateway/loopHarness';
import { ModelRouter } from './aiGateway/modelRouter';
import { AIGatewayIntegration } from './aiGateway/integration';
import { UnifiedAIGatewayClient } from './aiGateway/client';

describe('AI Gateway Module', () => {
  describe('CostCalculator', () => {
    let calculator: CostCalculator;

    beforeEach(() => {
      calculator = new CostCalculator();
    });

    it('should calculate cost for gpt-4o-mini', () => {
      const cost = calculator.calculate('gpt-4o-mini', 1000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01);
    });

    it('should estimate cost based on tokens', () => {
      const estimated = calculator.estimateCost('gpt-4o', 1000);
      expect(estimated).toBeGreaterThan(0);
    });

    it('should get cost breakdown', () => {
      const breakdown = calculator.getBreakdown('gpt-4o', 1000, 500);
      expect(breakdown.model).toBe('gpt-4o');
      expect(breakdown.inputTokens).toBe(1000);
      expect(breakdown.outputTokens).toBe(500);
      expect(breakdown.totalTokens).toBe(1500);
      expect(breakdown.totalCost).toBeGreaterThan(0);
    });

    it('should compare costs across models', () => {
      const costs = calculator.compareCosts(1000, 500);
      expect(Object.keys(costs).length).toBeGreaterThan(0);
      expect(costs['gpt-4o-mini']).toBeLessThan(costs['gpt-4o']);
    });

    it('should get cheapest model', () => {
      const cheapest = calculator.getCheapestModel(1000, 500);
      expect(cheapest).toBeTruthy();
      expect(typeof cheapest).toBe('string');
    });
  });

  describe('ObservabilityService', () => {
    let service: ObservabilityService;

    beforeEach(() => {
      service = new ObservabilityService();
    });

    it('should log request', async () => {
      await service.log({
        requestId: 'test_req_1',
        model: 'gpt-4o-mini',
        tokens: 100,
        cost: 0.001,
        latency: 500,
        provider: 'openai',
        status: 'success',
      });

      const stats = await service.getRequestStats();
      expect(stats).toBeTruthy();
      expect(stats?.totalRequests).toBe(1);
    });

    it('should track fallback events', async () => {
      await service.logFallback({
        requestId: 'test_req_2',
        primaryModel: 'gpt-4o',
        primaryProvider: 'openai',
        primaryError: 'Rate limit exceeded',
        fallbackModel: 'claude-3-5-sonnet',
        fallbackProvider: 'anthropic',
        fallbackSuccess: true,
        timestamp: Date.now(),
      });

      const fallbackStats = await service.getFallbackStats();
      expect(fallbackStats).toBeTruthy();
    });

    it('should calculate cost breakdown', async () => {
      await service.log({
        requestId: 'test_req_3',
        model: 'gpt-4o',
        tokens: 100,
        cost: 0.005,
        latency: 500,
        provider: 'openai',
        status: 'success',
      });

      await service.log({
        requestId: 'test_req_4',
        model: 'claude-3-5-sonnet',
        tokens: 100,
        cost: 0.003,
        latency: 400,
        provider: 'anthropic',
        status: 'success',
      });

      const breakdown = await service.getCostBreakdown();
      expect(breakdown).toBeTruthy();
      expect(breakdown?.breakdown).toBeTruthy();
    });
  });

  describe('FallbackManager', () => {
    let manager: FallbackManager;

    beforeEach(() => {
      manager = new FallbackManager([
        'gpt-4o',
        'claude-3-5-sonnet',
        'gemini-2-pro',
      ]);
    });

    it('should get next model in fallback chain', () => {
      const first = manager.getNextModel();
      expect(first).toBe('gpt-4o');

      const second = manager.getNextModel();
      expect(second).toBe('claude-3-5-sonnet');
    });

    it('should mark model as failed', () => {
      manager.markFailed('gpt-4o');
      const next = manager.getNextModel();
      expect(next).toBe('claude-3-5-sonnet');
    });

    it('should return null when chain exhausted', () => {
      manager.markFailed('gpt-4o');
      manager.markFailed('claude-3-5-sonnet');
      manager.markFailed('gemini-2-pro');
      const next = manager.getNextModel();
      expect(next).toBeNull();
    });

    it('should reset fallback chain', () => {
      manager.markFailed('gpt-4o');
      manager.reset();
      const status = manager.getStatus();
      expect(status.failedModels).toHaveLength(0);
      expect(status.currentIndex).toBe(0);
    });
  });

  describe('LoopHarness', () => {
    let harness: LoopHarness;

    beforeEach(() => {
      harness = new LoopHarness({
        objectiveLock: {
          currentGate: 'P076A',
          allowedGateRefs: ['P075', 'P057'],
          blockedGateRefs: ['P123', 'P127'],
        },
        scopeGuard: {
          activeFocus: ['sirinx.co', 'AGM AutoFlow'],
          pausedOutOfScope: ['Kusala', 'Final Farewell'],
          hardFailIfCandidateContainsPausedScope: true,
        },
        mutationGuard: {
          currentMode: 'review_or_manifest_only',
          blocked: ['stage', 'commit', 'push', 'deploy'],
        },
        stopTests: {
          passRequired: ['test_1', 'test_2'],
          stopBefore: ['P076B', 'commit'],
        },
        maxIterations: 3,
      });
    });

    it('should check objective lock', () => {
      const result = harness.checkObjectiveLock('Working on P075');
      expect(result.passed).toBe(true);

      const blocked = harness.checkObjectiveLock('Referencing P123');
      expect(blocked.passed).toBe(false);
    });

    it('should check scope guard', () => {
      const result = harness.checkScopeGuard('Working on sirinx.co');
      expect(result.passed).toBe(true);

      const outOfScope = harness.checkScopeGuard('Kusala project');
      expect(outOfScope.passed).toBe(false);
    });

    it('should check mutation guard', () => {
      const result = harness.checkMutationGuard('review');
      expect(result.passed).toBe(true);

      const blocked = harness.checkMutationGuard('commit');
      expect(blocked.passed).toBe(false);
    });

    it('should check stop tests', () => {
      const result = harness.checkStopTests({ test_1: true, test_2: true });
      expect(result.passed).toBe(true);

      const failed = harness.checkStopTests({ test_1: true, test_2: false });
      expect(failed.passed).toBe(false);
    });

    it('should track iterations', () => {
      harness.incrementIteration();
      harness.incrementIteration();
      const status = harness.getStatus();
      expect(status.iterationCount).toBe(2);

      harness.incrementIteration();
      harness.incrementIteration(); // Should exceed max
      const exhausted = harness.checkMaxIterations();
      expect(exhausted.passed).toBe(false);
    });
  });

  describe('ModelRouter', () => {
    let router: ModelRouter;

    beforeEach(() => {
      router = new ModelRouter();
    });

    it('should select model for planning task', () => {
      const model = router.selectModel('planning');
      expect(model).toBeTruthy();
      expect(['gpt-4o', 'claude-3-5-sonnet', 'gemini-2-pro', 'o1-mini']).toContain(
        model
      );
    });

    it('should select fastest model for worker task', () => {
      const model = router.selectModel('worker', 'speed');
      expect(model).toBeTruthy();
    });

    it('should select cheapest model', () => {
      const model = router.selectModel('generation', 'cost');
      expect(model).toBeTruthy();
    });

    it('should get model profile', () => {
      const profile = router.getModel('gpt-4o');
      expect(profile).toBeTruthy();
      expect(profile?.name).toBe('gpt-4o');
      expect(profile?.provider).toBe('openai');
    });

    it('should get all models', () => {
      const models = router.getAllModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should compare models for task', () => {
      const comparison = router.compareModels('analysis');
      expect(comparison.length).toBeGreaterThan(0);
      expect(comparison[0]).toHaveProperty('name');
      expect(comparison[0]).toHaveProperty('reasoning');
      expect(comparison[0]).toHaveProperty('speed');
      expect(comparison[0]).toHaveProperty('cost');
    });
  });

  describe('AIGatewayIntegration', () => {
    let integration: AIGatewayIntegration;
    let mockClient: UnifiedAIGatewayClient;

    beforeEach(() => {
      mockClient = new UnifiedAIGatewayClient({
        apiKey: 'test_key',
        baseUrl: 'https://api.example.com',
        models: {
          fast: 'gpt-4o-mini',
          balanced: 'gpt-4o',
          powerful: 'o1-mini',
          reasoning: 'o1',
        },
        fallbackOrder: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2-pro'],
        requestTimeout: 30000,
        maxRetries: 3,
        observability: {
          trackTokens: true,
          trackLatency: true,
          trackCost: true,
          trackFallbacks: true,
        },
      });

      integration = new AIGatewayIntegration(mockClient);
    });

    it('should get models for task', () => {
      const models = integration.getModelsForTask('analysis');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('name');
    });

    it('should get stats', async () => {
      const stats = await integration.getStats();
      expect(stats).toBeTruthy();
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('costs');
    });
  });

  describe('UnifiedAIGatewayClient', () => {
    let client: UnifiedAIGatewayClient;

    beforeEach(() => {
      client = new UnifiedAIGatewayClient({
        apiKey: 'test_key',
        baseUrl: 'https://api.example.com',
        models: {
          fast: 'gpt-4o-mini',
          balanced: 'gpt-4o',
          powerful: 'o1-mini',
          reasoning: 'o1',
        },
        fallbackOrder: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2-pro'],
        requestTimeout: 30000,
        maxRetries: 3,
        observability: {
          trackTokens: true,
          trackLatency: true,
          trackCost: true,
          trackFallbacks: true,
        },
      });
    });

    it('should estimate cost', () => {
      const cost = client.estimateCost('gpt-4o', 1000);
      expect(cost).toBeGreaterThan(0);
    });

    it('should compare models', () => {
      const comparison = client.compareModels(1000, 500);
      expect(Object.keys(comparison).length).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      client.clearCache();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
