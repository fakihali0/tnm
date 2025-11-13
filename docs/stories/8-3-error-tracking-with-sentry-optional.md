# Story 8.3: Error Tracking with Sentry (Optional)

Status: ready-for-dev

## Story

As a **backend developer**,  
I want **the FastAPI MT5 service instrumented with Sentry for exception + performance telemetry**,  
so that **we capture production failures with full context and can alert on spikes quickly**. [Source: docs/epics.md#Story-8.3; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Acceptance Criteria

1. `sentry-sdk[fastapi]` is installed and initialized in `app/main.py` with DSN, environment (`production`/`staging`), release (Git SHA), and sample rates (100% errors, 10% transactions). [Source: docs/epics.md#Story-8.3; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements; context7:/getsentry/sentry-python]
2. Sentry automatically captures unhandled exceptions, HTTP 500 responses, background task failures, and MT5 connection errors. Reports include stack trace, request context (URL/method/headers), user/account info, environment metadata, and breadcrumbs derived from Story 8.1 structured logs. [Source: docs/epics.md#Story-8.3]
3. Sentry’s PII scrubbing is enabled so secrets are removed, aligning with the sanitization rules from Story 8.1/PRD §8.2. [Source: docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]
4. Alert rules: Slack `#alerts` notified on new error types, email digest on error spikes (>10/min), and daily summary digest. Configuration documented for ops handoff. [Source: docs/epics.md#Story-8.3; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
5. Verification: pytest/integration tests simulate raised exceptions to confirm Sentry capture; manual QA captures screenshot/log evidence and records it in Dev Agent Debug Log. [Source: docs/epics.md#Story-8.3]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Install & init Sentry  
  - [ ] Add `sentry-sdk[fastapi]` to requirements and initialize in `app/main.py` with DSN/env/release config.  
  - [ ] Set `traces_sample_rate` for transactions (default 0.1) and keep 100% error capture.
- [ ] **Task 2 (AC:2)** – Context + breadcrumbs  
  - [ ] Add middleware or hooks to tag user_id/account_id, API key hash, and correlation ID onto Sentry events.  
  - [ ] Wrap MT5 connection manager and background tasks with `start_span` blocks to record breadcrumbs.
- [ ] **Task 3 (AC:3)** – Sanitization + PII controls  
  - [ ] Configure `send_default_pii` judiciously and wire custom event processors to mask secrets per Story 8.1 rules.  
  - [ ] Document how to rotate DSN/secrets.
- [ ] **Task 4 (AC:4)** – Alert rules & runbook  
  - [ ] Configure Slack + email alerts inside Sentry, define spike thresholds, and export settings into `docs/operations/sentry.md`.  
  - [ ] Provide instructions for muting alerts during maintenance windows.
- [ ] **Task 5 (AC:5)** – Testing & evidence  
  - [ ] Write pytest (using `sentry_sdk.Hub.current`) to assert captured events for simulated HTTP 500 and background task errors.  
  - [ ] Trigger sample errors in staging, capture screenshots/log IDs, and reference them in Dev Agent Debug Log.

## Dev Notes

- Ensure Sentry DSN + auth tokens live in `.env` and never hit source control.  
- Coordinate with Story 8.1 structured logging so correlation IDs appear in both Sentry events and JSON logs.  
- Performance traces can be throttled via `traces_sample_rate` or dynamic sampling later; keep optional tag settings documented.

### Project Structure Notes

- `app/main.py` hosts SDK init; consider helper module `app/core/observability.py` for clarity.  
- Runbook docs should go in `docs/operations/sentry.md`.  
- Tests live under `tests/` (FastAPI backend).

### References

- [Source: docs/epics.md#Story-8.3]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]  
- [Source: context7:/getsentry/sentry-python]

## Dev Agent Record

### Context Reference

- docs/stories/8-3-error-tracking-with-sentry-optional.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Document staging error IDs/snapshots once Sentry alerts verified._

### Completion Notes List

_Summarize alert configs, sampling decisions, and runbook updates after delivery._

### File List

_Track modified files (`app/main.py`, requirements, docs/operations/sentry.md, tests/test_sentry.py`)._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
