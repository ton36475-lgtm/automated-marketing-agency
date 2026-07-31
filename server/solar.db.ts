import { eq, desc, and } from "drizzle-orm";
import {
  solarClients,
  solarSites,
  solarCalculations,
  solarOffers,
  solarPerformanceData,
  solarSalesPipeline,
  InsertSolarClient,
  InsertSolarSite,
  InsertSolarCalculation,
  InsertSolarOffer,
  InsertSolarPerformanceData,
  InsertSolarSalesPipeline,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── Solar Clients ───────────────────────────────────────────────────────────
export async function createSolarClient(data: InsertSolarClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarClients).values(data);
  return result;
}

export async function getSolarClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarClients).where(eq(solarClients.userId, userId)).orderBy(desc(solarClients.createdAt));
}

export async function getSolarClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(solarClients).where(eq(solarClients.id, id)).limit(1);
  return result[0];
}

export async function updateSolarClient(id: number, data: Partial<InsertSolarClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solarClients).set(data).where(eq(solarClients.id, id));
}

export async function deleteSolarClient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(solarClients).where(eq(solarClients.id, id));
}

// ─── Solar Sites ─────────────────────────────────────────────────────────────
export async function createSolarSite(data: InsertSolarSite) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarSites).values(data);
  return result;
}

export async function getSolarSitesByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarSites).where(eq(solarSites.clientId, clientId)).orderBy(desc(solarSites.createdAt));
}

export async function getSolarSiteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(solarSites).where(eq(solarSites.id, id)).limit(1);
  return result[0];
}

export async function updateSolarSite(id: number, data: Partial<InsertSolarSite>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solarSites).set(data).where(eq(solarSites.id, id));
}

export async function deleteSolarSite(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(solarSites).where(eq(solarSites.id, id));
}

// ─── Solar Calculations ──────────────────────────────────────────────────────
export async function createSolarCalculation(data: InsertSolarCalculation) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarCalculations).values(data);
  return result;
}

export async function getSolarCalculationBySiteId(siteId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(solarCalculations)
    .where(eq(solarCalculations.siteId, siteId))
    .orderBy(desc(solarCalculations.createdAt))
    .limit(1);
  return result[0];
}

export async function getSolarCalculationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(solarCalculations).where(eq(solarCalculations.id, id)).limit(1);
  return result[0];
}

export async function updateSolarCalculation(id: number, data: Partial<InsertSolarCalculation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solarCalculations).set(data).where(eq(solarCalculations.id, id));
}

// ─── Solar Offers ────────────────────────────────────────────────────────────
export async function createSolarOffer(data: InsertSolarOffer) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarOffers).values(data);
  return result;
}

export async function getSolarOffersByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarOffers).where(eq(solarOffers.clientId, clientId)).orderBy(desc(solarOffers.createdAt));
}

export async function getSolarOffersBySiteId(siteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarOffers).where(eq(solarOffers.siteId, siteId)).orderBy(desc(solarOffers.createdAt));
}

export async function getSolarOfferById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(solarOffers).where(eq(solarOffers.id, id)).limit(1);
  return result[0];
}

export async function updateSolarOffer(id: number, data: Partial<InsertSolarOffer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solarOffers).set(data).where(eq(solarOffers.id, id));
}

export async function deleteSolarOffer(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(solarOffers).where(eq(solarOffers.id, id));
}

// ─── Solar Performance Data ──────────────────────────────────────────────────
export async function createSolarPerformanceData(data: InsertSolarPerformanceData) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarPerformanceData).values(data);
  return result;
}

export async function getSolarPerformanceDataBySiteId(siteId: number, limit: number = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(solarPerformanceData)
    .where(eq(solarPerformanceData.siteId, siteId))
    .orderBy(desc(solarPerformanceData.date))
    .limit(limit);
}

export async function getSolarPerformanceDataByDateRange(siteId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(solarPerformanceData)
    .where(
      and(
        eq(solarPerformanceData.siteId, siteId),
        // @ts-ignore - date range filtering
        solarPerformanceData.date.gte(startDate),
        solarPerformanceData.date.lte(endDate)
      )
    )
    .orderBy(desc(solarPerformanceData.date));
}

// ─── Solar Sales Pipeline ────────────────────────────────────────────────────
export async function createSolarSalesPipeline(data: InsertSolarSalesPipeline) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(solarSalesPipeline).values(data);
  return result;
}

export async function getSolarSalesPipelineByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(solarSalesPipeline)
    .where(eq(solarSalesPipeline.clientId, clientId))
    .orderBy(desc(solarSalesPipeline.createdAt));
}

export async function getSolarSalesPipelineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(solarSalesPipeline).where(eq(solarSalesPipeline.id, id)).limit(1);
  return result[0];
}

export async function updateSolarSalesPipeline(id: number, data: Partial<InsertSolarSalesPipeline>) {
  const db = await getDb();
  if (!db) return;
  await db.update(solarSalesPipeline).set(data).where(eq(solarSalesPipeline.id, id));
}

export async function getSolarPipelineByStage(stage: string) {
  const db = await getDb();
  if (!db) return [];
  // @ts-ignore - enum filtering
  return db.select().from(solarSalesPipeline).where(eq(solarSalesPipeline.stage, stage));
}
