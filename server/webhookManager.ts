import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { webhooks } from "../drizzle/schema";
import crypto from "crypto";

interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: number;
}

interface WebhookEvent {
  campaignCreated: { campaignId: number; name: string };
  campaignUpdated: { campaignId: number; changes: Record<string, any> };
  campaignCompleted: { campaignId: number; results: Record<string, any> };
  leadCreated: { leadId: number; email: string };
  leadScored: { leadId: number; score: number };
  agentTaskCompleted: { taskId: number; agentType: string; result: Record<string, any> };
  performanceAlert: { campaignId: number; metric: string; value: number; threshold: number };
  optimizationTriggered: { campaignId: number; action: string; reason: string };
}

class WebhookManager {
  private db: Awaited<ReturnType<typeof getDb>> | null = null;

  async initialize() {
    this.db = await getDb();
    console.log("[Webhooks] Initialized");
  }

  async triggerWebhook<K extends keyof WebhookEvent>(
    event: K,
    data: WebhookEvent[K],
    userId: number
  ) {
    if (!this.db) {
      console.error("[Webhooks] Database not available");
      return;
    }

    try {
      const activeWebhooks = await this.db
        .select()
        .from(webhooks)
        .where(eq(webhooks.isActive, true));

      const eventWebhooks = activeWebhooks.filter((w) => w.event === event || w.event === "*");

      for (const webhook of eventWebhooks) {
        await this.sendWebhook(webhook, event as string, data);
      }

      console.log(`[Webhooks] Triggered event "${event}" for ${eventWebhooks.length} webhooks`);
    } catch (error) {
      console.error(`[Webhooks] Error triggering event "${event}":`, error);
    }
  }

  private async sendWebhook(
    webhook: any,
    event: string,
    data: Record<string, any>
  ) {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: Date.now(),
    };

    const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[Webhooks] Successfully sent webhook to ${webhook.url}`);
    } catch (error) {
      console.error(`[Webhooks] Failed to send webhook to ${webhook.url}:`, error);
      await this.handleFailedWebhook(webhook, error as Error);
    }
  }

  private async handleFailedWebhook(webhook: any, error: Error) {
    if (!this.db) return;

    // Implement retry logic
    const retryCount = webhook.retries || 3;
    if (retryCount > 0) {
      console.log(`[Webhooks] Retrying webhook ${webhook.id} (${retryCount} retries left)`);
      // In production, implement exponential backoff with queue system
    } else {
      console.error(`[Webhooks] Webhook ${webhook.id} failed permanently`);
      // Disable webhook after max retries
      await this.db
        .update(webhooks)
        .set({ isActive: false })
        .where(eq(webhooks.id, webhook.id));
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  async createWebhook(
    userId: number,
    name: string,
    url: string,
    event: string,
    secret: string
  ) {
    if (!this.db) {
      throw new Error("Database not available");
    }

    const result = await this.db.insert(webhooks).values({
      userId,
      name,
      url,
      event,
      secret,
      isActive: true,
    });

    console.log(`[Webhooks] Created webhook: ${name}`);
    return result;
  }

  async deleteWebhook(webhookId: number) {
    if (!this.db) {
      throw new Error("Database not available");
    }

    await this.db.delete(webhooks).where(eq(webhooks.id, webhookId));
    console.log(`[Webhooks] Deleted webhook: ${webhookId}`);
  }

  async testWebhook(webhookId: number) {
    if (!this.db) {
      throw new Error("Database not available");
    }

    const webhook = await this.db.select().from(webhooks).where(eq(webhooks.id, webhookId)).limit(1);

    if (webhook.length === 0) {
      throw new Error("Webhook not found");
    }

    const testPayload = {
      event: "test",
      data: { test: true, timestamp: new Date().toISOString() },
      timestamp: Date.now(),
    };

    await this.sendWebhook(webhook[0], "test", testPayload.data);
  }
}

export const webhookManager = new WebhookManager();
