# AGENTS.md — Lane Discipline

Operating rules for every agent that commits to this repository: Manus, Claude,
Codex, OpenClaw, and any human driving them.

Read this before your first commit in a session. The rules below are short
because each one exists to prevent a specific incident that already happened
here — none of it is precautionary boilerplate.

## Who owns which lane

Several agents work on this repo from different machines, often at the same
time, and none of them can see each other's uncommitted work. Lanes exist so
two agents don't edit the same files from different directions.

| Lane | Owns these paths | Primary agent |
|---|---|---|
| **Marketing platform** | `server/agentEngine.ts`, `server/ceoAgentEngine*.ts`, `server/orchestrationEngine.ts`, `server/routers/`, `client/src/pages/` (non-Solar) | Manus |
| **Solar module** | `server/solar.db.ts`, `server/routers/solarRouter.ts`, `server/services/{pvwatts,quoteGenerator,solarSalesEngine}.ts`, `client/src/pages/Solar.tsx` | Manus |
| **AI Gateway** | `server/aiGateway/` | unassigned |
| **Schema** | `drizzle/schema.ts`, `drizzle/*.sql` | **shared — announce first** |
| **Repo hygiene / docs** | `AGENTS.md`, `CLAUDE.md`, `pnpm-lock.yaml`, `.gitignore` | Claude |

`drizzle/schema.ts` is the one file every lane needs. Two agents generating
migrations from different snapshots produces migrations that each assume the
other doesn't exist. Say what you're adding in the commit message before you
touch it.

## Rules

### 1. Never delete a lockfile

`pnpm-lock.yaml` is committed on purpose. Deleting it does not "clean up" the
repo — it makes every future `pnpm install` resolve fresh versions, so the
build that passes on your machine is not the build that runs anywhere else.

This already happened: commit `1b5c2c9` removed all 9049 lines while
`package.json` still pinned `packageManager: pnpm@10.4.1`. It was restored in
`1540a0f`. If a dependency genuinely changed, commit the *updated* lockfile —
never its absence.

### 2. Phase numbers must be unambiguous

`todo.md` currently has two independent numbering systems:

- `## Phase 1` … `## Phase 12` — the marketing platform roadmap
- `### Phase 1` … `### Phase 7` — solar sub-phases nested under `## Phase 12`

So "Phase 5" names two different things: `## Phase 5: Real-time Orchestration`
(not started) and the solar sub-phase (done). Commits `1b5c2c9` and `c6c87f6`
say "Phase 4 / Phase 5 Complete" meaning the solar ones, which reads as though
the marketing phases shipped. They didn't.

Always qualify: **`Phase 12.5`** or **`Solar Phase 5`** — never a bare number.

### 3. Declare a cross-domain move before making it

This repo is an AI *marketing agency*. Solar engineering (PVWatts, quote
generation, kWp sizing) is a different business domain that now lives here
too. That may well be intentional — the point is that it changes what this
repo *is*, so it belongs in a commit that says so, not one that reads like a
routine checkpoint.

Before adding a third domain, say where it goes and why in the commit body.

### 4. Match the response envelope already in the file

tRPC procedures return through `server/routers.ts`; DB access goes through
named functions in `server/db.ts` (and `server/solar.db.ts` for solar).
Routers never touch Drizzle directly. Follow whichever pattern the file you're
editing already uses rather than introducing a third.

### 5. Secrets come from env, and absent means fail

`server/services/pvwatts.ts` reads `NREL_PVWATTS_API_KEY` from the environment
— correct. Its `|| "demo"` fallback is not: a production deploy that forgets
the variable silently runs against NREL's shared demo key and gets throttled,
instead of failing loudly at boot. New integrations should throw on a missing
key rather than degrade into a stranger's quota.

Never commit a real key. `.env.example` carries names only.

## Before you commit

- `pnpm check` — tsc, strict
- `pnpm test` — vitest, `server/**/*.test.ts`

There is no CI in this repo. Nothing runs these for you; if you skip them,
nobody catches it.

Commit messages: say what changed and why it was safe. "Checkpoint: Phase N
Complete" tells the next agent nothing it can act on.

## Handing off

Every agent here works from a different machine and can lose its session
without warning — this has already cost work. Push before you stop, even
mid-task, on a branch named for the lane. Unpushed work is invisible to
everyone else and unrecoverable by them.
