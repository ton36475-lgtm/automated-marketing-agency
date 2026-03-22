import axios, { AxiosInstance } from "axios";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { integrationSettings } from "../../drizzle/schema";

interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: Record<string, any>;
  bid_strategy?: string;
}

interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  creative?: Record<string, any>;
}

interface MetaInsights {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

class MetaAdsService {
  private client: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private adAccountId: string | null = null;
  private config: MetaOAuthConfig;
  private apiVersion = "v18.0";

  constructor(config: MetaOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate Meta OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: "ads_management,ads_read,business_management",
      state,
      response_type: "code",
    });

    return `https://www.facebook.com/${this.apiVersion}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.get(`https://graph.instagram.com/${this.apiVersion}/oauth/access_token`, {
        params: {
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          redirect_uri: this.config.redirectUri,
          code,
        },
      });

      this.accessToken = response.data.access_token;
      this.initializeClient();

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error("[Meta Ads] Token exchange failed:", error);
      throw error;
    }
  }

  /**
   * Initialize API client with access token
   */
  private initializeClient() {
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      params: {
        access_token: this.accessToken,
      },
    });
  }

  /**
   * Set access token and ad account ID
   */
  setCredentials(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.initializeClient();
  }

  /**
   * Get user's ad accounts
   */
  async getAdAccounts(): Promise<Array<{ id: string; name: string; currency: string }>> {
    if (!this.client) throw new Error("Meta Ads client not initialized");

    try {
      const response = await this.client.get("/me/adaccounts", {
        params: {
          fields: "id,name,currency",
        },
      });

      return response.data.data.map((account: any) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
      }));
    } catch (error) {
      console.error("[Meta Ads] Failed to fetch ad accounts:", error);
      throw error;
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(name: string, objective: string, dailyBudget: number): Promise<MetaCampaign> {
    if (!this.client || !this.adAccountId) throw new Error("Meta Ads client not initialized");

    try {
      const response = await this.client.post(`/${this.adAccountId}/campaigns`, {
        name,
        objective,
        status: "PAUSED",
        daily_budget: dailyBudget * 100, // Convert to cents
      });

      return {
        id: response.data.id,
        name,
        status: "PAUSED",
        objective,
        daily_budget: dailyBudget,
      };
    } catch (error) {
      console.error("[Meta Ads] Failed to create campaign:", error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<MetaCampaign>): Promise<void> {
    if (!this.client) throw new Error("Meta Ads client not initialized");

    try {
      const payload: Record<string, any> = {};

      if (updates.name) payload.name = updates.name;
      if (updates.status) payload.status = updates.status;
      if (updates.daily_budget) payload.daily_budget = updates.daily_budget * 100;
      if (updates.lifetime_budget) payload.lifetime_budget = updates.lifetime_budget * 100;

      await this.client.post(`/${campaignId}`, payload);
    } catch (error) {
      console.error("[Meta Ads] Failed to update campaign:", error);
      throw error;
    }
  }

  /**
   * Get campaign details
   */
  async getCampaign(campaignId: string): Promise<MetaCampaign> {
    if (!this.client) throw new Error("Meta Ads client not initialized");

    try {
      const response = await this.client.get(`/${campaignId}`, {
        params: {
          fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,end_time",
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        objective: response.data.objective,
        daily_budget: response.data.daily_budget ? response.data.daily_budget / 100 : undefined,
        lifetime_budget: response.data.lifetime_budget ? response.data.lifetime_budget / 100 : undefined,
        start_time: response.data.start_time,
        end_time: response.data.end_time,
      };
    } catch (error) {
      console.error("[Meta Ads] Failed to get campaign:", error);
      throw error;
    }
  }

  /**
   * Get campaign insights (performance metrics)
   */
  async getCampaignInsights(campaignId: string, dateStart?: string, dateEnd?: string): Promise<MetaInsights> {
    if (!this.client) throw new Error("Meta Ads client not initialized");

    try {
      const params: Record<string, any> = {
        fields: "impressions,clicks,spend,conversions,ctr,cpc,cpm,roas",
        time_range: {
          since: dateStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          until: dateEnd || new Date().toISOString().split("T")[0],
        },
      };

      const response = await this.client.get(`/${campaignId}/insights`, { params });

      if (response.data.data.length === 0) {
        return {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0,
        };
      }

      const data = response.data.data[0];
      return {
        impressions: parseInt(data.impressions || "0"),
        clicks: parseInt(data.clicks || "0"),
        spend: parseFloat(data.spend || "0"),
        conversions: parseInt(data.conversions || "0"),
        ctr: parseFloat(data.ctr || "0"),
        cpc: parseFloat(data.cpc || "0"),
        cpm: parseFloat(data.cpm || "0"),
        roas: parseFloat(data.roas || "0"),
      };
    } catch (error) {
      console.error("[Meta Ads] Failed to get campaign insights:", error);
      throw error;
    }
  }

  /**
   * List campaigns
   */
  async listCampaigns(limit: number = 100, after?: string): Promise<{ campaigns: MetaCampaign[]; nextPage?: string }> {
    if (!this.client || !this.adAccountId) throw new Error("Meta Ads client not initialized");

    try {
      const params: Record<string, any> = {
        fields: "id,name,status,objective,daily_budget,lifetime_budget",
        limit,
      };

      if (after) {
        params.after = after;
      }

      const response = await this.client.get(`/${this.adAccountId}/campaigns`, { params });

      const campaigns: MetaCampaign[] = response.data.data.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget ? campaign.daily_budget / 100 : undefined,
        lifetime_budget: campaign.lifetime_budget ? campaign.lifetime_budget / 100 : undefined,
      }));

      return {
        campaigns,
        nextPage: response.data.paging?.cursors?.after,
      };
    } catch (error) {
      console.error("[Meta Ads] Failed to list campaigns:", error);
      throw error;
    }
  }

  /**
   * Verify connection
   */
  async verifyConnection(): Promise<{ valid: boolean; adAccountId?: string }> {
    if (!this.client) throw new Error("Meta Ads client not initialized");

    try {
      const accounts = await this.getAdAccounts();
      return { valid: accounts.length > 0, adAccountId: this.adAccountId || undefined };
    } catch (error) {
      console.error("[Meta Ads] Connection verification failed:", error);
      return { valid: false };
    }
  }
}

/**
 * Save Meta Ads integration settings
 */
export async function saveMetaAdsIntegration(userId: number, accessToken: string, adAccountId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId)).limit(1);

  const settings = {
    userId,
    metaAccessToken: accessToken,
    metaAdAccountId: adAccountId,
    isMetaConnected: true,
  };

  if (existing.length > 0) {
    await db.update(integrationSettings).set(settings).where(eq(integrationSettings.userId, userId));
  } else {
    await db.insert(integrationSettings).values(settings);
  }
}

/**
 * Get Meta Ads integration settings
 */
export async function getMetaAdsIntegration(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId)).limit(1);
  return result[0] || null;
}

/**
 * Disconnect Meta Ads
 */
export async function disconnectMetaAds(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(integrationSettings)
    .set({
      metaAccessToken: null,
      metaAdAccountId: null,
      isMetaConnected: false,
    })
    .where(eq(integrationSettings.userId, userId));
}

export default MetaAdsService;
