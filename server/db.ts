import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adCreatives,
  agentActivityLog,
  agentTasks,
  analyticsMetrics,
  campaigns,
  competitorData,
  contentLibrary,
  InsertAdCreative,
  InsertAgentActivityLog,
  InsertAgentTask,
  InsertAnalyticsMetric,
  InsertCampaign,
  InsertCompetitorData,
  InsertIntegrationSettings,
  InsertLead,
  InsertOptimizationRule,
  InsertUser,
  integrationSettings,
  leads,
  metricsTracking,
  optimizationRules,
  orchestrationState,
  scheduledTasks,
  users,
  videoGenerationJobs,
  webhooks,
  systemModules,
  seoData,
  tradingData,
  crossSystemAnalysis,
  InsertSystemModule,
  InsertSeoData,
  InsertTradingData,
  InsertCrossSystemAnalysis,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export async function getCampaignsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result[0];
}

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(campaigns).values(data);
  // Get the last inserted campaign for this user
  const result = await db.select().from(campaigns).where(eq(campaigns.userId, data.userId)).orderBy(desc(campaigns.createdAt)).limit(1);
  return result[0];
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ─── Agent Tasks ──────────────────────────────────────────────────────────────
export async function getAgentTasksByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentTasks).where(eq(agentTasks.userId, userId)).orderBy(desc(agentTasks.createdAt)).limit(limit);
}

export async function getAgentTasksByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentTasks).where(eq(agentTasks.campaignId, campaignId)).orderBy(desc(agentTasks.createdAt));
}

export async function createAgentTask(data: InsertAgentTask) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(agentTasks).values(data);
  return result[0];
}

export async function updateAgentTask(id: number, data: Partial<InsertAgentTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(agentTasks).set(data).where(eq(agentTasks.id, id));
}

// ─── Ad Creatives ─────────────────────────────────────────────────────────────
export async function getAdCreativesByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adCreatives).where(eq(adCreatives.userId, userId)).orderBy(desc(adCreatives.createdAt)).limit(limit);
}

export async function getAdCreativesByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adCreatives).where(eq(adCreatives.campaignId, campaignId)).orderBy(desc(adCreatives.createdAt));
}

export async function createAdCreative(data: InsertAdCreative) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(adCreatives).values(data);
  return result[0];
}

export async function updateAdCreative(id: number, data: Partial<InsertAdCreative>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(adCreatives).set(data).where(eq(adCreatives.id, id));
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function getLeadsByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt)).limit(limit);
}

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(leads).values(data);
  return result[0];
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsByCampaign(campaignId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(analyticsMetrics.campaignId, campaignId)];
  if (from) conditions.push(gte(analyticsMetrics.date, from));
  if (to) conditions.push(lte(analyticsMetrics.date, to));
  return db.select().from(analyticsMetrics).where(and(...conditions)).orderBy(desc(analyticsMetrics.date));
}

export async function createAnalyticsMetric(data: InsertAnalyticsMetric) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(analyticsMetrics).values(data);
}

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [campaignCount] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.userId, userId));
  const [activeCampaigns] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(and(eq(campaigns.userId, userId), eq(campaigns.status, "active")));
  const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.userId, userId));
  const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(agentTasks).where(eq(agentTasks.userId, userId));
  const [completedTasks] = await db.select({ count: sql<number>`count(*)` }).from(agentTasks).where(and(eq(agentTasks.userId, userId), eq(agentTasks.status, "completed")));
  return {
    totalCampaigns: Number(campaignCount?.count ?? 0),
    activeCampaigns: Number(activeCampaigns?.count ?? 0),
    totalLeads: Number(leadCount?.count ?? 0),
    totalTasks: Number(taskCount?.count ?? 0),
    completedTasks: Number(completedTasks?.count ?? 0),
  };
}

// ─── Competitor Data ──────────────────────────────────────────────────────────
export async function getCompetitorsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitorData).where(eq(competitorData.userId, userId)).orderBy(desc(competitorData.createdAt));
}

export async function createCompetitorData(data: InsertCompetitorData) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(competitorData).values(data);
  return result[0];
}

export async function updateCompetitorData(id: number, data: Partial<InsertCompetitorData>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(competitorData).set(data).where(eq(competitorData.id, id));
}

export async function deleteCompetitorData(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(competitorData).where(eq(competitorData.id, id));
}

// ─── Optimization Rules ───────────────────────────────────────────────────────
export async function getOptimizationRulesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(optimizationRules).where(eq(optimizationRules.userId, userId)).orderBy(desc(optimizationRules.createdAt));
}

export async function createOptimizationRule(data: InsertOptimizationRule) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(optimizationRules).values(data);
  return result[0];
}

export async function updateOptimizationRule(id: number, data: Partial<InsertOptimizationRule>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(optimizationRules).set(data).where(eq(optimizationRules.id, id));
}

// ─── Agent Activity Log ───────────────────────────────────────────────────────
export async function getAgentActivityLog(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentActivityLog).where(eq(agentActivityLog.userId, userId)).orderBy(desc(agentActivityLog.createdAt)).limit(limit);
}

export async function logAgentActivity(data: InsertAgentActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(agentActivityLog).values(data);
}

// ─── Integration Settings ─────────────────────────────────────────────────────
export async function getIntegrationSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertIntegrationSettings(data: InsertIntegrationSettings) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateSet: Record<string, unknown> = { ...data };
  delete updateSet.id;
  delete updateSet.userId;
  await db.insert(integrationSettings).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────
export async function createScheduledTask(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(scheduledTasks).values(data);
}

export async function getScheduledTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledTasks).where(eq(scheduledTasks.userId, userId));
}

export async function updateScheduledTask(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(scheduledTasks).set(data).where(eq(scheduledTasks.id, id));
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────
export async function createWebhook(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(webhooks).values(data);
}

export async function getWebhooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.userId, userId));
}

export async function deleteWebhook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(webhooks).where(eq(webhooks.id, id));
}

// ─── Content Library ──────────────────────────────────────────────────────────
export async function createContentLibraryItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(contentLibrary).values(data);
}

export async function getContentLibrary(userId: number, campaignId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (campaignId) {
    return db
      .select()
      .from(contentLibrary)
      .where(eq(contentLibrary.userId, userId));
  }
  return db.select().from(contentLibrary).where(eq(contentLibrary.userId, userId));
}

// ─── Video Generation Jobs ────────────────────────────────────────────────────
export async function createVideoJob(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(videoGenerationJobs).values(data);
}

export async function getVideoJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoGenerationJobs).where(eq(videoGenerationJobs.userId, userId));
}

export async function updateVideoJob(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(videoGenerationJobs).set(data).where(eq(videoGenerationJobs.id, id));
}

// ─── Metrics Tracking ─────────────────────────────────────────────────────────
export async function createMetricsRecord(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(metricsTracking).values(data);
}

export async function getMetrics(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(metricsTracking).where(eq(metricsTracking.campaignId, campaignId));
}

// ─── Orchestration State ──────────────────────────────────────────────────────
export async function getOrchestrationState(campaignId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(orchestrationState)
    .where(eq(orchestrationState.campaignId, campaignId))
    .limit(1);
  return result[0] || null;
}

export async function updateOrchestrationStateData(campaignId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(orchestrationState).set(data).where(eq(orchestrationState.campaignId, campaignId));
}

// ─── Executive Gems (CEO Board) ──────────────────────────────────────────────
import {
  executiveGems,
  ceoDecisions,
  boardMeetings,
  systemDirectives,
  performanceSnapshots,
  InsertExecutiveGem,
  InsertCeoDecision,
  InsertBoardMeeting,
  InsertSystemDirective,
  InsertPerformanceSnapshot,
} from "../drizzle/schema";

export async function getExecutiveGems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(executiveGems).where(eq(executiveGems.userId, userId)).orderBy(desc(executiveGems.createdAt));
}

export async function getExecutiveGemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(executiveGems).where(eq(executiveGems.id, id)).limit(1);
  return result[0];
}

export async function createExecutiveGem(data: InsertExecutiveGem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(executiveGems).values(data);
  const result = await db.select().from(executiveGems).where(eq(executiveGems.userId, data.userId)).orderBy(desc(executiveGems.createdAt)).limit(1);
  return result[0];
}

export async function updateExecutiveGem(id: number, data: Partial<InsertExecutiveGem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(executiveGems).set(data).where(eq(executiveGems.id, id));
}

export async function deleteExecutiveGem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(executiveGems).where(eq(executiveGems.id, id));
}

// ─── CEO Decisions ───────────────────────────────────────────────────────────
export async function getCeoDecisions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ceoDecisions).where(eq(ceoDecisions.userId, userId)).orderBy(desc(ceoDecisions.createdAt)).limit(limit);
}

export async function getCeoDecisionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ceoDecisions).where(eq(ceoDecisions.id, id)).limit(1);
  return result[0];
}

export async function createCeoDecision(data: InsertCeoDecision) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(ceoDecisions).values(data);
  const result = await db.select().from(ceoDecisions).where(eq(ceoDecisions.userId, data.userId)).orderBy(desc(ceoDecisions.createdAt)).limit(1);
  return result[0];
}

export async function updateCeoDecision(id: number, data: Partial<InsertCeoDecision>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(ceoDecisions).set(data).where(eq(ceoDecisions.id, id));
}

// ─── Board Meetings ──────────────────────────────────────────────────────────
export async function getBoardMeetings(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boardMeetings).where(eq(boardMeetings.userId, userId)).orderBy(desc(boardMeetings.createdAt)).limit(limit);
}

export async function getBoardMeetingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boardMeetings).where(eq(boardMeetings.id, id)).limit(1);
  return result[0];
}

export async function createBoardMeeting(data: InsertBoardMeeting) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(boardMeetings).values(data);
  const result = await db.select().from(boardMeetings).where(eq(boardMeetings.userId, data.userId)).orderBy(desc(boardMeetings.createdAt)).limit(1);
  return result[0];
}

export async function updateBoardMeeting(id: number, data: Partial<InsertBoardMeeting>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(boardMeetings).set(data).where(eq(boardMeetings.id, id));
}

// ─── System Directives ───────────────────────────────────────────────────────
export async function getSystemDirectives(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemDirectives).where(eq(systemDirectives.userId, userId)).orderBy(desc(systemDirectives.createdAt)).limit(limit);
}

export async function createSystemDirective(data: InsertSystemDirective) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(systemDirectives).values(data);
  const result = await db.select().from(systemDirectives).where(eq(systemDirectives.userId, data.userId)).orderBy(desc(systemDirectives.createdAt)).limit(1);
  return result[0];
}

export async function updateSystemDirective(id: number, data: Partial<InsertSystemDirective>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(systemDirectives).set(data).where(eq(systemDirectives.id, id));
}

// ─── Performance Snapshots ───────────────────────────────────────────────────
export async function getPerformanceSnapshots(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(performanceSnapshots).where(eq(performanceSnapshots.userId, userId)).orderBy(desc(performanceSnapshots.createdAt)).limit(limit);
}

export async function createPerformanceSnapshot(data: InsertPerformanceSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(performanceSnapshots).values(data);
}

// ─── CEO Dashboard Stats ─────────────────────────────────────────────────────
export async function getCeoDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [gemCount] = await db.select({ count: sql<number>`count(*)` }).from(executiveGems).where(eq(executiveGems.userId, userId));
  const [activeGems] = await db.select({ count: sql<number>`count(*)` }).from(executiveGems).where(and(eq(executiveGems.userId, userId), eq(executiveGems.isActive, true)));
  const [decisionCount] = await db.select({ count: sql<number>`count(*)` }).from(ceoDecisions).where(eq(ceoDecisions.userId, userId));
  const [pendingDecisions] = await db.select({ count: sql<number>`count(*)` }).from(ceoDecisions).where(and(eq(ceoDecisions.userId, userId), eq(ceoDecisions.status, "pending")));
  const [meetingCount] = await db.select({ count: sql<number>`count(*)` }).from(boardMeetings).where(eq(boardMeetings.userId, userId));
  const [directiveCount] = await db.select({ count: sql<number>`count(*)` }).from(systemDirectives).where(eq(systemDirectives.userId, userId));
  const [pendingDirectives] = await db.select({ count: sql<number>`count(*)` }).from(systemDirectives).where(and(eq(systemDirectives.userId, userId), eq(systemDirectives.status, "pending")));

  return {
    totalGems: Number(gemCount?.count ?? 0),
    activeGems: Number(activeGems?.count ?? 0),
    totalDecisions: Number(decisionCount?.count ?? 0),
    pendingDecisions: Number(pendingDecisions?.count ?? 0),
    totalMeetings: Number(meetingCount?.count ?? 0),
    totalDirectives: Number(directiveCount?.count ?? 0),
    pendingDirectives: Number(pendingDirectives?.count ?? 0),
  };
}


// ─── System Modules ─────────────────────────────────────────────────────────
export async function getSystemModules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemModules).where(eq(systemModules.userId, userId)).orderBy(systemModules.moduleType);
}

export async function getSystemModule(userId: number, moduleType: "marketing" | "seo" | "trading") {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(systemModules).where(and(eq(systemModules.userId, userId), eq(systemModules.moduleType, moduleType))).limit(1);
  return rows[0] || null;
}

export async function upsertSystemModule(data: InsertSystemModule) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(systemModules).where(and(eq(systemModules.userId, data.userId), eq(systemModules.moduleType, data.moduleType))).limit(1);
  if (existing.length > 0) {
    await db.update(systemModules).set({ ...data, updatedAt: new Date() }).where(eq(systemModules.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(systemModules).values(data);
  return result.insertId;
}

export async function updateSystemModule(id: number, data: Partial<InsertSystemModule>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(systemModules).set(data).where(eq(systemModules.id, id));
}

// ─── SEO Data ───────────────────────────────────────────────────────────────
export async function createSeoSnapshot(data: InsertSeoData) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(seoData).values(data);
  return result.insertId;
}

export async function getLatestSeoData(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(seoData).where(eq(seoData.userId, userId)).orderBy(desc(seoData.snapshotDate)).limit(1);
  return rows[0] || null;
}

export async function getSeoHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoData).where(eq(seoData.userId, userId)).orderBy(desc(seoData.snapshotDate)).limit(limit);
}

// ─── Trading Data ───────────────────────────────────────────────────────────
export async function createTradingSnapshot(data: InsertTradingData) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(tradingData).values(data);
  return result.insertId;
}

export async function getLatestTradingData(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(tradingData).where(eq(tradingData.userId, userId)).orderBy(desc(tradingData.snapshotDate)).limit(1);
  return rows[0] || null;
}

export async function getTradingHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tradingData).where(eq(tradingData.userId, userId)).orderBy(desc(tradingData.snapshotDate)).limit(limit);
}

// ─── Cross-System Analysis ──────────────────────────────────────────────────
export async function createCrossSystemAnalysis(data: InsertCrossSystemAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(crossSystemAnalysis).values(data);
  return result.insertId;
}

export async function getCrossSystemAnalyses(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crossSystemAnalysis).where(eq(crossSystemAnalysis.userId, userId)).orderBy(desc(crossSystemAnalysis.createdAt)).limit(limit);
}

export async function getLatestCrossSystemAnalysis(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crossSystemAnalysis).where(eq(crossSystemAnalysis.userId, userId)).orderBy(desc(crossSystemAnalysis.createdAt)).limit(1);
  return rows[0] || null;
}
