import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import {
  createAgentTask,
  createAdCreative,
  logAgentActivity,
  updateAgentTask,
  updateCampaign,
} from "./db";

export type AgentType = "strategy" | "copywriting" | "visual" | "media_buying" | "optimization" | "orchestrator";

export interface AgentInput {
  userId: number;
  campaignId?: number;
  taskType: string;
  payload: Record<string, unknown>;
}

export interface AgentOutput {
  taskId: number;
  result: Record<string, unknown>;
  tokensUsed: number;
}

// ─── Strategy Agent ───────────────────────────────────────────────────────────
export async function runStrategyAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "strategy",
    taskType: input.taskType,
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "strategy",
    action: `Starting task: ${input.taskType}`,
    details: JSON.stringify(input.payload),
    level: "info",
    campaignId: input.campaignId,
  });

  try {
    const { product, targetMarket, budget, competitors, objectives } = input.payload as {
      product?: string;
      targetMarket?: string;
      budget?: number;
      competitors?: string[];
      objectives?: string[];
    };

    const systemPrompt = `You are an expert Digital Marketing Strategist and Market Research Analyst specializing in performance marketing, growth hacking, and data-driven campaign strategy. You analyze markets, identify opportunities, and create comprehensive marketing strategies.`;

    const userPrompt = `Analyze the following and create a comprehensive marketing strategy:

Product/Service: ${product || "Not specified"}
Target Market: ${targetMarket || "Not specified"}
Budget: ${budget ? `$${budget}` : "Not specified"}
Competitors: ${competitors?.join(", ") || "None specified"}
Objectives: ${objectives?.join(", ") || "Not specified"}

Please provide:
1. Market Analysis & Opportunity Assessment
2. Ideal Customer Profile (ICP) with psychographics
3. Competitive Advantage & Positioning Statement
4. Campaign Strategy with 3 phases
5. KPI Goals (ROAS target, CPA target, CTR benchmark, Conversion Rate)
6. Recommended Ad Formats & Platforms
7. Content Pillars & Messaging Framework
8. Budget Allocation Recommendation

Format as structured JSON with keys: marketAnalysis, icp, positioning, campaignPhases, kpiGoals, platforms, contentPillars, budgetAllocation`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "strategy_output",
          strict: true,
          schema: {
            type: "object",
            properties: {
              marketAnalysis: { type: "string" },
              icp: { type: "string" },
              positioning: { type: "string" },
              campaignPhases: { type: "string" },
              kpiGoals: { type: "string" },
              platforms: { type: "string" },
              contentPillars: { type: "string" },
              budgetAllocation: { type: "string" },
            },
            required: ["marketAnalysis", "icp", "positioning", "campaignPhases", "kpiGoals", "platforms", "contentPillars", "budgetAllocation"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawOutput: content };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    if (input.campaignId && result.kpiGoals) {
      await updateCampaign(input.campaignId, {
        strategyBrief: `${result.marketAnalysis || ""}\n\n${result.positioning || ""}`,
        kpiGoals: result.kpiGoals as Record<string, unknown>,
      });
    }

    await logAgentActivity({
      userId: input.userId,
      agentType: "strategy",
      action: `Strategy analysis completed`,
      details: `Generated comprehensive marketing strategy in ${execTime}ms`,
      level: "success",
      campaignId: input.campaignId,
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, {
      status: "failed",
      errorMessage: errMsg,
      completedAt: new Date(),
    });
    await logAgentActivity({
      userId: input.userId,
      agentType: "strategy",
      action: `Task failed: ${input.taskType}`,
      details: errMsg,
      level: "error",
      campaignId: input.campaignId,
    });
    throw error;
  }
}

// ─── Copywriting Agent ────────────────────────────────────────────────────────
export async function runCopywritingAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "copywriting",
    taskType: input.taskType,
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "copywriting",
    action: `Generating copy: ${input.taskType}`,
    level: "info",
    campaignId: input.campaignId,
  });

  try {
    const { product, audience, tone, platform, strategy, variants = 3 } = input.payload as {
      product?: string;
      audience?: string;
      tone?: string;
      platform?: string;
      strategy?: string;
      variants?: number;
    };

    const systemPrompt = `You are an elite Direct Response Copywriter and Brand Storyteller with expertise in digital advertising, emotional persuasion, and conversion optimization. You create compelling ad copy that drives action using proven frameworks like AIDA, PAS, and Multi-Sensory Emotional Appeal.`;

    const userPrompt = `Create ${variants} high-converting ad copy variants for:

Product/Service: ${product || "Not specified"}
Target Audience: ${audience || "Not specified"}
Tone of Voice: ${tone || "Professional yet conversational"}
Platform: ${platform || "Meta (Facebook/Instagram)"}
Marketing Strategy Context: ${strategy || "Not specified"}

For each variant provide:
- Headline (max 40 chars)
- Primary Text (max 125 chars)
- Description (max 30 chars)
- CTA Button Text
- Emotional Hook used
- Framework applied (AIDA/PAS/etc)

Return as JSON with key "variants" containing array of copy objects.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "copy_output",
          strict: true,
          schema: {
            type: "object",
            properties: {
              variants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    primaryText: { type: "string" },
                    description: { type: "string" },
                    cta: { type: "string" },
                    emotionalHook: { type: "string" },
                    framework: { type: "string" },
                  },
                  required: ["headline", "primaryText", "description", "cta", "emotionalHook", "framework"],
                  additionalProperties: false,
                },
              },
            },
            required: ["variants"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawOutput: content };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    // Save each copy variant as an ad creative
    const variantList = (result.variants as Array<Record<string, string>>) || [];
    for (const variant of variantList) {
      await createAdCreative({
        userId: input.userId,
        campaignId: input.campaignId,
        agentTaskId: taskResult.insertId as number,
        type: "copy",
        platform: (platform?.toLowerCase() as "meta" | "google" | "tiktok" | "line" | "general") || "general",
        title: variant.headline,
        content: `${variant.primaryText}\n\n${variant.description}\n\nCTA: ${variant.cta}`,
        status: "draft",
      });
    }

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    await logAgentActivity({
      userId: input.userId,
      agentType: "copywriting",
      action: `Generated ${variantList.length} copy variants`,
      details: `Completed in ${execTime}ms`,
      level: "success",
      campaignId: input.campaignId,
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    await logAgentActivity({ userId: input.userId, agentType: "copywriting", action: "Task failed", details: errMsg, level: "error", campaignId: input.campaignId });
    throw error;
  }
}

// ─── Visual Agent ─────────────────────────────────────────────────────────────
export async function runVisualAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "visual",
    taskType: input.taskType,
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "visual",
    action: `Generating visual: ${input.taskType}`,
    level: "info",
    campaignId: input.campaignId,
  });

  try {
    const { prompt, style, brand, platform } = input.payload as {
      prompt: string;
      style?: string;
      brand?: string;
      platform?: string;
    };

    // First, enhance the prompt with LLM
    const enhanceResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert AI Art Director specializing in digital advertising visuals. Enhance image generation prompts to create stunning, high-converting ad visuals.",
        },
        {
          role: "user",
          content: `Enhance this image prompt for a ${platform || "social media"} ad:
Original: ${prompt}
Brand/Style: ${brand || style || "modern, professional"}
Make it highly detailed, photorealistic, and optimized for advertising. Return only the enhanced prompt, no explanation.`,
        },
      ],
    });

    const rawEnhanced = enhanceResponse.choices[0]?.message?.content;
    const enhancedPrompt = typeof rawEnhanced === "string" ? rawEnhanced : prompt;

    // Generate the image
    const { url: imageUrl } = await generateImage({ prompt: enhancedPrompt });

    const result = {
      imageUrl,
      originalPrompt: prompt,
      enhancedPrompt,
      platform: platform || "general",
    };

    const execTime = Date.now() - startTime;

    await createAdCreative({
      userId: input.userId,
      campaignId: input.campaignId,
      agentTaskId: taskResult.insertId as number,
      type: "image",
      platform: (platform?.toLowerCase() as "meta" | "google" | "tiktok" | "line" | "general") || "general",
      title: `AI Visual - ${new Date().toLocaleDateString()}`,
      imageUrl,
      imagePrompt: enhancedPrompt,
      status: "draft",
    });

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed: enhanceResponse.usage?.total_tokens || 0,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    await logAgentActivity({
      userId: input.userId,
      agentType: "visual",
      action: `Visual asset generated`,
      details: `Image created in ${execTime}ms`,
      level: "success",
      campaignId: input.campaignId,
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed: enhanceResponse.usage?.total_tokens || 0 };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    await logAgentActivity({ userId: input.userId, agentType: "visual", action: "Task failed", details: errMsg, level: "error", campaignId: input.campaignId });
    throw error;
  }
}

// ─── Media Buying Agent ───────────────────────────────────────────────────────
export async function runMediaBuyingAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "media_buying",
    taskType: input.taskType,
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "media_buying",
    action: `Media buying task: ${input.taskType}`,
    level: "info",
    campaignId: input.campaignId,
  });

  try {
    const { budget, objective, audience, campaignName, strategy } = input.payload as {
      budget?: number;
      objective?: string;
      audience?: string;
      campaignName?: string;
      strategy?: string;
    };

    const systemPrompt = `You are an expert Media Buyer and Paid Advertising Specialist with deep expertise in Meta Ads (Facebook/Instagram), Google Ads, and performance marketing. You optimize for ROAS, CPA, and scale winning campaigns.`;

    const userPrompt = `Create a comprehensive media buying plan for:

Campaign: ${campaignName || "New Campaign"}
Budget: $${budget || 0}/day
Objective: ${objective || "Conversions"}
Target Audience: ${audience || "Not specified"}
Strategy Context: ${strategy || "Not specified"}

Provide:
1. Campaign Structure (Campaign > Ad Sets > Ads hierarchy)
2. Audience Targeting Strategy (Broad vs. Interest vs. Lookalike)
3. Budget Allocation (Testing vs. Scaling split)
4. Bidding Strategy recommendation
5. Ad Scheduling recommendations
6. A/B Testing plan
7. Scaling triggers and thresholds
8. Risk management rules

Return as structured JSON.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "media_buying_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              campaignStructure: { type: "string" },
              audienceStrategy: { type: "string" },
              budgetAllocation: { type: "string" },
              biddingStrategy: { type: "string" },
              adScheduling: { type: "string" },
              abTestingPlan: { type: "string" },
              scalingTriggers: { type: "string" },
              riskManagement: { type: "string" },
            },
            required: ["campaignStructure", "audienceStrategy", "budgetAllocation", "biddingStrategy", "adScheduling", "abTestingPlan", "scalingTriggers", "riskManagement"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawOutput: content };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    await logAgentActivity({
      userId: input.userId,
      agentType: "media_buying",
      action: `Media buying plan generated`,
      details: `Completed in ${execTime}ms`,
      level: "success",
      campaignId: input.campaignId,
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    await logAgentActivity({ userId: input.userId, agentType: "media_buying", action: "Task failed", details: errMsg, level: "error", campaignId: input.campaignId });
    throw error;
  }
}

// ─── Optimization Agent ───────────────────────────────────────────────────────
export async function runOptimizationAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "optimization",
    taskType: input.taskType,
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "optimization",
    action: `Optimization analysis: ${input.taskType}`,
    level: "info",
    campaignId: input.campaignId,
  });

  try {
    const { metrics, rules, campaignData } = input.payload as {
      metrics?: Record<string, number>;
      rules?: Array<Record<string, unknown>>;
      campaignData?: Record<string, unknown>;
    };

    const systemPrompt = `You are an expert Campaign Optimization Specialist and Data Analyst with deep expertise in ROAS optimization, budget scaling, and automated advertising rules. You analyze performance data and make data-driven decisions to maximize ROI.`;

    const userPrompt = `Analyze campaign performance and provide optimization recommendations:

Current Metrics:
${JSON.stringify(metrics || {}, null, 2)}

Active Rules:
${JSON.stringify(rules || [], null, 2)}

Campaign Data:
${JSON.stringify(campaignData || {}, null, 2)}

Provide:
1. Performance Assessment (what's working, what's not)
2. Immediate Actions Required (Stop Loss triggers, Scale Winners)
3. Budget Reallocation Recommendations
4. Creative Fatigue Analysis
5. Audience Optimization Suggestions
6. Next 7-day Forecast
7. Automated Rule Recommendations

Apply these rule thresholds:
- Stop Loss: spend > 1.5x CPA target with 0 conversions
- Scale Winners: CPA < target OR purchases > 3/day → increase budget 20%
- Aggressive Scaling: ROAS > 3 AND purchases > 5 → increase budget 50-100%
- Ad Fatigue: Frequency > 3 AND CTR < 1% for 7 days

Return as structured JSON.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "optimization_output",
          strict: true,
          schema: {
            type: "object",
            properties: {
              performanceAssessment: { type: "string" },
              immediateActions: { type: "string" },
              budgetReallocation: { type: "string" },
              creativeFatigue: { type: "string" },
              audienceOptimization: { type: "string" },
              forecast: { type: "string" },
              ruleRecommendations: { type: "string" },
            },
            required: ["performanceAssessment", "immediateActions", "budgetReallocation", "creativeFatigue", "audienceOptimization", "forecast", "ruleRecommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawOutput: content };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    await logAgentActivity({
      userId: input.userId,
      agentType: "optimization",
      action: `Optimization analysis completed`,
      details: `Generated recommendations in ${execTime}ms`,
      level: "success",
      campaignId: input.campaignId,
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    await logAgentActivity({ userId: input.userId, agentType: "optimization", action: "Task failed", details: errMsg, level: "error", campaignId: input.campaignId });
    throw error;
  }
}

// ─── Lead Scoring Agent ───────────────────────────────────────────────────────
export async function runLeadScoringAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "orchestrator",
    taskType: "lead_scoring",
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  try {
    const { lead } = input.payload as { lead: Record<string, unknown> };

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert Lead Qualification Specialist using predictive AI to score leads based on their profile, behavior, and engagement signals.",
        },
        {
          role: "user",
          content: `Score this lead from 0-100 and classify as Hot/Warm/Cold:

Lead Data: ${JSON.stringify(lead, null, 2)}

Consider: company size, job title seniority, engagement level, industry fit, budget signals, urgency indicators.

Return JSON with: score (0-100), classification (hot/warm/cold), reason (string), nextAction (string)`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number" },
              classification: { type: "string" },
              reason: { type: "string" },
              nextAction: { type: "string" },
            },
            required: ["score", "classification", "reason", "nextAction"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent2 = response.choices[0]?.message?.content;
    const content = typeof rawContent2 === "string" ? rawContent2 : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { score: 50, classification: "warm", reason: "Unable to parse", nextAction: "Manual review" };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    throw error;
  }
}

// ─── Competitor Analysis Agent ────────────────────────────────────────────────
export async function runCompetitorAnalysisAgent(input: AgentInput): Promise<AgentOutput> {
  const startTime = Date.now();
  const taskResult = await createAgentTask({
    userId: input.userId,
    campaignId: input.campaignId,
    agentType: "strategy",
    taskType: "competitor_analysis",
    status: "running",
    inputData: input.payload,
    startedAt: new Date(),
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "strategy",
    action: `Analyzing competitor: ${(input.payload as { competitorName?: string }).competitorName}`,
    level: "info",
  });

  try {
    const { competitorName, website, industry, ourProduct } = input.payload as {
      competitorName: string;
      website?: string;
      industry?: string;
      ourProduct?: string;
    };

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert Competitive Intelligence Analyst specializing in digital marketing, advertising strategies, and market positioning.",
        },
        {
          role: "user",
          content: `Analyze this competitor and provide actionable intelligence:

Competitor: ${competitorName}
Website: ${website || "Unknown"}
Industry: ${industry || "Unknown"}
Our Product Context: ${ourProduct || "Not specified"}

Provide comprehensive analysis:
1. Likely Strengths (based on industry knowledge)
2. Potential Weaknesses & Gaps
3. Estimated Ad Strategies & Messaging
4. Key Keywords they likely target
5. Estimated Budget Range
6. Social Media Presence estimate
7. Strategic Insights for us to exploit
8. Recommended Counter-strategies

Return as structured JSON.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "competitor_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              adStrategies: { type: "array", items: { type: "string" } },
              keywords: { type: "array", items: { type: "string" } },
              estimatedBudget: { type: "string" },
              socialPresence: { type: "string" },
              insights: { type: "string" },
              counterStrategies: { type: "array", items: { type: "string" } },
            },
            required: ["strengths", "weaknesses", "adStrategies", "keywords", "estimatedBudget", "socialPresence", "insights", "counterStrategies"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawOutput: content };
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    const execTime = Date.now() - startTime;

    await updateAgentTask(taskResult.insertId as number, {
      status: "completed",
      outputData: result,
      tokensUsed,
      executionTimeMs: execTime,
      completedAt: new Date(),
    });

    await logAgentActivity({
      userId: input.userId,
      agentType: "strategy",
      action: `Competitor analysis completed: ${competitorName}`,
      details: `Analysis completed in ${execTime}ms`,
      level: "success",
    });

    return { taskId: taskResult.insertId as number, result, tokensUsed };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await updateAgentTask(taskResult.insertId as number, { status: "failed", errorMessage: errMsg, completedAt: new Date() });
    throw error;
  }
}
