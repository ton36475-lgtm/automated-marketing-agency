/**
 * Cross-System Analysis Engine
 * 
 * Aggregates data from Marketing, Travobet SEO, and Polymarket Trading
 * to provide unified insights, synergy detection, and cross-system optimization.
 */

import { invokeLLM } from "../_core/llm";
import {
  createCrossSystemAnalysis,
  getCrossSystemAnalyses,
  getLatestCrossSystemAnalysis,
  getLatestSeoData,
  getLatestTradingData,
  getDashboardStats,
  getCampaignsByUserId,
  getLeadsByUserId,
  getSystemModules,
  logAgentActivity,
} from "../db";

export interface CrossSystemReport {
  marketing: Record<string, unknown>;
  seo: Record<string, unknown>;
  trading: Record<string, unknown>;
  unified: {
    overallHealthScore: number;
    totalRevenue: number;
    totalSpend: number;
    overallROI: number;
    insights: string[];
    synergies: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
}

// ─── Run Cross-System Analysis ──────────────────────────────────────────────
export async function runCrossSystemAnalysis(
  userId: number,
  analysisType: "cross_system_review" | "synergy_analysis" | "risk_assessment" | "resource_optimization" | "unified_report" = "cross_system_review"
): Promise<CrossSystemReport> {
  // Gather data from all three systems
  const [dashboardStats, campaigns, leads, seoData, tradingData, modules] = await Promise.all([
    getDashboardStats(userId),
    getCampaignsByUserId(userId),
    getLeadsByUserId(userId, 100),
    getLatestSeoData(userId),
    getLatestTradingData(userId),
    getSystemModules(userId),
  ]);

  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const totalAdSpend = campaigns.reduce((sum, c) => sum + Number(c.budgetSpent || 0), 0);

  const marketingData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: activeCampaigns.length,
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.status === "hot").length,
    qualifiedLeads: leads.filter(l => l.status === "qualified").length,
    totalAdSpend,
    avgRoas: activeCampaigns.length > 0
      ? activeCampaigns.reduce((sum, c) => sum + Number(c.roas || 0), 0) / activeCampaigns.length
      : 0,
    totalImpressions: campaigns.reduce((sum, c) => sum + Number(c.impressions || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + Number(c.clicks || 0), 0),
    totalConversions: campaigns.reduce((sum, c) => sum + Number(c.conversions || 0), 0),
    dashboardStats,
  };

  const seoSummary = seoData ? {
    domain: seoData.domain,
    organicTraffic: Number(seoData.organicTraffic || 0),
    organicRevenue: Number(seoData.organicRevenue || 0),
    domainAuthority: Number(seoData.domainAuthority || 0),
    totalKeywords: seoData.totalKeywords,
    rankedKeywords: seoData.rankedKeywords,
    avgPosition: Number(seoData.avgPosition || 0),
    totalBacklinks: seoData.totalBacklinks,
    technicalHealth: Number(seoData.technicalHealth || 0),
    indexedPages: seoData.indexedPages,
    siteSpeed: Number(seoData.siteSpeed || 0),
    topKeywords: seoData.topKeywords,
    contentDistribution: seoData.contentDistribution,
  } : { status: "not_connected", message: "SEO data not available. Connect Travobet SEO module first." };

  const tradingSummary = tradingData ? {
    portfolioValue: Number(tradingData.portfolioValue || 0),
    totalPnl: Number(tradingData.totalPnl || 0),
    realizedPnl: Number(tradingData.realizedPnl || 0),
    unrealizedPnl: Number(tradingData.unrealizedPnl || 0),
    openPositions: tradingData.openPositions,
    totalPositions: tradingData.totalPositions,
    winRate: Number(tradingData.winRate || 0),
    avgReturn: Number(tradingData.avgReturn || 0),
    riskScore: Number(tradingData.riskScore || 0),
    dailyVolume: Number(tradingData.dailyVolume || 0),
    activeMarkets: tradingData.activeMarkets,
    signals: tradingData.signals,
  } : { status: "not_connected", message: "Trading data not available. Connect Polymarket module first." };

  const moduleStatuses = modules.map(m => ({
    name: m.moduleName,
    type: m.moduleType,
    status: m.status,
    healthScore: Number(m.healthScore || 0),
    isConnected: m.isConnected,
    lastSync: m.lastSyncAt,
  }));

  // Run LLM analysis across all systems
  const analysisPrompts: Record<string, string> = {
    cross_system_review: `Perform a comprehensive cross-system review. Analyze how Marketing, SEO, and Trading systems are performing individually and together. Identify correlations, dependencies, and areas where one system's performance affects others.`,
    synergy_analysis: `Analyze potential synergies between Marketing campaigns, SEO content distribution, and Trading positions. Identify how these systems can amplify each other's results. For example: how marketing campaigns can boost SEO, how SEO traffic can improve trading signals, etc.`,
    risk_assessment: `Assess risks across all three systems. Identify vulnerabilities, over-dependencies, concentration risks, and potential failure cascades. Provide risk mitigation strategies.`,
    resource_optimization: `Analyze resource allocation across Marketing (ad spend), SEO (content investment), and Trading (capital deployment). Recommend optimal rebalancing to maximize total ROI.`,
    unified_report: `Generate a unified executive report covering all three systems. Include key metrics, trends, achievements, concerns, and strategic recommendations for the next period.`,
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are the Cross-System Analysis Engine for an AI-powered agency that manages three interconnected systems:

1. **Marketing Automation** - Ad campaigns, lead generation, content creation
2. **Travobet SEO** - Content distribution, keyword rankings, organic traffic
3. **Polymarket Trading** - Prediction market positions, P&L, market signals

Current System Data:
- Marketing: ${JSON.stringify(marketingData)}
- SEO: ${JSON.stringify(seoSummary)}
- Trading: ${JSON.stringify(tradingSummary)}
- Module Statuses: ${JSON.stringify(moduleStatuses)}

Analyze the data holistically and provide actionable cross-system insights.`,
      },
      {
        role: "user",
        content: analysisPrompts[analysisType] || analysisPrompts.cross_system_review,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "cross_system_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallHealthScore: { type: "number", description: "Unified health score 0-100" },
            totalRevenue: { type: "number" },
            totalSpend: { type: "number" },
            overallROI: { type: "number" },
            insights: { type: "array", items: { type: "string" }, description: "Cross-system insights" },
            synergies: { type: "array", items: { type: "string" }, description: "Identified synergies between systems" },
            recommendations: { type: "array", items: { type: "string" }, description: "Strategic recommendations" },
            risks: { type: "array", items: { type: "string" }, description: "Cross-system risks" },
            opportunities: { type: "array", items: { type: "string" }, description: "Growth opportunities" },
            systemScores: {
              type: "object",
              properties: {
                marketing: { type: "number" },
                seo: { type: "number" },
                trading: { type: "number" },
              },
              required: ["marketing", "seo", "trading"],
              additionalProperties: false,
            },
          },
          required: ["overallHealthScore", "totalRevenue", "totalSpend", "overallROI", "insights", "synergies", "recommendations", "risks", "opportunities", "systemScores"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices[0]?.message?.content;
  let unified: any;
  try {
    unified = JSON.parse(typeof raw === "string" ? raw : "{}");
  } catch {
    unified = { overallHealthScore: 0, insights: [], synergies: [], recommendations: [], risks: [], opportunities: [] };
  }

  // Save analysis to DB
  await createCrossSystemAnalysis({
    userId,
    analysisType,
    marketingData,
    seoData: seoSummary,
    tradingData: tradingSummary,
    insights: unified.insights,
    recommendations: unified.recommendations,
    synergies: unified.synergies,
    risks: unified.risks,
    overallHealthScore: String(unified.overallHealthScore || 0),
  });

  await logAgentActivity({
    userId,
    agentType: "orchestrator",
    action: `Cross-System Analysis: ${analysisType}`,
    details: `Health: ${unified.overallHealthScore}, Insights: ${(unified.insights || []).length}, Synergies: ${(unified.synergies || []).length}`,
    level: "success",
  });

  return {
    marketing: marketingData,
    seo: seoSummary,
    trading: tradingSummary,
    unified: {
      overallHealthScore: unified.overallHealthScore || 0,
      totalRevenue: unified.totalRevenue || 0,
      totalSpend: unified.totalSpend || 0,
      overallROI: unified.overallROI || 0,
      insights: unified.insights || [],
      synergies: unified.synergies || [],
      recommendations: unified.recommendations || [],
      risks: unified.risks || [],
      opportunities: unified.opportunities || [],
    },
  };
}

// ─── Get Cross-System Overview ──────────────────────────────────────────────
export async function getCrossSystemOverview(userId: number) {
  const [modules, seoData, tradingData, dashboardStats, latestAnalysis] = await Promise.all([
    getSystemModules(userId),
    getLatestSeoData(userId),
    getLatestTradingData(userId),
    getDashboardStats(userId),
    getLatestCrossSystemAnalysis(userId),
  ]);

  return {
    modules: modules.map(m => ({
      id: m.id,
      name: m.moduleName,
      type: m.moduleType,
      status: m.status,
      healthScore: Number(m.healthScore || 0),
      isConnected: m.isConnected,
      lastSync: m.lastSyncAt,
      metrics: m.metrics,
    })),
    marketing: {
      isConnected: true, // Marketing is always connected (it's the main platform)
      status: "online",
      stats: dashboardStats,
    },
    seo: {
      isConnected: !!seoData,
      status: modules.find(m => m.moduleType === "seo")?.status ?? "offline",
      healthScore: Number(modules.find(m => m.moduleType === "seo")?.healthScore ?? 0),
      latestData: seoData ? {
        domain: seoData.domain,
        organicTraffic: Number(seoData.organicTraffic || 0),
        domainAuthority: Number(seoData.domainAuthority || 0),
        totalKeywords: seoData.totalKeywords,
        rankedKeywords: seoData.rankedKeywords,
        totalBacklinks: seoData.totalBacklinks,
        technicalHealth: Number(seoData.technicalHealth || 0),
        snapshotDate: seoData.snapshotDate,
      } : null,
    },
    trading: {
      isConnected: !!tradingData,
      status: modules.find(m => m.moduleType === "trading")?.status ?? "offline",
      healthScore: Number(modules.find(m => m.moduleType === "trading")?.healthScore ?? 0),
      latestData: tradingData ? {
        portfolioValue: Number(tradingData.portfolioValue || 0),
        totalPnl: Number(tradingData.totalPnl || 0),
        openPositions: tradingData.openPositions,
        winRate: Number(tradingData.winRate || 0),
        riskScore: Number(tradingData.riskScore || 0),
        snapshotDate: tradingData.snapshotDate,
      } : null,
    },
    latestAnalysis: latestAnalysis ? {
      id: latestAnalysis.id,
      type: latestAnalysis.analysisType,
      healthScore: Number(latestAnalysis.overallHealthScore || 0),
      insights: latestAnalysis.insights,
      recommendations: latestAnalysis.recommendations,
      synergies: latestAnalysis.synergies,
      risks: latestAnalysis.risks,
      createdAt: latestAnalysis.createdAt,
    } : null,
  };
}

// ─── Get Analysis History ───────────────────────────────────────────────────
export async function getAnalysisHistory(userId: number, limit = 10) {
  return getCrossSystemAnalyses(userId, limit);
}
