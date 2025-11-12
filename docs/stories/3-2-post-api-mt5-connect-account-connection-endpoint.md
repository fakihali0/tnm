# Story 3.2: POST /api/mt5/connect - Account Connection Endpoint

Status: ready-for-dev

## Story

As a **backend developer**,
I want **an endpoint that tests MT5 account credentials before persisting them**,
so that **users can verify credentials and receive immediate feedback without affecting stored data**. [Source: docs/epics.md#Story-3.2]

## Acceptance Criteria

1. Endpoint `POST /api/mt5/connect` (in `app/api/routes/mt5.py`) validates request body fields (login positive integer, password ≥ 6 chars, non-empty server/broker_name, user_id UUID) using Pydantic schemas. [Source: docs/epics.md#Story-3.2]
2. Endpoint requires `X-API-Key` and JWT authentication/ownership dependencies from Story 3.1 before execution. [Source: docs/epics.md#Story-3.2]
3. On success, calls `MT5ConnectionManager.login(login, password, server)`, fetches account info (`get_account_info`), and returns PRD-compliant JSON including balance/equity/margin/leverage plus generated `connection_id`. [Source: docs/epics.md#Story-3.2; docs/PRD-MT5-Integration-Service.md#5.2.1]
4. On failure (invalid credentials/broker unreachable), returns standardized error payload with `error_code`, message, MT5 error details, and does not persist credentials. [Source: docs/epics.md#Story-3.2; docs/PRD-MT5-Integration-Service.md#5.5]
5. Connection test times out after 10 seconds; errors are logged and forwarded to observability pipeline. [Source: docs/epics.md#Story-3.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Request/response schema + auth wiring:
  - [ ] Define Pydantic models for request and success/error responses aligned with PRD 5.2.1.
  - [ ] Apply `verify_api_key`, `verify_jwt_token`, and `verify_account_ownership` dependencies to the route.
- [ ] **Task 2 (AC:3)** – Connection attempt + success response:
  - [ ] Invoke `MT5ConnectionManager.login` and `get_account_info`, generate `connection_id`, and return JSON with account metrics and broker metadata.
  - [ ] Ensure connection test does not mutate persistent state.
- [ ] **Task 3 (AC:4,5)** – Error handling + timeout/logging:
  - [ ] Add timeout wrapper (asyncio wait or background task) to enforce 10-second limit.
  - [ ] Map MT5 errors to PRD error codes, log details, and return standardized error response without storing credentials.

## Dev Notes

- Endpoint is synchronous to the user but should not impact existing session/pool; consider using connection manager’s login method with temporary credentials.
- Reuse error response schema from PRD §5.5 to keep client messaging consistent.
- Timeout mechanism can use `asyncio.wait_for` or background task cancellation; document behavior when timeout triggers.

### Project Structure Notes

- Route lives in `app/api/routes/mt5.py`; request/response models may live in `app/api/schemas/mt5.py`.
- Dependencies come from `app/core/security.py` and `app/core/mt5_manager.py` (from Stories 3.1 and 2.1).

### References

- [Source: docs/epics.md#Story-3.2]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2.1]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-1-mt5-connection-manager-with-connection-pooling.context.xml]
- [Source: docs/stories/3-1-api-authentication-middleware.context.xml]

## Dev Agent Record

### Context Reference

- `docs/stories/3-2-post-api-mt5-connect-account-connection-endpoint.context.xml`

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be filled out after AC validation/tests._

### File List

_To be updated once implementation touches files (e.g., `app/api/routes/mt5.py`, `app/api/schemas/mt5.py`, tests)._ 

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow  | AF (via Bob) |
