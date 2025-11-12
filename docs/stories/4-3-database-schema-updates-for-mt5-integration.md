# Story 4.3: Database Schema Updates for MT5 Integration

Status: ready-for-dev

## Story

As a **database developer**,
I want **Supabase migrations that add the MT5-specific tables/columns for accounts, trades, and sync logs**,
so that **the edge functions and Python service can persist connection health, metrics, and sync telemetry reliably**. [Source: docs/epics.md#Story-4.3]

## Acceptance Criteria

1. New migration files under `supabase/migrations/` add the required columns to `trading_accounts` (mt5_service_account_id, connection_status, last_connection_error, last_successful_sync_at, sync_failure_count, broker_server_time_offset) plus the `idx_trading_accounts_sync_status` index. [Source: docs/epics.md#Story-4.3; docs/PRD-MT5-Integration-Service.md#6.2-Database-Schema-Updates]
2. `sync_logs` table is created with the schema defined in PRD (id, account_id FK, sync_type, started_at, completed_at, status, trades_synced, error_message, duration_ms, created_at) and an index on `(account_id, started_at DESC)`. [Source: docs/epics.md#Story-4.3; docs/PRD-MT5-Integration-Service.md#6.2-Database-Schema-Updates]
3. A rollback (down migration) exists that drops the new columns, index, and `sync_logs` table without data loss for pre-existing fields. [Source: docs/epics.md#Story-4.3]
4. Migrations run via Supabase CLI locally (`supabase db reset` in dev, `supabase db push`) with test evidence captured, and staging is updated before production. [Source: docs/epics.md#Story-4.3; docs/PRD-MT5-Integration-Service.md#6.2-Database-Schema-Updates]
5. Existing data is preserved during upgrade—columns default safely, and comments describe relation to Stories 4.1/4.2 for downstream developers. [Source: docs/epics.md#Story-4.3]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Extend `trading_accounts`
  - [ ] Generate migration (`supabase migration new mt5_trading_accounts_extensions`).
  - [ ] Add columns + index per AC, ensuring appropriate defaults/nullability to avoid locking issues.
- [ ] **Task 2 (AC:2)** – Create `sync_logs`
  - [ ] Define table with UUID PK, FK to `trading_accounts`, and columns for sync metadata, status, timing, errors.
  - [ ] Add `idx_sync_logs_account` index for chronological lookups.
- [ ] **Task 3 (AC:3)** – Rollback coverage
  - [ ] Implement `down` SQL that removes added objects while leaving prior data intact.
- [ ] **Task 4 (AC:4)** – Validation & rollout
  - [ ] Run migrations locally (document commands/output), confirm schema via `supabase db remote commit --dry-run` or `psql` inspection.
  - [ ] Plan staging → production promotion with Supabase CLI steps.
- [ ] **Task 5 (AC:5)** – Documentation & impact
  - [ ] Update Dev Notes/README stubs to explain new columns/log table for Stories 4.1/4.2 usage.
  - [ ] Note that MT5 edge functions require these fields for rate limiting and telemetry.

## Dev Notes

- **Dependencies:** Precedes Stories 4.1/4.2/4.4; must finish before edge functions persist connection metrics. [Source: docs/epics.md#Story-4.3]
- **Environment:** Use Supabase CLI (`supabase db reset`, `supabase db push`) per PRD guidance; keep `.env` secrets aligned with Story 1.7. [Source: docs/epics.md#Story-4.3; docs/LOCAL-DEVELOPMENT-GUIDE.md]
- **Migration style:** Prefer SQL migrations (Supabase default). Include rollback statements and comments referencing edge-function dependencies. [Source: docs/epics.md#Story-4.3]
- **Data safety:** Add columns with `DEFAULT NULL` and avoid locking full table; create index concurrently if supported by Supabase Postgres tier or run during maintenance window.
- **Reference material:** Postgres migration best practices (context7:/salsita/node-pg-migrate) for up/down structure and comment usage.
- **Previous story learnings:** Story 4.2 is drafted, so no implementation feedback yet; ensure columns satisfy its planned writes (`last_successful_sync_at`, `sync_logs`).

### Project Structure Notes

- SQL migration files live under `supabase/migrations/<timestamp>_mt5_schema_update.sql`.
- Consider adding helper views/materialized views later for reporting—note in Dev Notes for future analytics stories.
- Keep generated SQL alphabetized with existing conventions (check older migrations for naming patterns).

### References

- [Source: docs/epics.md#Story-4.3]
- [Source: docs/PRD-MT5-Integration-Service.md#6.2-Database-Schema-Updates]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Update-Supabase-Edge-Functions]
- [Source: context7:/salsita/node-pg-migrate]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.md]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.md]

## Dev Agent Record

### Context Reference

- docs/stories/4-3-database-schema-updates-for-mt5-integration.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (migrations, docs)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
