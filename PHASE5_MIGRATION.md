# Phase 5: System Migration - Harness Tool Implementation

## Overview
Migrate all 3 system engines (CEO, Performance Analytics, Cross-System Analysis) to use AI Gateway with Harness Tool concepts for multi-model orchestration.

## Architecture: AI-to-AI Orchestration

```
CEO Gem (Planner)
  ↓ (calls via AI Gateway)
  ├→ Performance Monitor (Worker) - analyzes agent metrics
  ├→ Cross-System Analyzer (Worker) - analyzes synergies
  └→ Decision Reviewer (Reviewer) - validates decisions

Each engine uses:
- Model Router: Select appropriate model (Planner/Worker/Reviewer)
- Tool Calling: Read/write data, execute analysis, call other engines
- Loop Harness: Objective lock, scope guard, mutation guard, stop tests
- Observability: Track tokens, cost, latency, quality
```

## Migration Plan

### 1. CEO Engine Migration
**Current:** Uses invokeLLM directly
**Target:** Use AI Gateway with multi-model support

```typescript
// Before
const response = await invokeLLM({
  messages: [{ role: "system", content: "You are CEO..." }],
});

// After
const response = await aiGateway.chat({
  taskType: "strategic_planning",
  messages: [{ role: "system", content: "You are CEO..." }],
  tools: [
    { name: "analyzePerformance", description: "Call Performance Monitor" },
    { name: "analyzeCrossSystems", description: "Call Cross-System Analyzer" },
  ],
});
```

### 2. Performance Analytics Engine Migration
**Current:** Uses invokeLLM for analysis
**Target:** Use AI Gateway with tool calling for agent metrics

```typescript
// Tools available:
- readAgentMetrics(agentId) → fetch from DB
- calculatePerformanceScore(metrics) → deterministic
- compareModels(taskType, metrics) → compare model performance
- callCEOForInsights(data) → request CEO analysis
```

### 3. Cross-System Analysis Engine Migration
**Current:** Uses invokeLLM for analysis
**Target:** Use AI Gateway with tool calling for system integration

```typescript
// Tools available:
- readSystemData(systemId) → fetch SEO/Trading data
- analyzeCorrelations(data) → find synergies
- callPerformanceMonitor(query) → request performance data
- callCEO ForDecision(recommendation) → request CEO decision
```

## Implementation Steps

### Step 1: Update CEO Engine
1. Replace invokeLLM with aiGateway.chat
2. Add tool definitions for calling other engines
3. Implement tool handlers
4. Update tests

### Step 2: Update Performance Analytics Engine
1. Replace invokeLLM with aiGateway.chat
2. Add tool definitions for metrics analysis
3. Implement tool handlers
4. Update tests

### Step 3: Update Cross-System Analysis Engine
1. Replace invokeLLM with aiGateway.chat
2. Add tool definitions for system integration
3. Implement tool handlers
4. Update tests

### Step 4: Create AI-to-AI Communication Layer
1. Implement engine-to-engine calling protocol
2. Add request/response validation
3. Implement timeout & retry logic
4. Add observability tracking

### Step 5: Update tRPC Routers
1. Update CEO router to use new engine
2. Update Performance router to use new engine
3. Update Cross-System router to use new engine
4. Ensure backward compatibility

## Key Concepts: Harness Tool

### Model = Brain
- CEO Gem: Planner model (strategic thinking)
- Performance Monitor: Worker model (analysis)
- Cross-System Analyzer: Worker model (correlation)

### Tools = Arms & Legs
- Read: Access database, call other engines
- Write: Store decisions, update metrics
- Execute: Run analysis, calculate scores
- Call: Request other AI engines

### Context = Brain Size
- CEO: Full context (all systems)
- Performance Monitor: Agent-specific context
- Cross-System: System-specific context

### Loop Harness Guards
- Objective Lock: Stay focused on task
- Scope Guard: Don't go out of scope
- Mutation Guard: Validate before writing
- Stop Tests: Know when to stop

## Testing Strategy

### Unit Tests
- Test each engine independently
- Mock AI Gateway responses
- Verify tool calling

### Integration Tests
- Test CEO → Performance Monitor flow
- Test CEO → Cross-System Analyzer flow
- Test Performance Monitor → CEO flow
- Verify end-to-end orchestration

### Observability Tests
- Verify token tracking
- Verify cost calculation
- Verify latency measurement
- Verify fallback activation

## Success Criteria

✓ All 3 engines migrated to AI Gateway
✓ Multi-model orchestration working
✓ Tool calling between engines functional
✓ All tests passing (60+ tests)
✓ Observability dashboard showing metrics
✓ No performance degradation
✓ Cost tracking accurate
