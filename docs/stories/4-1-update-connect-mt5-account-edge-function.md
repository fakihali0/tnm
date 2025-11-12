# Story 4.1: Update connect-mt5-account Edge Function

Status: ready-for-dev

## Story

As a **backend developer**,
I want **the connect-mt5-account Supabase edge function to call the Python MT5 service**,
so that **users can link their MT5 accounts from the frontend without MetaAPI dependencies**. [Source: docs/epics.md#Story-4.1]

## Acceptance Criteria

1. `supabase/functions/connect-mt5-account/index.ts` accepts `login`, `password`, `server`, and `broker_name`, validates payloads, and removes all legacy MetaAPI logic. [Source: docs/epics.md#Story-4.1]
2. The function calls `POST {MT5_SERVICE_URL}/api/mt5/connect` with `X-API-Key: {MT5_SERVICE_API_KEY}`, reusing the FastAPI authentication model (Story 3.1) and retrying once on timeout before failing. [Source: docs/epics.md#Story-4.1; docs/PRD-MT5-Integration-Service.md#Function:-connect-mt5-account]
3. Successful responses encrypt the password using the AES-256 helper from Story 7.1, insert/merge the MT5 record in `trading_accounts`, persist encrypted credentials in `account_integrations`, and return the new `account_id`. [Source: docs/epics.md#Story-4.1; docs/PRD-MT5-Integration-Service.md#Function:-connect-mt5-account]
4. Failed validations or MT5 errors return structured errors without writing to Supabase, while logging attempt metadata and updating `last_connection_error` fields for observability. [Source: docs/epics.md#Story-4.1]
5. The function is configurable via `MT5_SERVICE_URL` and `MT5_SERVICE_API_KEY` secrets (per Story 1.7) and includes structured logging so Supabase dashboard traces each attempt. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Update-Supabase-Edge-Functions; docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
6. Manual tests via `supabase functions serve connect-mt5-account` and cloud invokes demonstrate success + failure paths, ensuring the frontend can call the updated function without further changes. [Source: docs/PRD-MT5-Integration-Service.md#Function:-connect-mt5-account]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Refactor edge function scaffolding
  - [ ] Remove MetaAPI imports, handlers, and unused secrets.
  - [ ] Normalize request schema (TypeScript zod or manual guard) for login/password/server/broker_name.
  - [ ] Load Supabase URL/key and service role key securely for DB access.
- [ ] **Task 2 (AC:2)** – MT5 service integration
  - [ ] Build helper to invoke `{MT5_SERVICE_URL}/api/mt5/connect` with `X-API-Key` header and JSON payload.
  - [ ] Implement timeout + single retry (backoff) and translate FastAPI error payloads into edge function responses.
- [ ] **Task 3 (AC:3)** – Credential encryption + persistence
  - [ ] Reuse Story 7.1 AES-256 utility (or placeholder until merged) to encrypt password before storage.
  - [ ] Insert/merge `trading_accounts` (status, broker, server metadata) and `account_integrations` (encrypted_password, broker_name) within a transactional block.
- [ ] **Task 4 (AC:4,5)** – Error handling, logging, configuration
  - [ ] Capture service responses + validation failures in structured logs, including connection attempts and request IDs.
  - [ ] Update secrets (`MT5_SERVICE_URL`, `MT5_SERVICE_API_KEY`) via `supabase secrets set ...` for dev/stage/prod; document alignment with Story 1.5 ngrok workflow.
  - [ ] Write failure handler that surfaces `last_connection_error` and never persists partial data.
- [ ] **Task 5 (AC:6)** – Verification & rollout
  - [ ] Run `supabase functions serve connect-mt5-account --env-file .env.edge` locally against ngrok/Windows MT5 service.
  - [ ] Add CLI or REST invocation samples for QA and frontend teams, noting expected JSON contract.
  - [ ] Capture manual test evidence (success + failure) in Debug Log References section for the dev agent.

## Dev Notes

- **Dependencies:** Requires Story 3.2 (FastAPI `POST /api/mt5/connect`) to be deployed and Story 7.1 AES helper to encrypt/decrypt credentials consistently. [Source: docs/epics.md#Story-4.1; docs/epics.md#Story-7.1]
- **Environment:** Secrets must match Story 1.7 outputs—`MT5_SERVICE_URL`, `MT5_SERVICE_API_KEY`, Supabase service role key, and AES key length (32 bytes). Update ngrok URLs per Story 1.5 when testing from cloud functions. [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md; docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- **Data writes:** `trading_accounts` needs connection metadata + `mt5_service_account_id`; `account_integrations` stores encrypted password blobs; both should log via Supabase console for auditing. [Source: docs/PRD-MT5-Integration-Service.md#Function:-connect-mt5-account]
- **Error telemetry:** Include executionId/requestId from Supabase Edge runtime plus MT5 error codes so Support can correlate with service logs.
- **Previous story context:** Story 3.7 is ready-for-dev but not yet implemented, so no additional learnings beyond keeping `/health` public.

### Project Structure Notes

- Edge function entry: `supabase/functions/connect-mt5-account/index.ts`.
- Supabase secrets managed via `supabase secrets set` per environment; keep `.env.edge` local only.
- Encryption helper should live in a shared module (e.g., `supabase/functions/_shared/crypto.ts`) reused by future edge stories (4.2, 4.5).

### References

- [Source: docs/epics.md#Story-4.1]
- [Source: docs/PRD-MT5-Integration-Service.md#Function:-connect-mt5-account]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Update-Supabase-Edge-Functions]
- [Source: docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: docs/epics.md#Story-7.1]
- [Source: docs/stories/3-2-post-api-mt5-connect-account-connection-endpoint.context.xml]

## Dev Agent Record

### Context Reference

- docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (edge function, shared crypto helper, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
