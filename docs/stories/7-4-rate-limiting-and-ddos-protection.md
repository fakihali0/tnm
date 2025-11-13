# Story 7.4: Rate Limiting and DDoS Protection

Status: ready-for-dev

## Story

As a **DevOps engineer**,  
I want **multi-layer rate limiting enforced across the FastAPI MT5 service and its Nginx front door**,  
so that **abusive clients and DDoS behavior cannot starve legitimate trading traffic or exhaust VPS resources**. [Source: docs/epics.md#Story-7.4; docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]

## Acceptance Criteria

1. FastAPI initializes `slowapi.Limiter` with `{ key: API key header if present; fallback: client IP }`, mounts `SlowAPIMiddleware`, and sets a default ceiling of **100 requests per minute per API key** covering all authenticated endpoints. Logged events must include key, route, and remaining tokens. [Source: docs/epics.md#Story-7.4; context7:/laurents/slowapi]
2. Endpoint-specific policies exist: `/api/mt5/connect` limited to **10 req/min API key**, `/api/mt5/account/{id}/sync` limited to **1 req/min API key**, and `GET /health` limited to **20 req/min per IP** while every other public route refuses unauthenticated IP-only traffic. Responses beyond the limit return HTTP 429 with `Retry-After` header and the JSON body mandated in the epic. [Source: docs/epics.md#Story-7.4]
3. Rate-limit state resets every 60 seconds, exposes metrics/logs for observability, and surfaces structured events to the existing logging sink so ops can alert on sustained throttling; configuration toggles allow future Redis backing (Phase 2) without code churn. [Source: docs/epics.md#Story-7.4; docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]
4. Automated tests (unit + integration) simulate burst traffic for each rule to assert the 429 payload/headers, while manual QA steps document `curl`/Locust or k6 scripts that prove both compliant (under limit) and throttled flows. [Source: docs/epics.md#Story-7.4]
5. Nginx reverse proxy applies complementary protections: `limit_conn_zone` enforcing **≤50 connections per IP**, `limit_req_zone` matching the API key/IP rules, request timeout ≤30s, and `client_max_body_size 1m`. Config changes live alongside Story 1.5’s reverse proxy setup and include reload instructions plus validation logs. [Source: docs/epics.md#Story-7.4; docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md#7-nginx-reverse-proxy-setup]
6. Documentation explains how AccountLinkForm/Edge Functions should react to 429s (e.g., retry after header, surface toast), ensuring frontend and Supabase workflows respect the new guardrails. [Source: docs/epics.md#Story-7.4; docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Integrate SlowAPI at service bootstrap  
  - [ ] Create limiter factory in `mt5-service/app/core/rate_limit.py` (or similar) that inspects `X-API-Key` / `Authorization` headers before falling back to IP.  
  - [ ] Attach `SlowAPIMiddleware`, default limits, and exception handler inside `app/main.py`, ensuring logs emit `{key, route, limit}` when thresholds are hit.  
  - [ ] Add configuration knobs (`RATE_LIMIT_DEFAULT`, `RATE_LIMIT_STORAGE`) to `config.py` with `.env` entries for future Redis enablement.
- [ ] **Task 2 (AC:2)** – Apply per-endpoint decorators + responses  
  - [ ] Decorate `/api/mt5/connect` and `/api/mt5/account/{id}/sync` routes with their specific limits, reusing helper constants to avoid typos.  
  - [ ] Wrap manual sync endpoint so concurrent calls share the same limiter key to prevent bypasses (e.g., repeated `account_id`).  
  - [ ] Update `/health` route to use IP-based keys and ensure all other routes enforce API key headers before limiter evaluation.
- [ ] **Task 3 (AC:3,6)** – Observability + client guidance  
  - [ ] Emit structured log events (`rate_limit.exceeded`) including retry-after seconds, API key hash, endpoint, and IP.  
  - [ ] Extend Developer Docs / README to explain how frontend and Supabase callers should honor 429 responses, including exponential backoff guidance.  
  - [ ] Prepare optional Redis adapter stub so Phase 2 can swap persistence backends without touching routes.
- [ ] **Task 4 (AC:4)** – Verification  
  - [ ] Build pytest suite (FastAPI TestClient) to hammer endpoints until limits trigger, asserting headers and JSON response.  
  - [ ] Capture manual QA evidence (curl loops / k6 script) showing both compliant and throttled flows, logging them in Dev Agent Debug Log.
- [ ] **Task 5 (AC:5)** – Harden Nginx  
  - [ ] Update `C:\\nginx\\conf\\nginx.conf` (from Story 1.5) with `limit_conn_zone`, `limit_req_zone`, `limit_req` directives, timeout, and body-size caps from the epic.  
  - [ ] Document reload commands (`nginx -s reload` / `nssm restart NginxService`) and verify via `nginx -T` plus sample load test that throttled responses bubble back with 503/429 per configuration.

## Dev Notes

- **Security layering:** SlowAPI enforces application-level throttling while Nginx guards connections; both layers must stay in sync with Story 7.1 encryption and Story 7.2 audit logging to satisfy PRD §8.2. [Source: docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements; docs/epics.md#Story-7.4]
- **Key derivation:** Prefer API key hash (e.g., SHA-256) when logging limiter hits so secrets are never written in plaintext, echoing Story 7.1 guidance.  
- **Health endpoint:** Keep `/health` lightweight (per Story 3.7) so Nginx limit_req handling doesn’t exhaust worker threads; document new threshold for UptimeRobot. [Source: docs/stories/3-7-get-health-service-health-check-endpoint.md]
- **Learnings from previous story:** Story 7.3 (GDPR data deletion) is still `ready-for-dev`, so there are no completion notes or review actions to incorporate yet.
- **Testing expectations:** Align pytest additions with existing FastAPI service suite (use `tests/test_rate_limit.py`) and capture Locust/k6 scripts inside `docs/testing/` for future regression use.

### Project Structure Notes

- FastAPI service lives under `mt5-service/app`; middleware/default limits belong in `app/main.py` and helpers under `app/core/`.  
- Configuration stays in `app/config.py` with environment variables defined via Story 1.7’s `.env` template; add `RATE_LIMIT_*` entries there.  
- Nginx config resides at `C:\nginx\conf\nginx.conf` (per WINDOWS-DEPLOYMENT-GUIDE §7); keep a backup copy before applying limit zones and commit sanitized snippets to `docs/technical/NETWORK-CONFIG.md`.

### References

- [Source: docs/epics.md#Story-7.4]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]  
- [Source: docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md#7-nginx-reverse-proxy-setup]  
- [Source: docs/stories/3-7-get-health-service-health-check-endpoint.md]  
- [Source: context7:/laurents/slowapi]

## Dev Agent Record

### Context Reference

- docs/stories/7-4-rate-limiting-and-ddos-protection.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Add curl/k6/Locust evidence after testing._

### Completion Notes List

_Populate after development to capture slowapi + Nginx decisions._

### File List

_List files touched (e.g., `app/main.py`, `app/core/rate_limit.py`, `app/api/routes/*.py`, `tests/test_rate_limit.py`, `C:\\nginx\\conf\\nginx.conf`)._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
