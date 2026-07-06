/**
 * Model Router
 * Intelligent model selection based on task type and requirements
 */

export type TaskType =
  | 'planning'
  | 'worker'
  | 'guard'
  | 'reviewer'
  | 'analysis'
  | 'generation'
  | 'optimization';

export interface ModelCapability {
  reasoning_quality: number; // 0-100
  context_window: number; // tokens
  tool_call_stability: number; // 0-100
  patch_quality: number; // 0-100
  validation_reliability: number; // 0-100
  cost_per_iteration: number; // USD
  latency: number; // ms
  local_or_remote: 'local' | 'remote';
}

export interface ModelProfile {
  name: string;
  provider: string;
  capability: ModelCapability;
  supportedTasks: TaskType[];
  maxTokens: number;
  costPerMToken: number;
}

export class ModelRouter {
  private models: Map<string, ModelProfile> = new Map();
  private taskPreferences: Map<TaskType, string[]> = new Map();

  constructor() {
    this.initializeModels();
    this.initializeTaskPreferences();
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    // OpenAI Models
    this.models.set('gpt-4o-mini', {
      name: 'gpt-4o-mini',
      provider: 'openai',
      capability: {
        reasoning_quality: 75,
        context_window: 128000,
        tool_call_stability: 95,
        patch_quality: 85,
        validation_reliability: 90,
        cost_per_iteration: 0.001,
        latency: 300,
        local_or_remote: 'remote',
      },
      supportedTasks: ['worker', 'guard', 'analysis', 'generation'],
      maxTokens: 4096,
      costPerMToken: 0.15,
    });

    this.models.set('gpt-4o', {
      name: 'gpt-4o',
      provider: 'openai',
      capability: {
        reasoning_quality: 90,
        context_window: 128000,
        tool_call_stability: 98,
        patch_quality: 95,
        validation_reliability: 95,
        cost_per_iteration: 0.005,
        latency: 500,
        local_or_remote: 'remote',
      },
      supportedTasks: ['planning', 'worker', 'reviewer', 'analysis', 'optimization'],
      maxTokens: 8192,
      costPerMToken: 5,
    });

    this.models.set('o1-mini', {
      name: 'o1-mini',
      provider: 'openai',
      capability: {
        reasoning_quality: 95,
        context_window: 128000,
        tool_call_stability: 85,
        patch_quality: 90,
        validation_reliability: 92,
        cost_per_iteration: 0.003,
        latency: 1000,
        local_or_remote: 'remote',
      },
      supportedTasks: ['planning', 'analysis', 'optimization'],
      maxTokens: 4096,
      costPerMToken: 3,
    });

    // Anthropic Models
    this.models.set('claude-3-5-haiku', {
      name: 'claude-3-5-haiku',
      provider: 'anthropic',
      capability: {
        reasoning_quality: 70,
        context_window: 200000,
        tool_call_stability: 92,
        patch_quality: 80,
        validation_reliability: 85,
        cost_per_iteration: 0.0008,
        latency: 250,
        local_or_remote: 'remote',
      },
      supportedTasks: ['worker', 'generation', 'analysis'],
      maxTokens: 4096,
      costPerMToken: 0.8,
    });

    this.models.set('claude-3-5-sonnet', {
      name: 'claude-3-5-sonnet',
      provider: 'anthropic',
      capability: {
        reasoning_quality: 88,
        context_window: 200000,
        tool_call_stability: 96,
        patch_quality: 92,
        validation_reliability: 93,
        cost_per_iteration: 0.003,
        latency: 400,
        local_or_remote: 'remote',
      },
      supportedTasks: ['planning', 'worker', 'reviewer', 'analysis', 'optimization'],
      maxTokens: 8192,
      costPerMToken: 3,
    });

    // Google Models
    this.models.set('gemini-2.5-flash', {
      name: 'gemini-2.5-flash',
      provider: 'google',
      capability: {
        reasoning_quality: 72,
        context_window: 1000000,
        tool_call_stability: 88,
        patch_quality: 78,
        validation_reliability: 82,
        cost_per_iteration: 0.0005,
        latency: 200,
        local_or_remote: 'remote',
      },
      supportedTasks: ['worker', 'generation', 'analysis'],
      maxTokens: 4096,
      costPerMToken: 0.075,
    });

    this.models.set('gemini-2-pro', {
      name: 'gemini-2-pro',
      provider: 'google',
      capability: {
        reasoning_quality: 85,
        context_window: 1000000,
        tool_call_stability: 94,
        patch_quality: 88,
        validation_reliability: 90,
        cost_per_iteration: 0.002,
        latency: 400,
        local_or_remote: 'remote',
      },
      supportedTasks: ['planning', 'worker', 'reviewer', 'analysis', 'optimization'],
      maxTokens: 8192,
      costPerMToken: 2,
    });

    // xAI Models
    this.models.set('grok-2', {
      name: 'grok-2',
      provider: 'xai',
      capability: {
        reasoning_quality: 80,
        context_window: 128000,
        tool_call_stability: 90,
        patch_quality: 85,
        validation_reliability: 88,
        cost_per_iteration: 0.002,
        latency: 350,
        local_or_remote: 'remote',
      },
      supportedTasks: ['worker', 'analysis', 'optimization'],
      maxTokens: 4096,
      costPerMToken: 2,
    });
  }

  /**
   * Initialize task preferences
   */
  private initializeTaskPreferences(): void {
    this.taskPreferences.set('planning', [
      'gpt-4o',
      'claude-3-5-sonnet',
      'gemini-2-pro',
      'o1-mini',
    ]);

    this.taskPreferences.set('worker', [
      'gpt-4o-mini',
      'claude-3-5-haiku',
      'gemini-2.5-flash',
      'grok-2',
    ]);

    this.taskPreferences.set('guard', [
      'gpt-4o-mini',
      'claude-3-5-haiku',
      'gemini-2.5-flash',
    ]);

    this.taskPreferences.set('reviewer', [
      'gpt-4o',
      'claude-3-5-sonnet',
      'gemini-2-pro',
    ]);

    this.taskPreferences.set('analysis', [
      'gpt-4o',
      'claude-3-5-sonnet',
      'gemini-2-pro',
      'o1-mini',
    ]);

    this.taskPreferences.set('generation', [
      'gpt-4o-mini',
      'claude-3-5-haiku',
      'gemini-2.5-flash',
    ]);

    this.taskPreferences.set('optimization', [
      'gpt-4o',
      'claude-3-5-sonnet',
      'gemini-2-pro',
      'o1-mini',
    ]);
  }

  /**
   * Select best model for task
   */
  selectModel(taskType: TaskType, criteria?: 'speed' | 'quality' | 'cost'): string {
    const preferences = this.taskPreferences.get(taskType) || [];

    if (preferences.length === 0) {
      return 'gpt-4o-mini'; // Default fallback
    }

    if (!criteria) {
      return preferences[0]; // Return preferred model
    }

    const candidates = preferences
      .map((name) => this.models.get(name))
      .filter((m) => m !== undefined) as ModelProfile[];

    if (candidates.length === 0) {
      return preferences[0];
    }

    switch (criteria) {
      case 'speed':
        return candidates.reduce((best, current) =>
          current.capability.latency < best.capability.latency ? current : best
        ).name;

      case 'quality':
        return candidates.reduce((best, current) =>
          current.capability.reasoning_quality > best.capability.reasoning_quality
            ? current
            : best
        ).name;

      case 'cost':
        return candidates.reduce((best, current) =>
          current.capability.cost_per_iteration < best.capability.cost_per_iteration
            ? current
            : best
        ).name;

      default:
        return preferences[0];
    }
  }

  /**
   * Get model profile
   */
  getModel(name: string): ModelProfile | undefined {
    return this.models.get(name);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelProfile[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: string): ModelProfile[] {
    return Array.from(this.models.values()).filter((m) => m.provider === provider);
  }

  /**
   * Compare models for task
   */
  compareModels(taskType: TaskType): {
    name: string;
    reasoning: number;
    speed: number;
    cost: number;
    toolCalling: number;
  }[] {
    const preferences = this.taskPreferences.get(taskType) || [];

    return preferences
      .map((name) => this.models.get(name))
      .filter((m) => m !== undefined)
      .map((m) => ({
        name: m!.name,
        reasoning: m!.capability.reasoning_quality,
        speed: 100 - m!.capability.latency / 10, // Normalize latency
        cost: 100 - m!.capability.cost_per_iteration * 100000, // Normalize cost
        toolCalling: m!.capability.tool_call_stability,
      }));
  }

  /**
   * Add custom model
   */
  addModel(profile: ModelProfile): void {
    this.models.set(profile.name, profile);
  }
}
