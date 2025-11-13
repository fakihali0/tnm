# Story 3.3: GET /api/mt5/account/{account_id}/info - Account Info Endpoint

Status: review

## Story

As a **backend developer**,
I want **an authenticated endpoint that returns live MT5 account metrics (balance/equity/margin) for a given account_id**,
so that **the frontend can display accurate account information without storing credentials**. [Source: docs/epics.md#Story-3.3]

## Acceptance Criteria

1. `GET /api/mt5/account/{account_id}/info` lives in `app/api/routes/mt5.py`, requires `X-API-Key`, JWT auth, and verifies account ownership via Supabase. [Source: docs/epics.md#Story-3.3]
2. Endpoint loads account credentials from `trading_accounts`, decrypts the password (AES-256 per Story 7.1), and calls `MT5ConnectionManager.login` followed by `get_account_info_raw`. [Source: docs/epics.md#Story-3.3]
3. Results are transformed via `transform_account_info()` to PRD-compliant JSON and cached in-memory for 30 seconds, including `cached` and `cache_age_seconds` metadata. [Source: docs/epics.md#Story-3.3]
4. Response time targets: <1s on fresh fetch, <100ms for cached responses; cache invalidates after 30s or when login fails. [Source: docs/epics.md#Story-3.3]
5. Errors return appropriate HTTP status codes (401/403/500) with standardized payloads; credentials are never persisted by this endpoint. [Source: docs/PRD-MT5-Integration-Service.md#5.2.2; §5.5]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Endpoint + auth wiring:
  - [ ] Define FastAPI route with dependencies (`verify_api_key`, `verify_jwt_token`, `verify_account_ownership`).
  - [ ] Validate `account_id` UUID using Pydantic or path converter.
- [ ] **Task 2 (AC:2,3)** – Credential fetch + MT5 call + transformation:
  - [ ] Query Supabase `trading_accounts`, decrypt password, invoke `MT5ConnectionManager.login` and `get_account_info_raw`.
  - [ ] Pass the raw result through `transform_account_info()` and build PRD-compliant response object including metadata.
- [ ] **Task 3 (AC:3,4)** – Caching + performance:
  - [ ] Implement 30-second in-memory cache keyed by account_id; track timestamps to compute `cache_age_seconds` and performance targets.
  - [ ] Instrument logging to capture response times and cache hits.
- [ ] **Task 4 (AC:5)** – Error handling & testing:
  - [ ] Map Supabase/MT5 failures to 4xx/5xx responses per PRD; ensure sensitive info never logged.
  - [ ] Add tests or manual scenarios verifying unauthorized access, invalid ownership, cache behavior, and MT5 failure fallback.

## Dev Notes

- Reuse connection manager + transformer implementations from Stories 2.1–2.3; avoid duplicating logic.
- AES-256 decrypt helper references Story 7.1; import existing utilities rather than writing new crypto code.
- Consider using FastAPI background tasks or TTL cache to avoid blocking requests for long MT5 operations.

### Project Structure Notes

- Route: `app/api/routes/mt5.py`
- Schemas: `app/api/schemas/mt5.py` (new) for request/response models
- Cache: simple dict in module or `cachetools TTLCache`

### References

- [Source: docs/epics.md#Story-3.3]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.2]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-1-mt5-connection-manager-with-connection-pooling.context.xml]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.context.xml]
- [Source: docs/stories/2-3-mt5-data-transformation-layer.context.xml]
- [Source: docs/stories/3-1-api-authentication-middleware.context.xml]

## Dev Agent Record

### Context Reference

- `docs/stories/3-3-get-api-mt5-account-account-id-info-account-info-endpoint.context.xml`

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be filled out once testing/verification completes._

### File List

_To be updated when files are created or modified (routes, schemas, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
