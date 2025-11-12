# Story 3.1: API Authentication Middleware

Status: ready-for-dev

## Story

As a **backend developer**,
I want **API key + JWT authentication middleware with Supabase ownership checks and rate limiting**,
so that **only authorized services/users can call MT5 endpoints and requests are throttled per PRD security rules**. [Source: docs/epics.md#Story-3.1; docs/PRD-MT5-Integration-Service.md#5.4]

## Acceptance Criteria

1. `app/core/security.py` (or equivalent) exposes dependencies: `verify_api_key`, `verify_jwt_token`, and `verify_account_ownership`, wired via FastAPI `Depends`/`Security`. [Source: docs/epics.md#Story-3.1; context7:/fastapi/fastapi]
2. `verify_api_key` validates `X-API-Key` header against `MT5_SERVICE_API_KEY` env var, logs failures, and returns 401 when missing/invalid. [Source: docs/epics.md#Story-3.1]
3. `verify_jwt_token` validates Supabase JWT signatures (using `python-jose`), extracts `user_id` (`sub`), handles expiry, and raises 401 on failure. [Source: docs/epics.md#Story-3.1; docs/PRD-MT5-Integration-Service.md#5.4]
4. `verify_account_ownership` queries Supabase `trading_accounts` ensuring the authenticated user owns `account_id`; returns 403 otherwise. [Source: docs/epics.md#Story-3.1]
5. All API routes (except `/health`) enforce `X-API-Key`; user-specific endpoints also require JWT + ownership check. [Source: docs/epics.md#Story-3.1]
6. Rate limiting (100 req/min per API key) implemented via `slowapi`/`fastapi-limiter` (Redis) using the API key/JWT subject as the limiter key; violations return HTTP 429 with retry headers. [Source: docs/epics.md#Story-3.1; docs/PRD-MT5-Integration-Service.md#5.4]
7. Failed auth attempts log timestamp, IP, and reason; metrics surfaced for monitoring. [Source: docs/epics.md#Story-3.1]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1-3)** – Implement API key & JWT dependencies:
  - [ ] Add `verify_api_key` Security dependency (using `APIKeyHeader`) that compares header to env var and logs/raises 401 on mismatch. [Source: docs/epics.md#Story-3.1; context7:/fastapi/fastapi]
  - [ ] Add `verify_jwt_token` that parses `Authorization: Bearer` tokens via `python-jose`, validates signature/expiry, and returns `user_id`. [Source: docs/PRD-MT5-Integration-Service.md#5.4]
- [ ] **Task 2 (AC:4-5)** – Ownership + dependency wiring:
  - [ ] Implement `verify_account_ownership(user_id, account_id)` calling Supabase (service key) to confirm ownership. [Source: docs/epics.md#Story-3.1]
  - [ ] Update routers (except `/health`) to require `verify_api_key`; user-targeted routes chain JWT + ownership dependencies.
- [ ] **Task 3 (AC:6)** – Rate limiting:
  - [ ] Integrate `slowapi`/`fastapi-limiter` configured with Redis connection, using API key hash or JWT subject as limiter key; set policy 100 requests/min. [Source: docs/epics.md#Story-3.1]
  - [ ] Ensure limit headers (`X-RateLimit-*`, `Retry-After`) returned on throttled responses.
- [ ] **Task 4 (AC:7)** – Logging & monitoring:
  - [ ] Instrument failed auth attempts with IP, timestamp, error code; expose counters for observability.
  - [ ] Add doc snippet describing required headers and example responses (401/403/429) per PRD.

## Dev Notes

- **Env dependencies:** Reuse Story 1.7 settings for `MT5_SERVICE_API_KEY`, Supabase secrets, and rate-limit config.
- **JWT validation:** Use `python-jose` or `supabase` helpers; ensure algorithms align with Supabase JWT config.
- **Ownership check:** Consider caching Supabase responses briefly to reduce load, but ensure revocations propagate quickly.
- **Rate limit store:** Document Redis requirement (docker compose or Supabase redis) for limiter backend.

### Project Structure Notes

- Core logic: `app/core/security.py`
- Router wiring: apply dependencies via FastAPI `Depends` or `Security` in `app/api/routes/*.py`
- Rate limiter middleware typically registered in `app/main.py`

### References

- [Source: docs/epics.md#Story-3.1]
- [Source: docs/PRD-MT5-Integration-Service.md#5.4]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/fastapi/fastapi]

## Dev Agent Record

### Context Reference

- `docs/stories/3-1-api-authentication-middleware.context.xml`

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Capture sample log outputs for failed auth/rate-limit events._

### Completion Notes List

_Document manual/automated test steps (e.g., curl with wrong API key, expired JWT)._

### File List

_Expected: `app/core/security.py`, router modules, rate limiter config._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
