# Story 4.2: Update sync-trading-data Edge Function

Status: ready-for-dev

## Story

As a **backend developer**,
I want **the sync-trading-data Supabase edge function to orchestrate MT5 account refreshes through the Python service**,
so that **account balances, positions, and history stay current every five minutes without relying on MetaAPI**. [Source: docs/epics.md#Story-4.2]

## Acceptance Criteria

1. `/supabase/functions/sync-trading-data/index.ts` loads all active `trading_accounts` (`is_active = true`) with the Supabase service role key and removes any remaining MetaAPI references. [Source: docs/epics.md#Story-4.2; docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data]
2. Accounts are processed in batches of 10 using async concurrency guards; each account invokes the MT5 service endpoints (`GET /api/mt5/account/{id}/info`, `/positions`, `/history?from_date={last_sync_at}`) with the same API key/auth used by Story 3.x. [Source: docs/epics.md#Story-4.2]
3. After each batch, the function updates `trading_accounts` (balance/equity/margin/`last_sync_at`) and upserts current positions plus new history rows into `trades`, matching tickets to avoid duplicates. [Source: docs/epics.md#Story-4.2; docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data]
4. Failures for one account never halt others—errors are captured per account, `sync_logs` receives the outcome (status, duration, error), and `trading_accounts.last_connection_error/sync_failure_count` are updated when applicable. [Source: docs/epics.md#Story-4.2; docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data]
5. Execution respects Supabase’s 5-minute limit: batches throttle via `Promise.allSettled`, and instrumentation logs batch timings plus totals. [Source: docs/epics.md#Story-4.2]
6. A Supabase cron entry (`0 */5 * * *`) or CLI scheduling docs accompany the deployment steps so cloud runs match requirements; manual `supabase functions serve sync-trading-data` tests cover success/failure flows. [Source: docs/epics.md#Story-4.2; docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data; context7:/supabase/cli]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Refactor edge function bootstrap
  - [ ] Strip MetaAPI imports/logic and load service role key + Supabase client via environment secrets defined in Story 1.7.
  - [ ] Query `trading_accounts` filtered by `is_active = true` and optional health flags from Story 4.3.
- [ ] **Task 2 (AC:2)** – MT5 service batching helpers
  - [ ] Build a batching iterator (size 10) that schedules `Promise.allSettled` calls to the three MT5 endpoints per account with shared headers.
  - [ ] Implement timeout + retry (single backoff) consistent with Story 4.1 patterns so transient failures retry once.
- [ ] **Task 3 (AC:3)** – Persistence + transformation
  - [ ] Map info payloads to `balance/equity/margin/last_sync_at` updates on `trading_accounts`.
  - [ ] Upsert open positions and insert new closed trades via `supabase.from('trades').upsert(..., { onConflict: 'ticket' })`.
- [ ] **Task 4 (AC:4,5)** – Resilience & observability
  - [ ] Write per-account result objects (status, duration_ms, error) into `sync_logs` (Story 4.3 schema) and bump `sync_failure_count` when needed.
  - [ ] Log batch timings + totals; wrap batches with short `await` to avoid exceeding 5-minute runtime.
- [ ] **Task 5 (AC:6)** – Scheduling & verification
  - [ ] Document Supabase cron entry (`supabase functions deploy sync-trading-data --no-verify-jwt` + dashboard schedule) and provide CLI serve instructions referencing `.env.edge`.
  - [ ] Capture manual invocation evidence (success/failure) for Dev Agent Debug Log references.

## Dev Notes

- **Dependencies:** Requires Stories 3.3–3.5 for MT5 info/positions/history endpoints plus Story 4.3 schema columns (`last_successful_sync_at`, `sync_logs`, indexes) to exist before deployment. [Source: docs/epics.md#Story-4.2; docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data]
- **Environment/Secrets:** Reuse `MT5_SERVICE_URL`, `MT5_SERVICE_API_KEY`, Supabase service role key, and AES key definitions from Story 1.7; align with the ngrok guidance in Story 1.5 when calling local services from cloud functions. [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md; docs/LOCAL-DEVELOPMENT-GUIDE.md#Update-Supabase-Edge-Functions; docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- **Batching Strategy:** Follow PRD instructions to process 10 accounts at a time; using `Promise.allSettled` ensures partial failures don’t reject the batch while still logging errors. [Source: docs/epics.md#Story-4.2]
- **Data Integrity:** Use transactions or ordered operations so `trading_accounts` updates happen only after MT5 responses succeed; partial data writes should be avoided per PRD reliability rules.
- **Scheduling:** Reference Supabase CLI docs (context7:/supabase/cli) for serving, deploying, and scheduling the function, ensuring cron `0 */5 * * *` is configured post-deploy.
- **Learnings from previous story:** Story 4.1 is still drafted, so no implementation-specific lessons exist yet; reuse its planned AES helper and logging conventions once delivered.

### Project Structure Notes

- Edge function file: `supabase/functions/sync-trading-data/index.ts` with potential helpers in `supabase/functions/_shared/`.
- Cron configuration lives in Supabase dashboard → Edge Functions → Schedules; document CLI alternatives in repo README if needed.
- Tests/log scripts should live beside the function or in `supabase/functions/tests/` for parity with future Supabase workflows.

### References

- [Source: docs/epics.md#Story-4.2]
- [Source: docs/PRD-MT5-Integration-Service.md#Function:-sync-trading-data]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Update-Supabase-Edge-Functions]
- [Source: docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: docs/epics.md#Story-4.3]
- [Source: docs/stories/3-3-get-api-mt5-account-account-id-info-account-info-endpoint.context.xml]
- [Source: docs/stories/3-4-get-api-mt5-account-account-id-positions-open-positions-endpoint.context.xml]
- [Source: docs/stories/3-5-get-api-mt5-account-account-id-history-historical-trades-endpoint.context.xml]
- [Source: context7:/supabase/cli]

## Dev Agent Record

### Context Reference

- docs/stories/4-2-update-sync-trading-data-edge-function.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (edge function, shared helpers, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
