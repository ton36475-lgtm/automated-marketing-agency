import { invokeLLM } from "./_core/llm";
import {
  createCeoDecision,
  createBoardMeeting,
  createSystemDirective,
  createPerformanceSnapshot,
  updateCeoDecision,
  updateBoardMeeting,
  updateSystemDirective,
  updateExecutiveGem,
  getExecutiveGems,
  getCeoDecisions,
  getDashboardStats,
  getCampaignsByUserId,
  getLeadsByUserId,
  getAgentTasksByUserId,
  logAgentActivity,
} from "./db";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CeoAnalysisInput {
  userId: number;
  analysisType: "full_review" | "campaign_review" | "budget_review" | "performance_review" | "emergency_assessment";
  context?: Record<string, unknown>;
}

export interface BoardMeetingInput {
  userId: number;
  topic: string;
  triggerType: "scheduled" | "event" | "manual" | "emergency";
  triggerReason?: string;
  context?: Record<string, unknown>;
}

export interface DirectiveInput {
  userId: number;
  fromGemId: number;
  toGemRole: string;
  directive: string;
  priority: "low" | "medium" | "high" | "critical";
  deadline?: Date;
}

// ─── Default Gem Configurations ──────────────────────────────────────────────
export const DEFAULT_GEMS = [
  {
    gemName: "CEO Gem",
    gemRole: "ceo" as const,
    systemPrompt: "You are the CEO of an AI-powered marketing agency. You oversee all operations, make strategic decisions about budget allocation, campaign launches, and resource management. You analyze performance data across all systems (Marketing Platform, Content Distribution, Trading) and make executive decisions to maximize ROI and growth.",
    personality: "Visionary, data-driven, decisive. Focuses on big-picture strategy while maintaining awareness of operational details. Balances risk and reward.",
    goals: ["Maximize overall ROI across all systems", "Ensure efficient resource allocation", "Drive sustainable growth", "Maintain system health above 90%"],
    kpis: ["Total Revenue", "Overall ROAS", "System Uptime", "Decision Success Rate"],
  },
  {
    gemName: "CMO Gem",
    gemRole: "cmo" as const,
    systemPrompt: "You are the Chief Marketing Officer. You oversee all marketing campaigns, content strategy, and brand positioning. You analyze campaign performance and make decisions about creative direction, audience targeting, and channel allocation.",
    personality: "Creative yet analytical. Understands both brand building and performance marketing. Data-informed creative decisions.",
    goals: ["Improve campaign ROAS", "Increase lead quality", "Optimize content performance", "Build brand awareness"],
    kpis: ["Campaign ROAS", "Lead Conversion Rate", "Content Engagement", "Brand Reach"],
  },
  {
    gemName: "CTO Gem",
    gemRole: "cto" as const,
    systemPrompt: "You are the Chief Technology Officer. You oversee all technical systems including the AI agents, automation pipelines, and integrations. You ensure system reliability, optimize agent performance, and manage technical resources.",
    personality: "Technical, systematic, reliability-focused. Balances innovation with stability. Proactive about system health.",
    goals: ["Maintain 99.9% system uptime", "Optimize agent execution speed", "Ensure data integrity", "Scale infrastructure efficiently"],
    kpis: ["System Uptime", "Agent Success Rate", "API Response Time", "Error Rate"],
  },
  {
    gemName: "CFO Gem",
    gemRole: "cfo" as const,
    systemPrompt: "You are the Chief Financial Officer. You oversee all financial aspects including ad spend budgets, ROI tracking, cost optimization, and financial forecasting. You ensure every dollar spent generates maximum return.",
    personality: "Analytical, conservative with spending, focused on unit economics. Data-driven financial decisions with risk management.",
    goals: ["Reduce CPA by 20%", "Maintain positive ROAS across all campaigns", "Optimize budget allocation", "Forecast revenue accurately"],
    kpis: ["Total Spend", "Average CPA", "Overall ROAS", "Budget Utilization"],
  },
  {
    gemName: "COO Gem",
    gemRole: "coo" as const,
    systemPrompt: "You are the Chief Operating Officer. You oversee day-to-day operations, coordinate between all agents and systems, manage workflows, and ensure smooth execution of all marketing operations.",
    personality: "Organized, process-oriented, efficiency-focused. Ensures smooth coordination between all moving parts.",
    goals: ["Streamline operations", "Reduce task completion time", "Improve agent coordination", "Eliminate bottlenecks"],
    kpis: ["Task Completion Rate", "Average Task Duration", "Agent Utilization", "Workflow Efficiency"],
  },
];

// ─── CEO Analysis Engine ─────────────────────────────────────────────────────
export async function runCeoAnalysis(input: CeoAnalysisInput) {
  const { userId, analysisType, context } = input;

  // Gather system-wide data
  const [dashboardStats, campaigns, leads, recentTasks, gems, recentDecisions] = await Promise.all([
    getDashboardStats(userId),
    getCampaignsByUserId(userId),
    getLeadsByUserId(userId, 50),
    getAgentTasksByUserId(userId, 20),
    getExecutiveGems(userId),
    getCeoDecisions(userId, 10),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const completedTasks = recentTasks.filter((t) => t.status === "completed");
  const failedTasks = recentTasks.filter((t) => t.status === "failed");

  const systemContext = {
    dashboard: dashboardStats,
    activeCampaigns: activeCampaigns.length,
    totalCampaigns: campaigns.length,
    totalLeads: leads.length,
    hotLeads: leads.filter((l) => l.status === "hot").length,
    recentTaskSuccess: completedTasks.length,
    recentTaskFailure: failedTasks.length,
    activeGems: gems.filter((g) => g.isActive).length,
    recentDecisions: recentDecisions.map((d) => ({
      type: d.decisionType,
      title: d.title,
      status: d.status,
      confidence: d.confidence,
    })),
    ...context,
  };

  const systemPrompt = `You are the CEO of an AI Marketing Automation Agency. You have access to real-time data across all systems. Your job is to analyze the current state and provide executive-level insights and decisions.

Current System State:
${JSON.stringify(systemContext, null, 2)}

Analysis Type: ${analysisType}`;

  const userPrompt = analysisType === "full_review"
    ? `Perform a comprehensive review of all systems. Analyze:
1. Overall system health and performance
2. Campaign effectiveness and ROI
3. Lead pipeline quality
4. Agent performance and utilization
5. Budget efficiency
6. Risk areas and opportunities

Provide specific, actionable recommendations with confidence scores.`
    : analysisType === "campaign_review"
    ? `Review all active campaigns. For each campaign, assess performance, identify issues, and recommend specific actions (scale, pause, optimize, or kill).`
    : analysisType === "budget_review"
    ? `Analyze current budget allocation across all campaigns and systems. Identify overspending, underspending, and reallocation opportunities.`
    : analysisType === "performance_review"
    ? `Review agent performance metrics. Identify top-performing and underperforming agents. Recommend optimization actions.`
    : `Assess the current emergency situation and provide immediate action recommendations.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ceo_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallAssessment: { type: "string", description: "High-level summary of system state" },
              healthScore: { type: "number", description: "System health score 0-100" },
              keyInsights: {
                type: "array",
                items: { type: "string" },
                description: "Top insights from the analysis",
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    target: { type: "string" },
                    priority: { type: "string" },
                    confidence: { type: "number" },
                    reasoning: { type: "string" },
                  },
                  required: ["action", "target", "priority", "confidence", "reasoning"],
                  additionalProperties: false,
                },
                description: "Specific actionable recommendations",
              },
              risks: {
                type: "array",
                items: { type: "string" },
                description: "Identified risks and concerns",
              },
              opportunities: {
                type: "array",
                items: { type: "string" },
                description: "Growth opportunities identified",
              },
            },
            required: ["overallAssessment", "healthScore", "keyInsights", "recommendations", "risks", "opportunities"],
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

    await logAgentActivity({
      userId,
      agentType: "orchestrator",
      action: `CEO Analysis: ${analysisType}`,
      details: `Health Score: ${(result as any).healthScore || "N/A"}, Recommendations: ${((result as any).recommendations || []).length}`,
      level: "success",
    });

    return {
      analysisType,
      result,
      systemContext,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    await logAgentActivity({
      userId,
      agentType: "orchestrator",
      action: `CEO Analysis Failed: ${analysisType}`,
      details: errMsg,
      level: "error",
    });
    throw error;
  }
}

// ─── Board Meeting Engine ────────────────────────────────────────────────────
export async function runBoardMeeting(input: BoardMeetingInput) {
  const { userId, topic, triggerType, triggerReason, context } = input;

  const gems = await getExecutiveGems(userId);
  const activeGems = gems.filter((g) => g.isActive);

  if (activeGems.length === 0) {
    throw new Error("No active executive gems found. Please initialize the board first.");
  }

  // Create the meeting record
  const meeting = await createBoardMeeting({
    userId,
    topic,
    triggerType,
    triggerReason: triggerReason || null,
    participants: activeGems.map((g) => ({ id: g.id, name: g.gemName, role: g.gemRole })),
    agenda: [topic],
    status: "in_progress",
    startedAt: new Date(),
  });

  // Gather context data
  const [dashboardStats, campaigns] = await Promise.all([
    getDashboardStats(userId),
    getCampaignsByUserId(userId),
  ]);

  const meetingContext = {
    topic,
    triggerType,
    triggerReason,
    systemState: dashboardStats,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    ...context,
  };

  // Run deliberation with all active gems
  const discussions: Array<{ gemName: string; gemRole: string; input: string; response: string }> = [];
  const decisions: Array<Record<string, unknown>> = [];
  const actionItems: Array<Record<string, unknown>> = [];

  for (const gem of activeGems) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `${gem.systemPrompt || `You are ${gem.gemName}, the ${gem.gemRole.toUpperCase()} of an AI marketing agency.`}
            
Your personality: ${gem.personality || "Professional and analytical"}
Your goals: ${JSON.stringify(gem.goals || [])}

You are in a board meeting discussing: "${topic}"
Meeting context: ${JSON.stringify(meetingContext)}
Previous discussion points: ${JSON.stringify(discussions.map((d) => `${d.gemName}: ${d.response.substring(0, 200)}`))}`,
          },
          {
            role: "user",
            content: `As the ${gem.gemRole.toUpperCase()}, provide your perspective on "${topic}". Include:
1. Your assessment from your role's perspective
2. Specific recommendations
3. Any concerns or risks from your domain
4. Action items you'd propose

Be concise but specific. Format as JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "board_input",
            strict: true,
            schema: {
              type: "object",
              properties: {
                assessment: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
                concerns: { type: "array", items: { type: "string" } },
                actionItems: { type: "array", items: { type: "string" } },
                vote: { type: "string", description: "approve, reject, or abstain" },
              },
              required: ["assessment", "recommendations", "concerns", "actionItems", "vote"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
      } catch {
        parsed = { assessment: rawContent };
      }

      discussions.push({
        gemName: gem.gemName,
        gemRole: gem.gemRole,
        input: topic,
        response: JSON.stringify(parsed),
      });

      if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
        for (const item of parsed.actionItems) {
          actionItems.push({
            from: gem.gemName,
            role: gem.gemRole,
            action: item,
          });
        }
      }

      // Update gem's last action
      await updateExecutiveGem(gem.id, {
        lastAction: new Date(),
        totalDecisions: (gem.totalDecisions || 0) + 1,
      });
    } catch (error) {
      discussions.push({
        gemName: gem.gemName,
        gemRole: gem.gemRole,
        input: topic,
        response: `Error: ${error instanceof Error ? error.message : "Failed to get input"}`,
      });
    }
  }

  // CEO makes final decision based on all inputs
  const ceoGem = activeGems.find((g) => g.gemRole === "ceo") || activeGems[0];
  try {
    const finalResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the CEO making the final decision after hearing from all board members.

Board Discussion Summary:
${discussions.map((d) => `${d.gemName} (${d.gemRole}): ${d.response}`).join("\n\n")}`,
        },
        {
          role: "user",
          content: `Based on all board member inputs, make a final executive decision on "${topic}". Synthesize all perspectives and provide a clear decision with action plan.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ceo_decision",
          strict: true,
          schema: {
            type: "object",
            properties: {
              decision: { type: "string" },
              reasoning: { type: "string" },
              actionPlan: { type: "array", items: { type: "string" } },
              assignedTo: { type: "array", items: { type: "string" } },
              timeline: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["decision", "reasoning", "actionPlan", "assignedTo", "timeline", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawFinal = finalResponse.choices[0]?.message?.content;
    let finalDecision: Record<string, unknown> = {};
    try {
      finalDecision = JSON.parse(typeof rawFinal === "string" ? rawFinal : "{}");
    } catch {
      finalDecision = { decision: rawFinal };
    }

    decisions.push(finalDecision);

    // Save the CEO decision
    await createCeoDecision({
      userId,
      gemId: ceoGem.id,
      decisionType: "team_directive",
      title: `Board Decision: ${topic}`,
      reasoning: (finalDecision.reasoning as string) || "",
      context: meetingContext,
      action: finalDecision,
      confidence: String(finalDecision.confidence || 75),
      status: "approved",
    });
  } catch (error) {
    decisions.push({ error: error instanceof Error ? error.message : "Failed to make final decision" });
  }

  // Update meeting record
  await updateBoardMeeting(meeting!.id, {
    discussion: discussions,
    decisions,
    actionItems,
    status: "completed",
    completedAt: new Date(),
  });

  await logAgentActivity({
    userId,
    agentType: "orchestrator",
    action: `Board Meeting: ${topic}`,
    details: `${activeGems.length} participants, ${decisions.length} decisions, ${actionItems.length} action items`,
    level: "success",
  });

  return {
    meetingId: meeting!.id,
    topic,
    participants: activeGems.map((g) => g.gemName),
    discussions,
    decisions,
    actionItems,
    timestamp: new Date().toISOString(),
  };
}

// ─── Issue Directive ─────────────────────────────────────────────────────────
export async function issueCeoDirective(input: DirectiveInput) {
  const directive = await createSystemDirective({
    userId: input.userId,
    fromGemId: input.fromGemId,
    toGemRole: input.toGemRole,
    directive: input.directive,
    priority: input.priority,
    deadline: input.deadline || null,
    status: "pending",
  });

  await logAgentActivity({
    userId: input.userId,
    agentType: "orchestrator",
    action: `Directive issued to ${input.toGemRole}`,
    details: input.directive.substring(0, 200),
    level: "info",
  });

  return directive;
}

// ─── Take Performance Snapshot ───────────────────────────────────────────────
export async function takePerformanceSnapshot(userId: number) {
  const [dashboardStats, campaigns, leads] = await Promise.all([
    getDashboardStats(userId),
    getCampaignsByUserId(userId),
    getLeadsByUserId(userId, 1000),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.budgetSpent || 0), 0);
  const totalRevenue = totalSpend * 2.5; // Estimated based on avg ROAS

  await createPerformanceSnapshot({
    userId,
    snapshotDate: new Date(),
    totalSpend: String(totalSpend),
    totalRevenue: String(totalRevenue),
    totalLeads: leads.length,
    totalConversions: leads.filter((l) => l.status === "converted").length,
    activeCampaigns: activeCampaigns.length,
    activeAgents: 7,
    systemHealth: "95.00",
    aiDecisionsMade: dashboardStats?.completedTasks || 0,
    aiDecisionsSuccess: dashboardStats?.completedTasks || 0,
    insights: {
      topCampaign: activeCampaigns[0]?.name || "None",
      avgCampaignBudget: activeCampaigns.length > 0
        ? activeCampaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0) / activeCampaigns.length
        : 0,
    },
  });

  return {
    timestamp: new Date().toISOString(),
    totalSpend,
    totalRevenue,
    totalLeads: leads.length,
    activeCampaigns: activeCampaigns.length,
    systemHealth: 95,
  };
}
