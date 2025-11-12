# Story 7.2: Audit Logging for Credential Access

Status: ready-for-dev

## Story

As a **security engineer**,
I want **structured audit logs for authentication and credential access events**,
so that **security incidents can be detected and investigated**. [Source: docs/epics.md#Story-7.2]

## Acceptance Criteria

1. Implement audit logging module (e.g., `app/core/logger.py`) that records authentication events (API key/JWT success/failure, failed login attempts, rate limit violations) with structured JSON. [Source: docs/epics.md#Story-7.2; docs/PRD-MT5-Integration-Service.md#8.2 Security Requirements]
2. Log credential access events: password decryption, account connection, account deletion requests (account_id, user_id, IP, action, result). [Source: docs/epics.md#Story-7.2]
3. Logs stored in `logs/audit.log` (separate from app logs), with daily rotation retaining 90 days. [Source: docs/epics.md#Story-7.2]
4. Sensitive data (passwords, keys) never logged; errors contain only contextual info. [Source: docs/epics.md#Story-7.2]
5. Failed authentication attempts trigger alerts after 5 failures (placeholder hook for monitoring). [Source: docs/epics.md#Story-7.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Logging infrastructure
  - [ ] Create structured logger (JSON) dedicated to audit events; configure file handler + rotation.
- [ ] **Task 2 (AC:1/2)** – Authentication event hooks
  - [ ] Update API key + JWT validation to log success/failure with minimal metadata.
- [ ] **Task 3 (AC:2)** – Credential access events
  - [ ] Log password decrypts, account connect, account delete request; include user/account IDs and IPs.
- [ ] **Task 4 (AC:3)** – Log rotation & retention
  - [ ] Configure `TimedRotatingFileHandler` (daily, keep 90 days) or equivalent.
- [ ] **Task 5 (AC:4)** – Sensitive data safeguards
  - [ ] Ensure helpers sanitize fields, redact tokens, and enforce safe logging patterns.
- [ ] **Task 6 (AC:5)** – Alerts
  - [ ] Implement counter for failed auth attempts; send placeholder alert after threshold.
- [ ] **Task 7 (Testing)** – Validation
  - [ ] Add unit/integration tests verifying log output structure; document manual verification steps.

## Dev Notes

- **Dependencies:** Builds on Story 7.1 (encryption) and earlier auth stories (3.1). Ensure logging code is reusable and easily extendable.
- **Alerting:** For now, log an “alert” entry or call stub; future integration with monitoring service.
- **Performance:** Logging should be asynchronous or efficient to avoid blocking request handling.

### Project Structure Notes

- Logger config lives in `app/core/logger.py`; use `logging.config.dictConfig` or similar.
- Audit log path configurable via settings (default `logs/audit.log`).
- Tests under `tests/unit/test_audit_logging.py`.

### References

- [Source: docs/epics.md#Story-7.2]
- [Source: docs/PRD-MT5-Integration-Service.md#8.2 Security]
- [Source: docs/stories/3-1-api-authentication-middleware.md]
- [Source: docs/stories/7-1-aes-256-credential-encryption-implementation.md]

## Dev Agent Record

### Context Reference

- docs/stories/7-2-audit-logging-for-credential-access.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (logger config, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
