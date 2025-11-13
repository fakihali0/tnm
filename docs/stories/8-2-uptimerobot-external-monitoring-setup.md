# Story 8.2: UptimeRobot External Monitoring Setup

Status: ready-for-dev

## Story

As a **DevOps engineer**,  
I want **UptimeRobot and its public status page watching the MT5 health endpoints and Supabase edge path**  
so that **production outages trigger rapid alerts and satisfy the PRD monitoring SLAs**. [Source: docs/epics.md#Story-8.2; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]

## Acceptance Criteria

1. UptimeRobot workspace contains two HTTP monitors:  
   - `MT5 Service Health` pinging `https://mt5.tnm.com/health` every 60 s expecting HTTP 200 + `"status":"healthy"`.  
   - `Supabase Edge Sync` invoking the deployed sync edge function (e.g., `https://<project>.functions.supabase.co/sync-trading-data`) every 5 min, checking JSON success.  
   Both monitors alert on HTTP 503, 4xx, DNS failure, or timeout within 30 s and log response time. [Source: docs/epics.md#Story-8.2; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements; docs/stories/3-7-get-health-service-health-check-endpoint.md]
2. Alert channels configured in UptimeRobot: email (devops@tnm.ai), Slack webhook (`#alerts`), and SMS for critical escalations. Policies: trigger email+Slack after 2 consecutive failures (~2 min); escalate to SMS if outage >5 min; send recovery notifications automatically. [Source: docs/epics.md#Story-8.2; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
3. A public status page (`https://status.tnm.com`) is created/enabled showing MT5 API and Supabase Edge components, uptime history, and incident notes. Links to this page are added to docs/LOCAL-DEVELOPMENT-GUIDE.md and customer-facing docs. [Source: docs/epics.md#Story-8.2]
4. Credentials + monitor metadata live in `docs/operations/uptimerobot.md` (new) documenting monitor IDs, intervals, alert contacts, and procedures for maintenance windows. File includes instructions for pausing monitors during planned downtime per PRD reliability policies. [Source: docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
5. Verification evidence: screenshots or exported monitor JSON plus manual test logs showing alerts firing when `/health` intentionally returns 503. Dev Agent Debug Log references capture these test runs. [Source: docs/epics.md#Story-8.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Configure monitors  
  - [ ] Create/upgrade UptimeRobot account to Pro (60 s polling) and add MT5 health monitor (GET) with keyword matching `"healthy"`.  
  - [ ] Create Supabase edge function monitor using POST/GET (depending on endpoint) with auth header (service key) stored as monitor HTTP header secret.  
  - [ ] Document monitor IDs, request bodies, and environment assumptions.
- [ ] **Task 2 (AC:2)** – Alert channels & escalation  
  - [ ] Add email, Slack webhook, and SMS contacts; map them to monitors with the specified delay/escalation thresholds.  
  - [ ] Test each channel (UptimeRobot “Test Alert” + simulated outage) and record results + timestamps.
- [ ] **Task 3 (AC:3)** – Publish status page  
  - [ ] Customize status.tnm.com (branding, components) and list MT5 API + Supabase Edge + Database.  
  - [ ] Update DNS/CNAME per UptimeRobot instructions and verify HTTPS.  
  - [ ] Link status page from docs/LOCAL-DEVELOPMENT-GUIDE.md, README, and customer docs.
- [ ] **Task 4 (AC:4)** – Ops documentation  
  - [ ] Write `docs/operations/uptimerobot.md` describing monitor details, API keys (obfuscated), maintenance windows, and on-call rotation steps.  
  - [ ] Note how to pause monitors for deployments and how to update alert contacts.
- [ ] **Task 5 (AC:5)** – Validation & logging  
  - [ ] Temporarily stop MT5 service (or mock 503) to trigger alerts; capture Slack/email/SMS evidence.  
  - [ ] Export UptimeRobot monitor list (CSV/JSON) and store sanitized copy in repo or attach to ticket; reference in Dev Agent Debug Log.

## Dev Notes

- **Health endpoint dependency:** Relies on Story 3.7 behavior (`/health` returning JSON with `status`). Ensure correlation IDs/logging from Story 8.1 remain unaffected when monitors hit the endpoint every 60 s.  
- **Supabase auth:** Use service role key stored in UptimeRobot HTTP header secrets; never embed credentials in plain text docs—obfuscate in runbook.  
- **PRD alignment:** Monitoring intervals and escalation windows align with PRD §8.3’s requirements (alert within 2 min, notify on >5 min outages).  
- **Previous story learnings:** Story 8.1 just drafted; no implementation learnings yet.

### Project Structure Notes

- New runbook path: `docs/operations/uptimerobot.md` (create directory if absent).  
- Link references in `docs/LOCAL-DEVELOPMENT-GUIDE.md` and `docs/NETWORK-CONFIG.md` so engineers know where to check monitor status before deployments.

### References

- [Source: docs/epics.md#Story-8.2]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]  
- [Source: docs/stories/3-7-get-health-service-health-check-endpoint.md]

## Dev Agent Record

### Context Reference

- docs/stories/8-2-uptimerobot-external-monitoring-setup.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Add alert test evidence links/screenshots once monitors are validated._

### Completion Notes List

_Document monitor IDs, timestamps of first alerts, and any issues setting up status page._

### File List

_Track artifacts such as `docs/operations/uptimerobot.md`, README updates, and exported monitor configs._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
