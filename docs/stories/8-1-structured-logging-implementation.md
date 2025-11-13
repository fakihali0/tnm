# Story 8.1: Structured Logging Implementation

Status: ready-for-dev

## Story

As a **backend developer**,  
I want **structured JSON logging, correlation IDs, and sanitized log streams across the MT5 FastAPI service**,  
so that **operations can search events programmatically and meet the PRD’s monitoring requirements**. [Source: docs/epics.md#Story-8.1; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Acceptance Criteria

1. `app/core/logger.py` configures Python’s logging stack with `python-json-logger` (or equivalent) so every record (INFO and above) is emitted as JSON containing timestamp, level, logger name, message, file/module, correlation_id, request_path, duration_ms, and optional domain fields (account_id/user_id). Log levels follow PRD definitions, and DEBUG verbosity can be toggled via `.env`. [Source: docs/epics.md#Story-8.1; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements; context7:/nhairs/python-json-logger]
2. Request-scoped correlation IDs are generated via middleware (`uuid4`) for every FastAPI request, stored in `contextvars`, and injected automatically into all log records plus outgoing Supabase/edge-function headers so downstream services can attach the same identifier. [Source: docs/epics.md#Story-8.1]
3. Sensitive data is redacted by a custom logging filter: passwords/API keys masked, PII excluded, and MT5 credentials never logged. Filters must run before handlers write to disk/STDOUT, preventing accidental leaks even during exceptions. [Source: docs/epics.md#Story-8.1; docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]
4. Log routing creates three rotating files under `logs/`: `app.log` (all INFO+), `audit.log` (security/audit events), and `error.log` (ERROR+). Rotation policy: daily rollover, keep 30 days, compressed archives. Logger health metrics (dropped records, queue size) are exposed via `/health` diagnostics. [Source: docs/epics.md#Story-8.1; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]
5. Tests and docs cover the new system: pytest verifies JSON structure and redaction, while manual QA shows sample log lines plus instructions for ingesting into future observability tools (Grafana Loki/ELK). Documentation explains how Supabase edge functions and frontend clients propagate correlation IDs and interpret audit entries. [Source: docs/epics.md#Story-8.1; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Build structured logger module  
  - [ ] Implement `create_logger()` in `app/core/logger.py` using `python-json-logger` formatter, including default fields and timezone-aware timestamps.  
  - [ ] Wire logger factory into `app/main.py` so all modules import from a single configured logger hierarchy.  
  - [ ] Add `.env` entries (`LOG_LEVEL`, `LOG_FORMAT=JSON`) and reflect them in `config.py`.
- [ ] **Task 2 (AC:2)** – Correlation ID middleware  
  - [ ] Create FastAPI middleware that seeds `contextvars` with `req_<uuid>` per request and injects header `X-Correlation-ID` when calling Supabase/edge functions.  
  - [ ] Extend logging filter to pull the current correlation ID automatically; update tests to ensure nested async tasks reuse the same ID.
- [ ] **Task 3 (AC:3)** – Sanitization + audit channel  
  - [ ] Implement a filter that inspects `record.__dict__` and redacts keys like `password`, `api_key`, `token`, `secret`, `mt5_credentials`.  
  - [ ] Route security-sensitive events (login failures, credential access) to `audit.log`, aligned with future Story 7.2 audit logging.  
  - [ ] Document redaction coverage and add unit tests proving masked outputs.
- [ ] **Task 4 (AC:4)** – File handlers + rotation  
  - [ ] Configure TimedRotatingFileHandler (daily, backupCount=30, compression) for `app.log`, `audit.log`, `error.log`; ensure Windows paths work on the VPS.  
  - [ ] Update `/health` diagnostic block to report logger status (e.g., ability to write to disk, last rotation time).  
  - [ ] Provide ops instructions for log shipping (e.g., tailing to nxlog/Winlogbeat) in `docs/NETWORK-CONFIG.md`.
- [ ] **Task 5 (AC:5)** – Verification + docs  
  - [ ] Add pytest cases using `caplog` to assert JSON shape, correlation IDs, and redactions.  
  - [ ] Produce sample log snippets and ingestion guidance in `docs/technical/LOGGING.md` (new) referencing ELK/Grafana pipelines.  
  - [ ] Capture manual QA evidence (e.g., request hitting `/api/mt5/info`) showing consistent IDs across FastAPI logs and Supabase headers; record in Dev Agent Debug Log.

## Dev Notes

- **Library guidance:** `python-json-logger`’s `JsonFormatter` supports injecting extra fields; use filters/contextvars (per context7 snippet) to add `request_id`, `user_id`, and durations automatically. [Source: context7:/nhairs/python-json-logger]  
- **Downstream compatibility:** Log schema should anticipate ELK/Grafana ingestion—include ISO timestamps, numeric duration, and consistent key casing.  
- **Dependencies:** Story 7.2 (audit logging) will reuse the audit handler; coordinate field names now to avoid rework.  
- **Previous story learnings:** No prior Epic 8 stories are implemented, so there are no completion notes to import yet.

### Project Structure Notes

- Logger code belongs in `mt5-service/app/core/logger.py` with init in `app/main.py`.  
- Log directories (`logs/`) reside alongside the FastAPI service; ensure Windows ACLs allow the service account to write/rotate.  
- Add documentation for log ingestion under `docs/technical/LOGGING.md` and update `docs/NETWORK-CONFIG.md` if shipping to external systems.

### References

- [Source: docs/epics.md#Story-8.1]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.2-Security-Requirements]  
- [Source: context7:/nhairs/python-json-logger]

## Dev Agent Record

### Context Reference

- docs/stories/8-1-structured-logging-implementation.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Add pytest/manually captured log evidence after testing._

### Completion Notes List

_Populate after development to summarize logger wiring, rotation outcomes, and ingestion steps._

### File List

_Track modifications such as `app/core/logger.py`, `app/main.py`, `app/middleware/correlation.py`, `tests/test_logging.py`, `docs/technical/LOGGING.md`, `logs/*`._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
