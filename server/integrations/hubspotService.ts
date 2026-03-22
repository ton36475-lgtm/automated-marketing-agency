import axios, { AxiosInstance } from "axios";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { integrationSettings } from "../../drizzle/schema";

interface HubSpotOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    notes_next_activity_date?: string;
  };
}

interface HubSpotLead {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  lifecycleStage?: string;
  leadStatus?: string;
  score?: number;
}

class HubSpotService {
  private client: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private config: HubSpotOAuthConfig;

  constructor(config: HubSpotOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate HubSpot OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write",
      state,
    });

    return `https://app.hubapi.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    try {
      const response = await axios.post("https://api.hubapi.com/oauth/v1/token", {
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code,
      });

      this.accessToken = response.data.access_token;
      this.initializeClient();

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error("[HubSpot] Token exchange failed:", error);
      throw error;
    }
  }

  /**
   * Initialize API client with access token
   */
  private initializeClient() {
    this.client = axios.create({
      baseURL: "https://api.hubapi.com",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Set access token and initialize client
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    this.initializeClient();
  }

  /**
   * Fetch all contacts from HubSpot
   */
  async getContacts(limit: number = 100, after?: string): Promise<{ contacts: HubSpotLead[]; nextPage?: string }> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      const params: Record<string, any> = {
        limit,
        properties: ["firstname", "lastname", "email", "phone", "lifecyclestage", "hs_lead_status"],
      };

      if (after) {
        params.after = after;
      }

      const response = await this.client.get("/crm/v3/objects/contacts", { params });

      const contacts: HubSpotLead[] = response.data.results.map((contact: HubSpotContact) => ({
        id: contact.id,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        email: contact.properties.email || "",
        phone: contact.properties.phone,
        lifecycleStage: contact.properties.lifecyclestage,
        leadStatus: contact.properties.hs_lead_status,
      }));

      return {
        contacts,
        nextPage: response.data.paging?.next?.after,
      };
    } catch (error) {
      console.error("[HubSpot] Failed to fetch contacts:", error);
      throw error;
    }
  }

  /**
   * Create or update a contact
   */
  async upsertContact(email: string, properties: Record<string, any>): Promise<HubSpotLead> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      const response = await this.client.post("/crm/v3/objects/contacts", {
        properties: {
          email,
          ...properties,
        },
      });

      return {
        id: response.data.id,
        email,
        ...properties,
      };
    } catch (error) {
      console.error("[HubSpot] Failed to upsert contact:", error);
      throw error;
    }
  }

  /**
   * Update contact properties
   */
  async updateContact(contactId: string, properties: Record<string, any>): Promise<void> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      await this.client.patch(`/crm/v3/objects/contacts/${contactId}`, {
        properties,
      });
    } catch (error) {
      console.error("[HubSpot] Failed to update contact:", error);
      throw error;
    }
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<HubSpotLead | null> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      const response = await this.client.get(`/crm/v3/objects/contacts/${email}`, {
        params: {
          idProperty: "email",
          properties: ["firstname", "lastname", "email", "phone", "lifecyclestage", "hs_lead_status"],
        },
      });

      const contact = response.data;
      return {
        id: contact.id,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        email: contact.properties.email,
        phone: contact.properties.phone,
        lifecycleStage: contact.properties.lifecyclestage,
        leadStatus: contact.properties.hs_lead_status,
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      console.error("[HubSpot] Failed to get contact:", error);
      throw error;
    }
  }

  /**
   * Batch update contacts with lead scores
   */
  async batchUpdateLeadScores(updates: Array<{ email: string; score: number }>): Promise<void> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      const inputs = updates.map((update) => ({
        id: update.email,
        idProperty: "email",
        properties: {
          hs_lead_status: this.scoreToLeadStatus(update.score),
          hubspotscore: update.score.toString(),
        },
      }));

      await this.client.post("/crm/v3/objects/contacts/batch/update", { inputs });
    } catch (error) {
      console.error("[HubSpot] Failed to batch update lead scores:", error);
      throw error;
    }
  }

  /**
   * Convert lead score to HubSpot lead status
   */
  private scoreToLeadStatus(score: number): string {
    if (score >= 80) return "Qualified to buy";
    if (score >= 60) return "Presentation scheduled";
    if (score >= 40) return "Decision makers involved";
    if (score >= 20) return "Negotiation/Review";
    return "Subscriber";
  }

  /**
   * Verify connection by fetching account info
   */
  async verifyConnection(): Promise<{ valid: boolean; accountId?: string; email?: string }> {
    if (!this.client) throw new Error("HubSpot client not initialized");

    try {
      const response = await this.client.get("/crm/v3/objects/contacts", { params: { limit: 1 } });
      return { valid: true };
    } catch (error) {
      console.error("[HubSpot] Connection verification failed:", error);
      return { valid: false };
    }
  }
}

/**
 * Save HubSpot integration settings to database
 */
export async function saveHubSpotIntegration(
  userId: number,
  accessToken: string,
  portalId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId)).limit(1);

  const settings = {
    userId,
    hubspotApiKey: accessToken,
    hubspotPortalId: portalId,
    isHubspotConnected: true,
  };

  if (existing.length > 0) {
    await db.update(integrationSettings).set(settings).where(eq(integrationSettings.userId, userId));
  } else {
    await db.insert(integrationSettings).values(settings);
  }
}

/**
 * Get HubSpot integration settings
 */
export async function getHubSpotIntegration(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(integrationSettings).where(eq(integrationSettings.userId, userId)).limit(1);
  return result[0] || null;
}

/**
 * Disconnect HubSpot
 */
export async function disconnectHubSpot(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(integrationSettings)
    .set({
      hubspotApiKey: null,
      hubspotPortalId: null,
      isHubspotConnected: false,
    })
    .where(eq(integrationSettings.userId, userId));
}

export default HubSpotService;
