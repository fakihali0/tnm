# Story 4.4: Row Level Security (RLS) Policies Update

Status: ready-for-dev

## Story

As a **security engineer**,
I want **Row Level Security policies on all MT5-related tables**,
so that **users only access their own trading data while service-role integrations retain full privileges**. [Source: docs/epics.md#Story-4.4]

## Acceptance Criteria

1. `trading_accounts` has RLS enabled plus policies for SELECT/INSERT/UPDATE/DELETE that enforce `auth.uid() = user_id`, matching the epic specification. [Source: docs/epics.md#Story-4.4; docs/PRD-MT5-Integration-Service.md#6.3-Row-Level-Security]
2. `trades` gains RLS with a SELECT policy that only returns rows where `account_id` belongs to the caller’s accounts. [Source: docs/epics.md#Story-4.4; docs/PRD-MT5-Integration-Service.md#6.3-Row-Level-Security]
3. `sync_logs` (optional) enables RLS with admin-only or owner-only SELECT policies, ensuring telemetry isn’t exposed cross-user. [Source: docs/epics.md#Story-4.4]
4. Policies include comments referencing Stories 4.1–4.3, and migrations/documentation explain how the Supabase service role bypasses RLS for edge functions. [Source: docs/epics.md#Story-4.4]
5. RLS behavior is tested using Supabase SQL editor or CLI by impersonating multiple users, confirming access is restricted appropriately; test evidence recorded in Dev Notes. [Source: docs/PRD-MT5-Integration-Service.md#6.3-Row-Level-Security]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Enable RLS on `trading_accounts`
  - [ ] Update migration to enable RLS and add four policies for select/insert/update/delete tied to `auth.uid()`.
  - [ ] Comment each policy with rationale and dependency references.
- [ ] **Task 2 (AC:2)** – Secure `trades`
  - [ ] Enable RLS and create a SELECT policy that joins against `trading_accounts` (
        `account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid())`).
- [ ] **Task 3 (AC:3)** – Guard `sync_logs`
  - [ ] Decide if only admins/service-role can read; create policy accordingly (owner-only or restricted). Document reasoning.
- [ ] **Task 4 (AC:4)** – Service role / edge function considerations
  - [ ] Document in migration comments + Dev Notes how `service_role` bypasses RLS for edge functions and MT5 services.
- [ ] **Task 5 (AC:5)** – Verification plan
  - [ ] Use Supabase SQL editor or `psql` with mocked JWTs to test with two users, ensuring unauthorized access fails.
  - [ ] Record test steps/results in Dev Agent Debug Log instructions.

## Dev Notes

- **Dependencies:** Requires Story 4.3 schema changes; policies rely on `user_id` columns and `sync_logs` table. [Source: docs/epics.md#Story-4.4]
- **Service role:** Document that Supabase edge functions use the service role key, bypassing RLS, so no extra policies needed there. Regular API calls must use `anon`/`auth` keys and obey RLS. [Source: docs/epics.md#Story-4.4]
- **Testing approach:** Use Supabase SQL editor session tokens or `supabase auth signInWithPassword` to obtain JWTs for two users, then run `select`/`insert` queries verifying policies; capture outputs in Dev Agent record. [Source: docs/PRD-MT5-Integration-Service.md#6.3-Row-Level-Security]
- **Reference:** Supabase RLS examples (context7:/supabase.com/llmstxt) illustrate policy syntax for select/update/anon access.
- **Previous story learnings:** Story 4.3 just drafted, so no implemented feedback; ensure policy comments remind devs to align with future analytics stories.

### Project Structure Notes

- Policies live in the same SQL migration as Story 4.3 or a follow-up migration named `*_mt5_rls_policies.sql`.
- Keep naming consistent with existing policy conventions (e.g., `Users can view own trading accounts`).
- Add README snippet under `docs/` summarizing RLS expectations for backend/frontend devs.

### References

- [Source: docs/epics.md#Story-4.4]
- [Source: docs/PRD-MT5-Integration-Service.md#6.3-Row-Level-Security]
- [Source: docs/stories/4-3-database-schema-updates-for-mt5-integration.md]
- [Source: context7:/supabase.com/llmstxt]

## Dev Agent Record

### Context Reference

- docs/stories/4-4-row-level-security-rls-policies-update.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (migration, docs)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
