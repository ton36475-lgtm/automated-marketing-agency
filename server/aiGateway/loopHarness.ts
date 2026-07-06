/**
 * Loop Harness Guards
 * Implements Loop-Engineered Harness concepts for quality assurance
 */

export interface LoopHarnessConfig {
  objectiveLock: {
    currentGate: string;
    allowedGateRefs: string[];
    blockedGateRefs: string[];
  };
  scopeGuard: {
    activeFocus: string[];
    pausedOutOfScope: string[];
    hardFailIfCandidateContainsPausedScope: boolean;
  };
  mutationGuard: {
    currentMode: 'review_or_manifest_only' | 'safe_mutations' | 'full_access';
    blocked: string[];
  };
  stopTests: {
    passRequired: string[];
    stopBefore: string[];
  };
  maxIterations: number;
}

export class LoopHarness {
  private config: LoopHarnessConfig;
  private iterationCount: number = 0;
  private violations: string[] = [];

  constructor(config: LoopHarnessConfig) {
    this.config = config;
  }

  /**
   * Check if content violates objective lock
   */
  checkObjectiveLock(content: string): { passed: boolean; reason?: string } {
    const blockedRefs = this.config.objectiveLock.blockedGateRefs;

    for (const ref of blockedRefs) {
      if (content.includes(ref)) {
        const violation = `Objective lock violation: found blocked reference ${ref}`;
        this.violations.push(violation);
        return { passed: false, reason: violation };
      }
    }

    return { passed: true };
  }

  /**
   * Check if content violates scope guard
   */
  checkScopeGuard(content: string): { passed: boolean; reason?: string } {
    const paused = this.config.scopeGuard.pausedOutOfScope;

    if (this.config.scopeGuard.hardFailIfCandidateContainsPausedScope) {
      for (const scope of paused) {
        if (content.toLowerCase().includes(scope.toLowerCase())) {
          const violation = `Scope guard violation: found paused scope "${scope}"`;
          this.violations.push(violation);
          return { passed: false, reason: violation };
        }
      }
    }

    return { passed: true };
  }

  /**
   * Check if operation is blocked by mutation guard
   */
  checkMutationGuard(operation: string): { passed: boolean; reason?: string } {
    if (this.config.mutationGuard.currentMode === 'review_or_manifest_only') {
      if (this.config.mutationGuard.blocked.includes(operation)) {
        const violation = `Mutation guard violation: operation "${operation}" is blocked in ${this.config.mutationGuard.currentMode} mode`;
        this.violations.push(violation);
        return { passed: false, reason: violation };
      }
    }

    return { passed: true };
  }

  /**
   * Check if stop tests are met
   */
  checkStopTests(testResults: Record<string, boolean>): {
    passed: boolean;
    reason?: string;
  } {
    const required = this.config.stopTests.passRequired;

    for (const test of required) {
      if (!testResults[test]) {
        const violation = `Stop test failed: ${test}`;
        this.violations.push(violation);
        return { passed: false, reason: violation };
      }
    }

    return { passed: true };
  }

  /**
   * Check if max iterations exceeded
   */
  checkMaxIterations(): { passed: boolean; reason?: string } {
    if (this.iterationCount >= this.config.maxIterations) {
      const violation = `Max iterations exceeded: ${this.iterationCount} / ${this.config.maxIterations}`;
      this.violations.push(violation);
      return { passed: false, reason: violation };
    }

    return { passed: true };
  }

  /**
   * Increment iteration count
   */
  incrementIteration(): void {
    this.iterationCount++;
  }

  /**
   * Run all guards
   */
  runAllGuards(content: string, operation: string, testResults: Record<string, boolean>): {
    passed: boolean;
    violations: string[];
  } {
    const checks = [
      this.checkObjectiveLock(content),
      this.checkScopeGuard(content),
      this.checkMutationGuard(operation),
      this.checkStopTests(testResults),
      this.checkMaxIterations(),
    ];

    const passed = checks.every((c) => c.passed);

    return {
      passed,
      violations: this.violations,
    };
  }

  /**
   * Get harness status
   */
  getStatus() {
    return {
      iterationCount: this.iterationCount,
      maxIterations: this.config.maxIterations,
      violations: this.violations,
      isExhausted: this.iterationCount >= this.config.maxIterations,
      objectiveLock: this.config.objectiveLock,
      scopeGuard: this.config.scopeGuard,
      mutationGuard: this.config.mutationGuard,
    };
  }

  /**
   * Reset harness
   */
  reset(): void {
    this.iterationCount = 0;
    this.violations = [];
  }
}
