# Notion Integration Playbook for Agent Swarm AI War Room

## Scope and constraints
This guide focuses on **Notion + Agent Swarm operational integration**. It does **not** perform OS-level file moves (e.g., C: to D:) and does not reverse-engineer third‑party proprietary services.

## 1) Target architecture

- **Notion** = control plane + knowledge base + execution log.
- **Your Agent Swarm backend** = execution engine (APIs, schedulers, workers).
- **MCP/App connectors** = secure bridge for read/write between Notion and your runtime.

### Core data flow
1. Human/CEO creates directive in Notion.
2. Automation reads directive and posts to Agent API.
3. Agent updates status, outputs, metrics.
4. Sync worker writes updates back to Notion databases.
5. War room dashboards render health + KPIs from Notion and internal DB.

---

## 2) Required Notion workspace setup

Create a parent page: **"AI War Room"** with these databases:

### A) `Directives`
Purpose: top-level command queue from leadership.

Recommended properties:
- `Title` (title)
- `Directive ID` (text, unique)
- `Priority` (select: Critical, High, Medium, Low)
- `Owner Agent` (select)
- `Status` (select: Draft, Approved, Queued, Running, Blocked, Done, Failed)
- `Due Date` (date)
- `Success Criteria` (text)
- `Created By` (people)
- `Related Campaign` (relation -> Campaigns)
- `Execution Run` (relation -> Agent Runs)

### B) `Campaigns`
Purpose: marketing execution object.

Properties:
- `Campaign Name` (title)
- `Channel` (multi-select)
- `Budget` (number)
- `Objective` (select)
- `Start/End` (date)
- `KPI Target` (text)
- `Current KPI` (text)
- `Health` (select: Green, Yellow, Red)

### C) `Agent Runs`
Purpose: every execution run from swarm.

Properties:
- `Run ID` (title)
- `Agent` (select)
- `Directive` (relation -> Directives)
- `Started At` (date)
- `Ended At` (date)
- `Duration Sec` (number)
- `Status` (select: Queued, Running, Success, Error, Cancelled)
- `Input Payload` (text)
- `Output Summary` (text)
- `Error` (text)
- `Logs URL` (url)

### D) `Knowledge Base`
Purpose: long-term SOPs, postmortems, reusable playbooks.

Properties:
- `Title` (title)
- `Type` (select: SOP, Playbook, Incident, Learnings)
- `Tags` (multi-select)
- `Source Run` (relation -> Agent Runs)
- `Version` (text)
- `Approved` (checkbox)

### E) `Integrations Registry`
Purpose: connection governance.

Properties:
- `System` (title)
- `Connector Type` (select: API, Webhook, MCP)
- `Status` (select: Active, Degraded, Offline)
- `Last Check` (date)
- `Owner` (people)
- `Secrets Ref` (text - external vault path only)

---

## 3) Notion API and security configuration

1. Create internal integration at Notion Developers.
2. Enable capabilities: `Read content`, `Update content`, `Insert content`.
3. Share each War Room database with integration bot.
4. Store token in secrets manager:
   - `NOTION_TOKEN`
   - `NOTION_VERSION=2022-06-28`
5. Never store raw token in Notion pages.

### Minimum env vars

```bash
NOTION_TOKEN=secret_xxx
NOTION_VERSION=2022-06-28
NOTION_DB_DIRECTIVES=<uuid>
NOTION_DB_CAMPAIGNS=<uuid>
NOTION_DB_AGENT_RUNS=<uuid>
NOTION_DB_KB=<uuid>
NOTION_DB_INTEGRATIONS=<uuid>
WARROOM_API_BASE=https://your-warroom-api
WARROOM_API_KEY=<secret>
```

---

## 4) Backend connector contract (recommended)

Implement these endpoints/services in your backend:

- `POST /integrations/notion/sync/directives`  
  Pull queued directives from Notion and enqueue jobs.
- `POST /integrations/notion/sync/runs`  
  Push run status updates to Notion.
- `POST /integrations/notion/webhook`  
  Receive action triggers (if using external webhook relay).
- `GET /integrations/notion/health`  
  Connectivity + permission checks.

### Event mapping
- Notion `Status=Approved` -> job enqueue
- Agent `run.started` -> Agent Runs row create/update
- Agent `run.failed` -> Status=Error + Error message
- Agent `run.succeeded` -> Status=Success + Output Summary

---

## 5) MCP + IDE + Codex workflow

Use Notion as the **source of operational truth**, and Codex as **implementation engine**:

1. Product owner writes directive in Notion.
2. MCP server reads directive and exposes normalized task JSON.
3. Codex consumes task JSON, generates/edits code, runs tests.
4. CI/CD posts build/test/deploy result back to `Agent Runs`.
5. Postmortem + reusable SOP saved to `Knowledge Base`.

Suggested JSON task envelope:

```json
{
  "directive_id": "DIR-2026-05-0001",
  "priority": "High",
  "goal": "Launch Meta lead-gen campaign",
  "constraints": ["Daily budget <= 500", "Thai + English copy"],
  "acceptance_criteria": ["CPL < 3 USD", "100 qualified leads in 7 days"],
  "attachments": ["notion://page/..."],
  "owner_agent": "media_buying_agent"
}
```

---

## 6) Operating model for Agent Swarm War Room

### Daily cadence
- 09:00: CEO review board (Directives + Campaign health)
- Every 15 min: directive sync worker
- Every 5 min: run status sync
- 18:00: automated daily briefing generation

### Escalation rules
- Any `Critical` directive blocked > 30 min -> alert Slack/LINE
- 3 consecutive failed runs same directive -> auto-freeze and require human approval
- Integration status `Degraded/Offline` -> open incident in KB

---

## 7) Governance and auditability

- Use immutable run IDs and cross-link every directive to run.
- Keep secrets in vault (1Password/Doppler/AWS SM), never in Notion text.
- Add “Approved by” and “Decision rationale” fields for executive decisions.
- Retain run logs for at least 90 days.

---

## 8) Implementation checklist (done-by-team)

- [ ] Create 5 Notion databases above
- [ ] Create Notion integration and share DBs
- [ ] Set environment variables in backend
- [ ] Implement sync endpoints
- [ ] Add cron jobs for directive/run sync
- [ ] Configure alerting on failures
- [ ] Validate permission scope with health endpoint
- [ ] Run end-to-end dry run from directive -> completion

---

## 9) What this enables immediately

- Centralized command-and-control in Notion
- Realtime visibility of agent execution
- Traceable decision pipeline from CEO directive to agent output
- Faster handoff to Codex for implementation and maintenance
