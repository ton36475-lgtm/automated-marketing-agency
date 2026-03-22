import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-cross-system-user",
    email: "ceo@example.com",
    name: "Test CEO",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("crossSystem.modules", () => {
  it("returns module list for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.modules.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns overview with marketing/seo/trading status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.modules.overview();
    expect(result).toHaveProperty("modules");
    expect(result).toHaveProperty("marketing");
    expect(result).toHaveProperty("seo");
    expect(result).toHaveProperty("trading");
    expect(result.marketing).toHaveProperty("isConnected", true);
    expect(result.marketing).toHaveProperty("status", "online");
    expect(result.seo).toHaveProperty("isConnected");
    expect(result.trading).toHaveProperty("isConnected");
  });

  it("rejects unauthenticated module list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.crossSystem.modules.list()).rejects.toThrow();
  });
});

describe("crossSystem.seo", () => {
  it("initializes SEO module successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.seo.initialize();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("message");
  });

  it("returns SEO status after initialization", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize first
    await caller.crossSystem.seo.initialize();

    const status = await caller.crossSystem.seo.status();
    expect(status).toHaveProperty("isConnected", true);
    expect(status).toHaveProperty("status", "online");
    expect(status).toHaveProperty("module");
  });

  it("rejects unauthenticated SEO initialization", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.crossSystem.seo.initialize()).rejects.toThrow();
  });
});

describe("crossSystem.trading", () => {
  it("initializes Trading module successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.trading.initialize();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("message");
  });

  it("returns Trading status after initialization", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize first
    await caller.crossSystem.trading.initialize();

    const status = await caller.crossSystem.trading.status();
    expect(status).toHaveProperty("isConnected", true);
    expect(status).toHaveProperty("status", "online");
    expect(status).toHaveProperty("module");
  });

  it("rejects unauthenticated Trading initialization", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.crossSystem.trading.initialize()).rejects.toThrow();
  });
});

describe("crossSystem.analysis", () => {
  it("returns null latest analysis when none exists", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.analysis.latest();
    // May be null if no analysis has been run
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("returns analysis history as array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.crossSystem.analysis.history({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated analysis run", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.crossSystem.analysis.run({ type: "cross_system_review" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated analysis history", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.crossSystem.analysis.history({ limit: 5 })
    ).rejects.toThrow();
  });
});

describe("crossSystem integration flow", () => {
  it("overview reflects connected modules after initialization", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Initialize both modules
    await caller.crossSystem.seo.initialize();
    await caller.crossSystem.trading.initialize();

    // Check overview
    const overview = await caller.crossSystem.modules.overview();
    expect(overview.modules.length).toBeGreaterThanOrEqual(2);

    // SEO should be connected
    const seoModule = overview.modules.find((m: any) => m.type === "seo");
    expect(seoModule).toBeDefined();
    expect(seoModule?.isConnected).toBe(true);

    // Trading should be connected
    const tradingModule = overview.modules.find((m: any) => m.type === "trading");
    expect(tradingModule).toBeDefined();
    expect(tradingModule?.isConnected).toBe(true);
  });
});
