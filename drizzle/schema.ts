import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  objective: varchar("objective", { length: 100 }),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  budgetSpent: decimal("budgetSpent", { precision: 12, scale: 2 }).default("0"),
  targetAudience: text("targetAudience"),
  kpiGoals: json("kpiGoals"),
  strategyBrief: text("strategyBrief"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  metaCampaignId: varchar("metaCampaignId", { length: 100 }),
  roas: decimal("roas", { precision: 8, scale: 4 }),
  cpa: decimal("cpa", { precision: 10, scale: 2 }),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  conversions: int("conversions").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── Agent Tasks ──────────────────────────────────────────────────────────────
export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  userId: int("userId").notNull(),
  agentType: mysqlEnum("agentType", ["strategy", "copywriting", "visual", "media_buying", "optimization", "orchestrator"]).notNull(),
  taskType: varchar("taskType", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  inputData: json("inputData"),
  outputData: json("outputData"),
  errorMessage: text("errorMessage"),
  tokensUsed: int("tokensUsed").default(0),
  executionTimeMs: int("executionTimeMs"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;

// ─── Ad Creatives ─────────────────────────────────────────────────────────────
export const adCreatives = mysqlTable("ad_creatives", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  userId: int("userId").notNull(),
  agentTaskId: int("agentTaskId"),
  type: mysqlEnum("type", ["image", "copy", "headline", "cta", "video_script", "carousel"]).notNull(),
  platform: mysqlEnum("platform", ["meta", "google", "tiktok", "line", "general"]).default("general").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  imageUrl: text("imageUrl"),
  imagePrompt: text("imagePrompt"),
  status: mysqlEnum("status", ["draft", "approved", "rejected", "active", "archived"]).default("draft").notNull(),
  performance: json("performance"),
  metaAdId: varchar("metaAdId", { length: 100 }),
  isWinner: boolean("isWinner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdCreative = typeof adCreatives.$inferSelect;
export type InsertAdCreative = typeof adCreatives.$inferInsert;

// ─── Leads / CRM ─────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["new", "attempting", "connected", "qualified", "hot", "warm", "cold", "converted", "lost"]).default("new").notNull(),
  score: int("score").default(0),
  scoreReason: text("scoreReason"),
  hubspotId: varchar("hubspotId", { length: 100 }),
  metaLeadId: varchar("metaLeadId", { length: 100 }),
  notes: text("notes"),
  enrichedData: json("enrichedData"),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Analytics Metrics ────────────────────────────────────────────────────────
export const analyticsMetrics = mysqlTable("analytics_metrics", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  platform: varchar("platform", { length: 50 }).default("meta"),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  conversions: int("conversions").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  roas: decimal("roas", { precision: 8, scale: 4 }),
  cpa: decimal("cpa", { precision: 10, scale: 2 }),
  ctr: decimal("ctr", { precision: 8, scale: 4 }),
  cpm: decimal("cpm", { precision: 10, scale: 2 }),
  frequency: decimal("frequency", { precision: 6, scale: 2 }),
  reach: bigint("reach", { mode: "number" }).default(0),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = typeof analyticsMetrics.$inferInsert;

// ─── Competitor Data ──────────────────────────────────────────────────────────
export const competitorData = mysqlTable("competitor_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  competitorName: varchar("competitorName", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  strengths: json("strengths"),
  weaknesses: json("weaknesses"),
  adStrategies: json("adStrategies"),
  keywords: json("keywords"),
  estimatedBudget: varchar("estimatedBudget", { length: 100 }),
  socialFollowers: json("socialFollowers"),
  insights: text("insights"),
  rawData: json("rawData"),
  analyzedAt: timestamp("analyzedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorData = typeof competitorData.$inferSelect;
export type InsertCompetitorData = typeof competitorData.$inferInsert;

// ─── Optimization Rules ───────────────────────────────────────────────────────
export const optimizationRules = mysqlTable("optimization_rules", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  userId: int("userId").notNull(),
  ruleName: varchar("ruleName", { length: 100 }).notNull(),
  ruleType: mysqlEnum("ruleType", ["stop_loss", "scale_winners", "aggressive_scaling", "fight_fatigue", "custom"]).notNull(),
  conditions: json("conditions").notNull(),
  actions: json("actions").notNull(),
  isActive: boolean("isActive").default(true),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  triggerCount: int("triggerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OptimizationRule = typeof optimizationRules.$inferSelect;
export type InsertOptimizationRule = typeof optimizationRules.$inferInsert;

// ─── Agent Activity Log ───────────────────────────────────────────────────────
export const agentActivityLog = mysqlTable("agent_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentType: mysqlEnum("agentType", ["strategy", "copywriting", "visual", "media_buying", "optimization", "orchestrator"]).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  level: mysqlEnum("level", ["info", "success", "warning", "error"]).default("info").notNull(),
  campaignId: int("campaignId"),
  taskId: int("taskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentActivityLog = typeof agentActivityLog.$inferSelect;
export type InsertAgentActivityLog = typeof agentActivityLog.$inferInsert;

// ─── Integration Settings ─────────────────────────────────────────────────────
export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  hubspotApiKey: varchar("hubspotApiKey", { length: 500 }),
  hubspotPortalId: varchar("hubspotPortalId", { length: 100 }),
  metaAccessToken: varchar("metaAccessToken", { length: 500 }),
  metaAdAccountId: varchar("metaAdAccountId", { length: 100 }),
  metaPixelId: varchar("metaPixelId", { length: 100 }),
  googleAdsCustomerId: varchar("googleAdsCustomerId", { length: 100 }),
  isHubspotConnected: boolean("isHubspotConnected").default(false),
  isMetaConnected: boolean("isMetaConnected").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettings = typeof integrationSettings.$inferInsert;

// ─── Scheduled Tasks (Autonomous Scheduling) ──────────────────────────────────
export const scheduledTasks = mysqlTable("scheduled_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["campaign", "content", "analysis", "optimization", "report"]).notNull(),
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastRun: timestamp("lastRun"),
  nextRun: timestamp("nextRun"),
  config: json("config"),
  campaignId: int("campaignId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = typeof scheduledTasks.$inferInsert;

// ─── Webhooks (API Triggers) ──────────────────────────────────────────────────
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  retries: int("retries").default(3),
  timeout: int("timeout").default(30),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ─── Content Library (Images & Videos) ────────────────────────────────────────
export const contentLibrary = mysqlTable("content_library", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  contentType: mysqlEnum("contentType", ["image", "video", "text"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  duration: int("duration"),
  format: varchar("format", { length: 50 }),
  status: mysqlEnum("status", ["draft", "approved", "published", "archived"]).default("draft").notNull(),
  performance: json("performance"),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentLibrary = typeof contentLibrary.$inferSelect;
export type InsertContentLibrary = typeof contentLibrary.$inferInsert;

// ─── Video Generation Jobs ────────────────────────────────────────────────────
export const videoGenerationJobs = mysqlTable("video_generation_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 100 }),
  duration: int("duration").default(15),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  videoUrl: varchar("videoUrl", { length: 500 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type VideoGenerationJob = typeof videoGenerationJobs.$inferSelect;
export type InsertVideoGenerationJob = typeof videoGenerationJobs.$inferInsert;

// ─── Metrics Tracking (Ad Performance) ────────────────────────────────────────
export const metricsTracking = mysqlTable("metrics_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  date: timestamp("date").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  conversions: int("conversions").default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 8, scale: 4 }),
  cpc: decimal("cpc", { precision: 10, scale: 2 }),
  cpa: decimal("cpa", { precision: 10, scale: 2 }),
  roas: decimal("roas", { precision: 8, scale: 4 }),
  conversionRate: decimal("conversionRate", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetricsTracking = typeof metricsTracking.$inferSelect;
export type InsertMetricsTracking = typeof metricsTracking.$inferInsert;

// ─── Orchestration State (Real-time Coordination) ────────────────────────────
export const orchestrationState = mysqlTable("orchestration_state", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  activeAgents: json("activeAgents"),
  taskQueue: json("taskQueue"),
  decisions: json("decisions"),
  state: mysqlEnum("state", ["idle", "running", "paused", "error"]).default("idle").notNull(),
  lastUpdate: timestamp("lastUpdate").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrchestrationState = typeof orchestrationState.$inferSelect;
export type InsertOrchestrationState = typeof orchestrationState.$inferInsert;

// ─── CEO Gem - Executive Board ──────────────────────────────────────────────
export const executiveGems = mysqlTable("executive_gems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gemName: varchar("gemName", { length: 100 }).notNull(),
  gemRole: mysqlEnum("gemRole", ["ceo", "cmo", "cto", "cfo", "coo", "strategy", "creative", "media", "optimization", "analytics"]).notNull(),
  systemPrompt: text("systemPrompt"),
  personality: text("personality"),
  goals: json("goals"),
  kpis: json("kpis"),
  isActive: boolean("isActive").default(true).notNull(),
  lastAction: timestamp("lastAction"),
  totalDecisions: int("totalDecisions").default(0),
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExecutiveGem = typeof executiveGems.$inferSelect;
export type InsertExecutiveGem = typeof executiveGems.$inferInsert;

// ─── CEO Decisions (AI-driven Decision Log) ─────────────────────────────────
export const ceoDecisions = mysqlTable("ceo_decisions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gemId: int("gemId").notNull(),
  decisionType: mysqlEnum("decisionType", [
    "budget_allocation", "campaign_launch", "campaign_pause", "campaign_scale",
    "content_approval", "audience_shift", "bid_adjustment", "emergency_stop",
    "resource_reallocation", "strategy_pivot", "team_directive"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  reasoning: text("reasoning"),
  context: json("context"),
  action: json("action"),
  impact: json("impact"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["pending", "approved", "executed", "rejected", "reverted"]).default("pending").notNull(),
  executedAt: timestamp("executedAt"),
  result: json("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CeoDecision = typeof ceoDecisions.$inferSelect;
export type InsertCeoDecision = typeof ceoDecisions.$inferInsert;

// ─── Executive Board Meetings (Multi-Agent Deliberation) ─────────────────────
export const boardMeetings = mysqlTable("board_meetings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  triggerType: mysqlEnum("triggerType", ["scheduled", "event", "manual", "emergency"]).notNull(),
  triggerReason: text("triggerReason"),
  participants: json("participants"),
  agenda: json("agenda"),
  discussion: json("discussion"),
  decisions: json("decisions"),
  actionItems: json("actionItems"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BoardMeeting = typeof boardMeetings.$inferSelect;
export type InsertBoardMeeting = typeof boardMeetings.$inferInsert;

// ─── System Directives (CEO Commands to Agents) ─────────────────────────────
export const systemDirectives = mysqlTable("system_directives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromGemId: int("fromGemId").notNull(),
  toGemRole: varchar("toGemRole", { length: 50 }).notNull(),
  directive: text("directive").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "acknowledged", "in_progress", "completed", "failed"]).default("pending").notNull(),
  response: text("response"),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemDirective = typeof systemDirectives.$inferSelect;
export type InsertSystemDirective = typeof systemDirectives.$inferInsert;

// ─── Performance Snapshots (System-wide KPI Tracking) ────────────────────────
export const performanceSnapshots = mysqlTable("performance_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  totalSpend: decimal("totalSpend", { precision: 14, scale: 2 }).default("0"),
  totalRevenue: decimal("totalRevenue", { precision: 14, scale: 2 }).default("0"),
  totalLeads: int("totalLeads").default(0),
  totalConversions: int("totalConversions").default(0),
  avgRoas: decimal("avgRoas", { precision: 8, scale: 4 }),
  avgCpa: decimal("avgCpa", { precision: 10, scale: 2 }),
  activeCampaigns: int("activeCampaigns").default(0),
  activeAgents: int("activeAgents").default(0),
  systemHealth: decimal("systemHealth", { precision: 5, scale: 2 }),
  aiDecisionsMade: int("aiDecisionsMade").default(0),
  aiDecisionsSuccess: int("aiDecisionsSuccess").default(0),
  insights: json("insights"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceSnapshot = typeof performanceSnapshots.$inferSelect;
export type InsertPerformanceSnapshot = typeof performanceSnapshots.$inferInsert;
