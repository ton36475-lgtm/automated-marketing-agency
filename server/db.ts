import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adCreatives,
  agentActivityLog,
  agentTasks,
  analyticsMetrics,
  campaigns,
  competitorData,
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
  optimizationRules,
  users,
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
