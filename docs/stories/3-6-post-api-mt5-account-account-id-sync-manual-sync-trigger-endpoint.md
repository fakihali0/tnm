# Story 3.6: POST /api/mt5/account/{account_id}/sync - Manual Sync Trigger Endpoint

Status: review

## Story

As a **backend developer**,
I want **an endpoint that queues a manual MT5 sync (full or incremental) for a specific account**,
so that **users can refresh data on demand instead of waiting for scheduled jobs**. [Source: docs/epics.md#Story-3.6]

## Acceptance Criteria

1. `POST /api/mt5/account/{account_id}/sync` in `app/api/routes/mt5.py` enforces API key + JWT + ownership validation and rate limits (max 1 sync per account per minute). [Source: docs/epics.md#Story-3.6]
2. Request body accepts `sync_type` ("full" or "incremental"), `sync_history` (bool), and `history_days` (int, default 30) with validation. [Source: docs/epics.md#Story-3.6]
3. Endpoint generates `sync_id` (UUID), enqueues a FastAPI `BackgroundTasks` job, and immediately returns a response with sync metadata (status=processing, estimated_duration_seconds). [Source: docs/epics.md#Story-3.6]
4. Background task performs the sync: fetches account info, positions, and history (full vs incremental), transforms data, upserts to Supabase tables (`trading_accounts`, `trades`), and updates `last_sync_at`, logging results into `sync_logs`. [Source: docs/epics.md#Story-3.6; docs/PRD-MT5-Integration-Service.md#5.2.5]
5. Failures inside the background task are logged and recorded in `sync_logs`, but do not crash the FastAPI worker; optional sync-status endpoint can query by `sync_id` (future story). [Source: docs/epics.md#Story-3.6]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Endpoint + validation:
  - [ ] Define FastAPI route with auth dependencies, rate limiting guard, and request body schema (Pydantic model) enforcing allowed values.
- [ ] **Task 2 (AC:3)** – Background task enqueue + response:
  - [ ] Generate `sync_id`, compute estimated duration, enqueue background task via `BackgroundTasks.add_task`, return immediate JSON response.
- [ ] **Task 3 (AC:4)** – Sync executor implementation:
  - [ ] Implement background function that fetches credentials, logs into MT5 (connection manager), retrieves account info/positions/history, transforms, and upserts to Supabase tables; update `last_sync_at` and insert record into `sync_logs`.
  - [ ] Support "full" vs "incremental" logic using `last_sync_at` when available.
- [ ] **Task 4 (AC:5)** – Error handling & rate limiting:
  - [ ] Log sync errors, capture them in `sync_logs`, and ensure retries or user notifications follow PRD guidance.
  - [ ] Enforce per-account manual sync limit (1/min) via in-memory or Redis TTL.

## Dev Notes

- Reuse logic from Stories 3.3–3.5 for data retrieval/transformation to avoid duplication.
- Consider using Supabase stored procedures or upsert logic for `trades` (on_conflict by ticket).
- Future story will expose sync status; log sync_id, start/end time, and outcome in `sync_logs` now.

### Project Structure Notes

- Route: `app/api/routes/mt5.py`
- Background worker: local function in the same module or a new `app/services/sync.py`
- Rate limiting: reuse pattern from Story 3.1 (e.g., Redis-based limiter)

### References

- [Source: docs/epics.md#Story-3.6]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.5]
- [Source: docs/stories/3-3-get-api-mt5-account-account-id-info-account-info-endpoint.context.xml]
- [Source: docs/stories/3-4-get-api-mt5-account-account-id-positions-open-positions-endpoint.context.xml]
- [Source: docs/stories/3-5-get-api-mt5-account-account-id-history-historical-trades-endpoint.context.xml]

## Dev Agent Record

### Context Reference

<!-- Story context will be generated later. -->

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be filled out after AC validation/tests._

### File List

_To be updated when files are modified (routes, services, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
