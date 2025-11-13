# Story 3.5: GET /api/mt5/account/{account_id}/history - Historical Trades Endpoint

Status: review

## Story

As a **backend developer**,
I want **an endpoint that returns paginated historical trades for a given account with flexible filters**,
so that **users can analyze past trading performance without storing MT5 credentials**. [Source: docs/epics.md#Story-3.5]

## Acceptance Criteria

1. `GET /api/mt5/account/{account_id}/history` (in `app/api/routes/mt5.py`) enforces API key + JWT + ownership validation. [Source: docs/epics.md#Story-3.5]
2. Supports query params `from_date`, `to_date`, `symbol`, `limit` (≤1000, default 100), and `offset` (default 0). Invalid dates/ranges return 400. [Source: docs/epics.md#Story-3.5]
3. Fetches Supabase credentials, decrypts password, logs into MT5 via `MT5ConnectionManager`, calls `get_history_deals_raw`, converts to trades using `transform_history_to_trades`, and applies symbol filter. [Source: docs/epics.md#Story-3.5; docs/PRD-MT5-Integration-Service.md#5.2.4]
4. Computes summary metrics (total_profit, total_loss, net_profit, win_rate, total_pips) and returns paginated trades along with period metadata, caching results for 5 minutes. [Source: docs/epics.md#Story-3.5]
5. Response times target <2 seconds; cached responses include `cached` metadata. [Source: docs/epics.md#Story-3.5]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Endpoint + validation:
  - [ ] Define FastAPI route with auth dependencies and parse query params (defaulting from_date = now-30d, to_date = now).
  - [ ] Validate date formats (ISO 8601 or Unix timestamp) and ensure limit/offset constraints.
- [ ] **Task 2 (AC:3)** – MT5 fetch + transformation:
  - [ ] Retrieve Supabase credentials, decrypt password, login via connection manager, and call `get_history_deals_raw`.
  - [ ] Pass results through `transform_history_to_trades`, then apply symbol filter.
- [ ] **Task 3 (AC:4,5)** – Summary, pagination, and caching:
  - [ ] Compute summary stats (profit/loss, win rate, pips) and apply limit/offset slicing.
  - [ ] Implement 5-minute TTL cache keyed by account_id + filters; include `cached` boolean and metadata in response.
- [ ] **Task 4 (AC:5)** – Error handling & testing:
  - [ ] Handle MT5/Supabase failures with standardized error responses; log events.
  - [ ] Verify performance targets and caching behavior via tests or instrumentation.

## Dev Notes

- Reuse utilities from Story 3.3 (auth, caching) and Story 2.3 (transformers) to avoid duplication.
- Date parsing can leverage `datetime.fromisoformat` plus fallback to `datetime.fromtimestamp`; ensure timezone awareness.
- Pagination occurs after transformation to respect filters; `has_more` is true if more records exist beyond limit.

### Project Structure Notes

- Route: `app/api/routes/mt5.py`
- Schemas: `app/api/schemas/mt5.py` for request/response models
- Cache utility: same module as other endpoints for consistent behavior

### References

- [Source: docs/epics.md#Story-3.5]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.4]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.context.xml]
- [Source: docs/stories/2-3-mt5-data-transformation-layer.context.xml]
- [Source: docs/stories/3-1-api-authentication-middleware.context.xml]
- [Source: docs/stories/3-4-get-api-mt5-account-account-id-positions-open-positions-endpoint.context.xml]

## Dev Agent Record

### Context Reference

- `docs/stories/3-5-get-api-mt5-account-account-id-history-historical-trades-endpoint.context.xml`

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be filled out after validation/tests._

### File List

_To be updated with touched files (routes, schemas, cache utilities, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
