# CLAUDE.md

Guidance for AI coding assistants (Claude Code and similar) working in this repository.

## What this project is

**Automated Marketing Agency** — a full-stack TypeScript web app that simulates an AI-powered
digital marketing agency. A React SPA frontend talks to an Express + tRPC backend that runs
several "AI agents" (strategy, copywriting, visual, media buying, optimization, lead scoring,
competitor analysis) via LLM calls, plus a "CEO Board" layer that aggregates state across this
app and two sibling systems (an SEO system called **Travobet** and a trading system called
**Polymarket**) for executive-style cross-system analysis.

The project was originally scaffolded on the **Manus** app-builder platform (see `vite-plugin-manus-runtime`,
`.manus/`, `ai-studio/`, `client/public/__manus__/`, and the Manus OAuth/webdev SDK in
`server/_core/sdk.ts`). Directories/files named `_core` (`server/_core/`, `client/src/_core/`)
are platform-provided scaffolding (auth, tRPC wiring, Vite dev/prod server, env loading) —
treat them as infrastructure, not feature code. Application logic lives in `server/*.ts`,
`server/routers/`, `server/connectors/`, `server/aiGateway/`, and `client/src/pages|components`.

The repo is mid-migration (v4.0, "Vercel AI Gateway + Codex Integration") from directly calling
one LLM helper (`invokeLLM`) to a new multi-model `server/aiGateway/` abstraction. Read the
"Current state / gotchas" section below before assuming either path is the finished one.

## Directory structure

```
.
├── client/                      React 19 SPA (Vite)
│   ├── src/
│   │   ├── _core/hooks/         Platform-provided hooks (useAuth)
│   │   ├── components/          App components; components/ui/ = shadcn/ui primitives
│   │   ├── contexts/            ThemeContext
│   │   ├── hooks/                Generic hooks (mobile detection, composition, etc.)
│   │   ├── lib/                 trpc.ts (typed tRPC client), utils.ts
│   │   ├── pages/                One file per route (Dashboard, Campaigns, CeoBoard, agent pages, etc.)
│   │   ├── App.tsx               Route table (wouter) + providers
│   │   └── main.tsx               Entry point
│   └── public/__manus__/         Manus platform runtime assets
├── server/
│   ├── _core/                   Platform scaffolding: env.ts, trpc.ts, context.ts, oauth.ts,
│   │                            sdk.ts (Manus webdev OAuth client), llm.ts (invokeLLM),
│   │                            imageGeneration.ts, voiceTranscription.ts, vite.ts, index.ts (entrypoint)
│   ├── routers/                 ceoRouter.ts, crossSystemRouter.ts, integrationRouter.ts (OAuth for HubSpot/Meta)
│   ├── connectors/               crossSystemEngine.ts, polymarketTradingConnector.ts,
│   │                            travobetSeoConnector.ts — data pulls for the cross-system CEO view
│   ├── integrations/             hubspotService.ts, metaAdsService.ts
│   ├── aiGateway/                 New multi-model client (client.ts, modelRouter.ts, costCalculator.ts,
│   │                            fallback.ts, loopHarness.ts, hermesClient.ts, engineOrchestrator.ts,
│   │                            observability.ts, types.ts) — see gotchas, largely not wired in yet
│   ├── agentEngine.ts            The 7 marketing agents (strategy/copywriting/visual/media buying/
│   │                            optimization/lead scoring/competitor analysis), via invokeLLM
│   ├── ceoAgentEngine.ts          CEO Board engine actually used by ceoRouter.ts (invokeLLM-based)
│   ├── ceoAgentEngine.migrated.ts CEO engine rewritten to use aiGateway — NOT imported anywhere yet
│   ├── orchestrationEngine.ts    Agent orchestration/state machine
│   ├── autonomousScheduler.ts    Cron-based scheduled agent tasks (`cron` package)
│   ├── webhookManager.ts         Outbound webhook dispatch
│   ├── db.ts                     All Drizzle queries (one function per query), MySQL via mysql2
│   ├── routers.ts                Assembles the root tRPC `appRouter`
│   └── *.test.ts                 Vitest test files, colocated in server/
├── shared/                       Code imported by both client and server (path alias `@shared/*`)
│   ├── const.ts                  Cookie name, timeouts, shared error message strings
│   ├── types.ts                  Re-exports Drizzle schema types + shared errors
│   └── _core/errors.ts
├── drizzle/                      Drizzle ORM: schema.ts (26 tables), relations.ts, SQL migrations
│   ├── schema.ts                 Single source of truth for DB schema (MySQL dialect)
│   └── 000x_*.sql, meta/         Generated migrations + snapshots (via drizzle-kit)
├── ai-studio/skills/              Manus-platform "skill" prompt/schema definitions (e.g. ceo_analysis.json)
├── .manus/db/                     Manus platform debug/query artifacts (not app data)
├── patches/                        pnpm patch for wouter@3.7.1
├── DESIGN_SPECS.md                 AI Gateway v4.0 design doc (in-progress architecture)
├── IMPLEMENTATION_PLAN.md          AI Gateway v4.0 implementation plan (in-progress)
├── PHASE5_MIGRATION.md             Plan for migrating CEO/Performance/Cross-System engines to aiGateway
└── todo.md                        Long running roadmap; checkboxes are NOT reliably kept in sync (see gotchas)
```

There is no `README.md`, `AGENTS.md`, or prior `CLAUDE.md` in this repo — this file is new.

## Tech stack

- **Frontend:** React 19, Vite 7, Tailwind CSS **v4** (`@tailwindcss/vite`, NOT v3), shadcn/ui
  (`components.json`, style "new-york") on Radix primitives, `wouter` for routing (patched, see
  `patches/wouter@3.7.1.patch`), TanStack Query, react-hook-form + zod, framer-motion, recharts.
- **Backend:** Express 4 + tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`),
  superjson transformer, Zod input validation, JWT sessions via `jose` (cookie name `app_session_id`).
- **Database:** MySQL via `drizzle-orm/mysql2` + `mysql2` driver; schema/migrations managed by `drizzle-kit`.
- **Language/build:** TypeScript 5.9 (strict), `tsx` for dev server, `esbuild` for the server production bundle.
- **Testing:** Vitest, tests colocated under `server/*.test.ts`.
- **Package manager:** pnpm (pinned in `packageManager` field; a `pnpm-lock.yaml` exists and one
  patched dependency, `wouter`, plus an override forcing `tailwindcss>nanoid` to `3.3.7`).
- **Auth:** Delegated to the Manus platform's OAuth/webdev service (`server/_core/sdk.ts`,
  `server/_core/oauth.ts`) — this is not a self-contained auth system; it exchanges codes with
  an external `OAUTH_SERVER_URL`.

## Setup / dev / build / test / lint commands

All from the repo root (no monorepo/workspaces — one `package.json`).

```bash
pnpm install          # install deps (uses the committed pnpm-lock.yaml; node_modules is not checked in)

pnpm dev              # NODE_ENV=development, tsx watch server/_core/index.ts
                       # single Express process serves the Vite dev middleware AND the tRPC API
                       # picks the first free port from 3000 upward (PORT env overrides start port)

pnpm build            # vite build (client) + esbuild bundle of server/_core/index.ts -> dist/
pnpm start            # NODE_ENV=production node dist/index.js  (serves static client + API)

pnpm check            # tsc --noEmit  (strict mode; this is the closest thing to "lint" for types)
pnpm format           # prettier --write .   (see .prettierrc / .prettierignore)
pnpm test             # vitest run   (only server/**/*.test.ts, *.spec.ts per vitest.config.ts)

pnpm db:push          # drizzle-kit generate && drizzle-kit migrate  (requires DATABASE_URL)
```

There is **no ESLint config** and **no `.github/workflows`** (no CI in this repo) — `pnpm check`
(tsc) and `pnpm test` (vitest) are the only automated gates available. There's also no dedicated
`lint` script; `format` (Prettier) is as close as it gets.

`node_modules/` was not present at the time of this analysis — run `pnpm install` before trying
to build, typecheck, or test.

## Environment variables

No `.env.example` is checked in. Based on `server/_core/env.ts` and grep of `process.env` usage:

| Variable | Used for |
|---|---|
| `DATABASE_URL` | MySQL connection string for Drizzle (`server/db.ts`, `drizzle.config.ts`). Required for `db:push`; the app itself degrades gracefully (queries return `[]`/`undefined`) if it's unset — see gotchas. |
| `VITE_APP_ID` | Manus platform app id (`ENV.appId`) |
| `JWT_SECRET` | Session cookie signing secret (`ENV.cookieSecret`) |
| `OAUTH_SERVER_URL` | Base URL of the Manus webdev OAuth service (`server/_core/sdk.ts`) |
| `OWNER_OPEN_ID` | Manus platform owner identity |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Backing LLM/image/voice service used by `invokeLLM`, `generateImage`, voice transcription in `server/_core/` |
| `MAXPLUS_API_KEY` | Referenced in `server/hermes.test.ts` for the Hermes client (aiGateway) |
| `HUBSPOT_CLIENT_ID` / `HUBSPOT_CLIENT_SECRET` / `HUBSPOT_REDIRECT_URI` | HubSpot OAuth (`server/routers/integrationRouter.ts`) |
| `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` | Meta (Facebook/Instagram) Ads OAuth (`server/routers/integrationRouter.ts`) |
| `PORT` | Preferred starting port for the dev/prod server (auto-increments if busy) |
| `NODE_ENV` | `development` selects Vite middleware mode; anything else serves static `dist/` |

Never print or hardcode actual secret values for these.

## Architecture and conventions actually used

- **tRPC router composition:** `server/routers.ts` builds small routers per domain (campaign,
  agent, creative, lead, analytics, competitor, optimization, integration) and combines them plus
  `ceoRouter`/`crossSystemRouter`/`systemRouter` into one `appRouter` exported as `AppRouter`. The
  client imports this **type only** (`client/src/lib/trpc.ts`) for end-to-end type safety — do not
  import server runtime code into the client.
- **Auth pattern:** `publicProcedure` vs `protectedProcedure` (requires `ctx.user`) vs
  `adminProcedure` (requires `role === "admin"`), all defined in `server/_core/trpc.ts`. `ctx.user`
  is populated in `server/_core/context.ts` via the session cookie / Manus SDK.
- **Data access layer:** All DB reads/writes go through named functions in `server/db.ts`
  (e.g. `getCampaignsByUserId`, `createLead`, `updateOptimizationRule`) — routers never touch
  Drizzle directly. `getDb()` lazily creates a single Drizzle client and **returns `null`/empty
  results instead of throwing when `DATABASE_URL` is missing** — most `db.ts` functions have an
  `if (!db) return [] / undefined` guard. Keep that defensive style when adding new queries.
- **Agent pattern (`server/agentEngine.ts`):** each agent is a plain async function
  (`runStrategyAgent`, `runCopywritingAgent`, `runVisualAgent`, `runMediaBuyingAgent`,
  `runOptimizationAgent`, plus `runLeadScoringAgent`/`runCompetitorAnalysisAgent` referenced from
  `routers.ts`). Each: creates an `agentTasks` row, logs to `agentActivityLog`, builds a
  system+user prompt, calls `invokeLLM(...)`, expects/parses structured JSON back, updates the
  task row, and returns `{ taskId, result, tokensUsed }`.
- **CEO / cross-system layer:** `ceoAgentEngine.ts` (wired into `ceoRouter.ts`) and
  `server/connectors/crossSystemEngine.ts` aggregate state from this app plus two **simulated**
  sibling systems — `travobetSeoConnector.ts` (SEO) and `polymarketTradingConnector.ts` (trading).
  Both connectors' code comments say outright that they **simulate** data collection since those
  external systems aren't actually reachable from here; don't mistake their output for live data.
- **AI Gateway (`server/aiGateway/`):** a newer, parallel LLM abstraction (multi-model routing,
  cost calculator, fallback manager, "Loop Harness" guards, observability logging, a `hermesClient`
  for orchestration). Per `PHASE5_MIGRATION.md`/`IMPLEMENTATION_PLAN.md` this is meant to replace
  direct `invokeLLM` calls across the CEO/Performance/Cross-System engines. See gotchas — it is
  only partially adopted.
- **Frontend routing:** `wouter`'s `<Switch>/<Route>` in `client/src/App.tsx`, one page component
  per route under `client/src/pages/`, wrapped in `CyberLayout` + `ThemeProvider` +
  `ErrorBoundary`. UI primitives come from shadcn/ui (`client/src/components/ui/`); don't hand-roll
  a component that already exists there.
- **Path aliases:** `@/*` → `client/src/*`, `@shared/*` → `shared/*` (defined in `tsconfig.json`
  and mirrored in `vite.config.ts`/`vitest.config.ts`). Use these instead of long relative imports.
- **Schema-first DB:** `drizzle/schema.ts` is the single source of truth (26 `mysqlTable`s covering
  users, campaigns, agent tasks/activity, leads, analytics, competitors, optimization rules,
  integration settings, scheduled tasks, webhooks, content library, video jobs, orchestration
  state, CEO tables — executiveGems/ceoDecisions/boardMeetings/systemDirectives/performanceSnapshots
  — plus systemModules/seoData/tradingData/crossSystemAnalysis for the cross-system layer). Change
  schema here, then run `pnpm db:push` to generate/apply a migration — don't hand-write SQL migrations.

## Current state / gotchas

- **`server/aiGateway/client.ts`'s `callModel()` is a mock** — it returns a hardcoded "Mock
  response from {model}" string, it does not call any real LLM provider yet. Anything built purely
  on top of `UnifiedAIGatewayClient.invoke()` today will not produce real model output.
- **`server/ceoAgentEngine.migrated.ts` exists but is dead code** — nothing imports it.
  `server/routers/ceoRouter.ts` still uses the original `server/ceoAgentEngine.ts`
  (`invokeLLM`-based). If asked to "finish" the AI Gateway migration, this is the file to wire in,
  matching the plan in `PHASE5_MIGRATION.md`.
- **`todo.md` checkboxes are stale/unreliable.** Recent commit messages (see `git log`) claim
  Phase 5 work ("CEO Engine migrated", "Hermes Client", "Engine Orchestrator") is complete, but the
  corresponding `todo.md` items are still shown unchecked (`[ ]`). Verify actual status by reading
  code/tests, not by trusting `todo.md`.
- **Cross-system data is simulated, not integration-tested against real systems.** Travobet and
  Polymarket are separate products this app doesn't actually call; the connectors generate
  plausible mock/AI-generated data. Don't treat their metrics as ground truth in tests or demos.
- **No lockfile-installed `node_modules`** at analysis time — run `pnpm install` first; don't
  assume a running dev server or passing tests without it.
- **No CI, no ESLint.** Type safety is enforced via `pnpm check` (tsc strict) and unit tests
  (`pnpm test`, Vitest, `server/**/*.test.ts`) only. There is nothing that lints `client/`.
- **Tailwind is v4** (`@tailwindcss/vite` plugin, CSS-based config via `client/src/index.css`, no
  `tailwind.config.js` in the repo) — v3-style JS config or `@apply`-heavy patterns from Tailwind 3
  docs won't directly apply.
- **`_core` directories are Manus platform scaffolding**, not typical app code — auth/session
  handling, the dev/prod Vite/Express bootstrap, and the raw `invokeLLM`/image/voice helpers live
  there. Prefer extending `agentEngine.ts` / routers / `aiGateway/` over modifying `_core` unless
  the platform-level plumbing itself is broken.
- **`.manus/`, `ai-studio/`, `client/public/__manus__/`** are platform artifacts/config (debug
  query logs, "skill" prompt+schema JSON, runtime version files) — not application data models;
  don't confuse `ai-studio/skills/*.json` prompt templates with the actual `invokeLLM` call sites
  in `agentEngine.ts`/`ceoAgentEngine.ts`, which currently build prompts inline rather than loading
  these JSON files.
- **DB is optional at runtime by design** — nearly every function in `server/db.ts` silently
  no-ops or returns empty data when `DATABASE_URL` isn't set. This makes the dev server bootable
  without MySQL, but also means a misconfigured `DATABASE_URL` fails silently rather than erroring
  — check logs ("[Database] Failed to connect") if data isn't persisting.
