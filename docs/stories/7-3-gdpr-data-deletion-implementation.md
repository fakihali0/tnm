# Story 7.3: GDPR Data Deletion Implementation

Status: ready-for-dev

## Story

As a **backend developer**,
I want **a GDPR erasure workflow that removes all MT5-related data for a user within 24 hours**, 
so that **the service complies with right-to-erasure regulations**. [Source: docs/epics.md#Story-7.3]

## Acceptance Criteria

1. Provide a deletion entry point (CLI or admin endpoint) that takes a `user_id` and deletes all related records in `trading_accounts`, `account_integrations`, `trades`, and `sync_logs` (matching the schema from Stories 4.1–4.3). [Source: docs/epics.md#Story-7.3]
2. Operation runs in <24 hours and sends confirmation email/log entry once completed. [Source: docs/epics.md#Story-7.3]
3. Logs capture deletion request, execution status, and any failures (without exposing sensitive data). [Source: docs/PRD-MT5-Integration-Service.md#8.3 Compliance]
4. If MT5 credentials still exist on Windows service, trigger a script/API call to remove them. [Source: docs/epics.md#Story-7.3]
5. Automated tests (integration) verify tables are empty for the user after deletion. [Source: docs/epics.md#Story-7.3]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Deletion script/endpoint
  - [ ] Implement CLI command or admin API to delete user data in Supabase tables using transactions.
- [ ] **Task 2 (AC:2)** – Confirmation flow
  - [ ] Integrate with email/send log entry once deletion completes; record timestamps.
- [ ] **Task 3 (AC:3)** – Logging
  - [ ] Use audit logger (Story 7.2) to log request and result.
- [ ] **Task 4 (AC:4)** – MT5 credential cleanup
  - [ ] Add step/script to remove Windows-stored credentials for the user (e.g., call PowerShell script).
- [ ] **Task 5 (AC:5)** – Testing
  - [ ] Write integration tests that seed data and confirm deletion removes all rows; document manual QA steps.

## Dev Notes

- **Dependencies:** Requires schema from Stories 4.1–4.3 (account tables, sync logs) and audit logging from Story 7.2.
- **Safety:** Use transactions with retries; ensure you only target the requested `user_id`.
- **Documentation:** Provide runbook for ops describing how to trigger deletion and confirm success.

### References

- [Source: docs/epics.md#Story-7.3]
- [Source: docs/PRD-MT5-Integration-Service.md#8.3 Compliance]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]
- [Source: docs/stories/4-3-database-schema-updates-for-mt5-integration.context.xml]
- [Source: docs/stories/7-2-audit-logging-for-credential-access.md]

## Dev Agent Record

### Context Reference

- docs/stories/7-3-gdpr-data-deletion-implementation.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (deletion script, docs, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
