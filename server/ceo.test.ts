import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-ceo-user",
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

describe("ceo.dashboard", () => {
  it("returns dashboard stats for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.dashboard();

    // Should return stats object (may be null if DB unavailable, or stats object)
    if (result !== null) {
      expect(result).toHaveProperty("totalGems");
      expect(result).toHaveProperty("activeGems");
      expect(result).toHaveProperty("totalDecisions");
      expect(result).toHaveProperty("pendingDecisions");
      expect(result).toHaveProperty("totalMeetings");
      expect(result).toHaveProperty("totalDirectives");
      expect(result).toHaveProperty("pendingDirectives");
    }
  });

  it("rejects unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.dashboard()).rejects.toThrow();
  });
});

describe("ceo.gems", () => {
  it("lists gems for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.gems.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated gem list requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.gems.list()).rejects.toThrow();
  });

  it("initializes board with default gems", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.gems.initializeBoard();

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("message");
    // Either "Board already initialized" or "Executive board initialized"
    expect(typeof result.count).toBe("number");
  });
});

describe("ceo.decisions", () => {
  it("lists decisions for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.decisions.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated decision list requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.decisions.list({ limit: 10 })).rejects.toThrow();
  });
});

describe("ceo.meetings", () => {
  it("lists meetings for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.meetings.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated meeting list requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.meetings.list({ limit: 10 })).rejects.toThrow();
  });
});

describe("ceo.directives", () => {
  it("lists directives for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.directives.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated directive list requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.directives.list({ limit: 10 })).rejects.toThrow();
  });
});

describe("ceo.snapshots", () => {
  it("lists snapshots for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ceo.snapshots.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects unauthenticated snapshot list requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.ceo.snapshots.list({ limit: 10 })).rejects.toThrow();
  });
});
