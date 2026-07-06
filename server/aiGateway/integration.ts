/**
 * AI Gateway Integration Wrappers
 * Adapters for existing engines to use Unified AI Gateway Client
 */

import { UnifiedAIGatewayClient } from './client';
import { ModelRouter, type TaskType } from './modelRouter';
import type { LLMRequest, Message } from './types';

export class AIGatewayIntegration {
  private client: UnifiedAIGatewayClient;
  private router: ModelRouter;

  constructor(client: UnifiedAIGatewayClient) {
    this.client = client;
    this.router = new ModelRouter();
  }

  /**
   * Invoke LLM for CEO Analysis
   */
  async invokeCEOAnalysis(
    systemPrompt: string,
    userMessage: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('analysis', 'quality');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'powerful', // Use powerful tier for CEO analysis
      temperature: 0.7,
      maxTokens: 2048,
      metadata: {
        ...metadata,
        agentName: 'CEO_Gem',
        functionName: 'analysis',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Invoke LLM for Agent Performance Analysis
   */
  async invokePerformanceAnalysis(
    systemPrompt: string,
    performanceData: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('analysis', 'quality');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze the following performance data:\n\n${performanceData}`,
        },
      ],
      model: 'balanced',
      temperature: 0.5,
      maxTokens: 1024,
      metadata: {
        ...metadata,
        agentName: 'Performance_Monitor',
        functionName: 'analysis',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Invoke LLM for Cross-System Analysis
   */
  async invokeCrossSystemAnalysis(
    systemPrompt: string,
    marketingData: string,
    seoData: string,
    tradingData: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('analysis', 'quality');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze cross-system data:\n\nMarketing:\n${marketingData}\n\nSEO:\n${seoData}\n\nTrading:\n${tradingData}`,
        },
      ],
      model: 'powerful',
      temperature: 0.6,
      maxTokens: 2048,
      metadata: {
        ...metadata,
        agentName: 'CrossSystem_Analyzer',
        functionName: 'cross_system_analysis',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Invoke LLM for Content Generation
   */
  async invokeContentGeneration(
    systemPrompt: string,
    prompt: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('generation', 'speed');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      model: 'fast',
      temperature: 0.8,
      maxTokens: 1024,
      metadata: {
        ...metadata,
        agentName: 'Content_Generator',
        functionName: 'generate',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Invoke LLM for Optimization
   */
  async invokeOptimization(
    systemPrompt: string,
    data: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('optimization', 'quality');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: data },
      ],
      model: 'powerful',
      temperature: 0.5,
      maxTokens: 1024,
      metadata: {
        ...metadata,
        agentName: 'Optimizer',
        functionName: 'optimize',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Invoke LLM for Planning
   */
  async invokePlanning(
    systemPrompt: string,
    requirements: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const model = this.router.selectModel('planning', 'quality');

    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: requirements },
      ],
      model: 'powerful',
      temperature: 0.7,
      maxTokens: 2048,
      metadata: {
        ...metadata,
        agentName: 'Planner',
        functionName: 'plan',
        taskId: `task_${Date.now()}`,
      },
    };

    const response = await this.client.invoke(request);
    return response.content;
  }

  /**
   * Get available models for task
   */
  getModelsForTask(taskType: TaskType) {
    return this.router.compareModels(taskType);
  }

  /**
   * Get stats
   */
  async getStats() {
    return this.client.getStats();
  }

  /**
   * Get loop harness status
   */
  getLoopHarnessStatus() {
    return this.client.getLoopHarnessStatus();
  }
}
