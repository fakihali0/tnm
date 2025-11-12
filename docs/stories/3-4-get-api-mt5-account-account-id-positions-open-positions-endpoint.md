# Story 3.4: GET /api/mt5/account/{account_id}/positions - Open Positions Endpoint

Status: ready-for-dev

## Story

As a **backend developer**,
I want **an authenticated endpoint that returns active MT5 positions for a given account with optional filters**,
so that **users can view their open trades and profit in real time**. [Source: docs/epics.md#Story-3.4]

## Acceptance Criteria

1. `GET /api/mt5/account/{account_id}/positions` (in `app/api/routes/mt5.py`) requires API key + JWT + ownership validation identical to Story 3.3. [Source: docs/epics.md#Story-3.4]
2. Endpoint accepts optional query params `symbols` (comma-separated) and `type` ("buy"/"sell"), applies filters after data retrieval. [Source: docs/epics.md#Story-3.4]
3. Fetches account credentials from Supabase, decrypts password, logs into MT5 via `MT5ConnectionManager`, calls `get_positions_raw`, and transforms results with `transform_position`. [Source: docs/epics.md#Story-3.4; docs/PRD-MT5-Integration-Service.md#5.2.3]
4. Returns JSON with positions array, `total_positions`, `total_profit`, `timestamp`, and caching metadata (`cached`, `cache_age_seconds`), with a 5-second TTL for cache. [Source: docs/epics.md#Story-3.4]
5. Response time target: <500ms fresh, faster when served from cache; empty positions return empty array without error. [Source: docs/epics.md#Story-3.4]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Endpoint + dependencies:
  - [ ] Define FastAPI route, apply `verify_api_key`, `verify_jwt_token`, and `verify_account_ownership` dependencies.
  - [ ] Validate `account_id` UUID, parse query params (`symbols`, `type`).
- [ ] **Task 2 (AC:2,3)** – MT5 data fetch + transformation:
  - [ ] Retrieve Supabase credentials, decrypt password (Story 7.1 helper), login via `MT5ConnectionManager`, call `get_positions_raw` with symbol filter.
  - [ ] Apply optional type filter and map through `transform_position`.
- [ ] **Task 3 (AC:4,5)** – Caching + response formatting:
  - [ ] Implement 5-second TTL cache keyed by `account_id` + filters; include `cached` boolean and `cache_age_seconds`.
  - [ ] Compute `total_positions` and `total_profit`, ensure empty list returns success response.
- [ ] **Task 4 (AC:5)** – Error handling & logging:
  - [ ] Map MT5/Supabase errors to PRD error codes/status (401/403/500) with standardized payload; log failures.
  - [ ] Add tests or manual verification scenarios covering filters, cache hits, and MT5 failures.

## Dev Notes

- Reuse logic from Story 3.3 for auth/credential handling to keep endpoints consistent.
- For type filters, rely on transformed `type_str` field.
- Consider reusing the same caching utility introduced in Story 3.3 but with shorter TTL.

### Project Structure Notes

- Route: `app/api/routes/mt5.py`
- Schemas: `app/api/schemas/mt5.py` for response models
- Cache: shared utility (e.g., `app/core/cache.py`) for uniform implementation

### References

- [Source: docs/epics.md#Story-3.4]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.3]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.context.xml]
- [Source: docs/stories/2-3-mt5-data-transformation-layer.context.xml]
- [Source: docs/stories/3-1-api-authentication-middleware.context.xml]
- [Source: docs/stories/3-3-get-api-mt5-account-account-id-info-account-info-endpoint.context.xml]

## Dev Agent Record

### Context Reference

- `docs/stories/3-4-get-api-mt5-account-account-id-positions-open-positions-endpoint.context.xml`

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be filled out once testing completes._

### File List

_To be updated when files are modified (routes, schemas, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
