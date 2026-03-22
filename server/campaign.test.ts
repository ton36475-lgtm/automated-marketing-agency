import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Campaign Management", () => {
  it("should create a campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaign.create({
      name: "Test Campaign",
      objective: "conversions",
      budget: "1000",
      targetAudience: "Tech professionals",
      platforms: ["meta", "google"],
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Campaign");
    expect(result.status).toBe("draft");
  });

  it("should list campaigns for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaign.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update campaign status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.campaign.create({
      name: "Update Test",
      objective: "awareness",
      budget: "500",
      targetAudience: "General",
      platforms: ["meta"],
    });

    await caller.campaign.update({
      id: created.id,
      status: "active",
    });

    const updated = await caller.campaign.get({ id: created.id });
    expect(updated.status).toBe("active");
  });

  it("should delete a campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.campaign.create({
      name: "Delete Test",
      objective: "leads",
      budget: "750",
      targetAudience: "B2B",
      platforms: ["google"],
    });

    const result = await caller.campaign.delete({ id: created.id });
    expect(result.success).toBe(true);
  });
});
