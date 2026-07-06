/**
 * Fallback Manager
 * Manages fallback logic for model failures
 */

export class FallbackManager {
  private fallbackOrder: string[];
  private currentIndex: number = 0;
  private failedModels: Set<string> = new Set();

  constructor(fallbackOrder: string[]) {
    this.fallbackOrder = fallbackOrder;
  }

  /**
   * Get next model in fallback chain
   */
  getNextModel(): string | null {
    while (this.currentIndex < this.fallbackOrder.length) {
      const model = this.fallbackOrder[this.currentIndex];
      this.currentIndex++;

      if (!this.failedModels.has(model)) {
        return model;
      }
    }

    return null;
  }

  /**
   * Mark model as failed
   */
  markFailed(model: string): void {
    this.failedModels.add(model);
  }

  /**
   * Reset fallback chain
   */
  reset(): void {
    this.currentIndex = 0;
    this.failedModels.clear();
  }

  /**
   * Get current fallback chain status
   */
  getStatus() {
    return {
      totalModels: this.fallbackOrder.length,
      currentIndex: this.currentIndex,
      failedModels: Array.from(this.failedModels),
      remainingModels: this.fallbackOrder.slice(this.currentIndex),
      isExhausted: this.currentIndex >= this.fallbackOrder.length,
    };
  }

  /**
   * Get fallback chain
   */
  getChain(): string[] {
    return this.fallbackOrder;
  }
}
