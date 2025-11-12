# Story 4.5: Supabase Edge Function Deployment

Status: ready-for-dev

## Story

As a **DevOps engineer**,
I want **the updated MT5 edge functions deployed with the correct secrets and schedules**,
so that **production users benefit from the new connect and sync flows without manual intervention**. [Source: docs/epics.md#Story-4.5]

## Acceptance Criteria

1. `connect-mt5-account` and `sync-trading-data` are deployed via Supabase CLI (`supabase functions deploy ...`) and verified in the dashboard logs. [Source: docs/epics.md#Story-4.5; docs/PRD-MT5-Integration-Service.md#11.2-Deployment-Strategy; context7:/supabase/cli]
2. Supabase project secrets include `MT5_SERVICE_URL=https://mt5.tnm.com`, `MT5_SERVICE_API_KEY=<secure>`, and `ENCRYPTION_KEY=<32_byte_key>`; deployment notes capture where/how they were set. [Source: docs/epics.md#Story-4.5; docs/PRD-MT5-Integration-Service.md#11.3-Environment-Configuration]
3. Cron schedule `0 */5 * * *` is configured/enabled for `sync-trading-data` (Supabase Edge cron) with confirmation screenshot/log reference. [Source: docs/epics.md#Story-4.5]
4. Smoke tests run from Supabase dashboard or CLI invocations confirm success/failure responses for both functions, and logs are reviewed for errors post-deploy. [Source: docs/epics.md#Story-4.5; docs/PRD-MT5-Integration-Service.md#11.2-Deployment-Strategy]
5. Rollback procedure is documented (CLI commands, secret restoration, cron disablement) so the deployment can be reversed within minutes. [Source: docs/epics.md#Story-4.5]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Prepare deployment artifacts
  - [ ] Pull latest code, ensure Stories 4.1–4.4 are merged, run `supabase functions deploy connect-mt5-account` and `... sync-trading-data`.
  - [ ] Capture CLI output + dashboard status links for Dev Agent record.
- [ ] **Task 2 (AC:2)** – Secrets management
  - [ ] Run `supabase secrets set MT5_SERVICE_URL=... MT5_SERVICE_API_KEY=... ENCRYPTION_KEY=...` (or dashboard equivalent) and document values + owners.
  - [ ] Verify secrets via `supabase secrets list` and ensure edge functions read them.
- [ ] **Task 3 (AC:3)** – Cron configuration
  - [ ] Use dashboard → Edge Functions → sync-trading-data → Schedule to set `0 */5 * * *`; ensure it is enabled in prod + staging.
  - [ ] Record configuration evidence (screenshot or CLI output).
- [ ] **Task 4 (AC:4)** – Post-deploy validation
  - [ ] Invoke both functions via Supabase dashboard or `curl` (with service role key) covering success/failure cases.
  - [ ] Tail logs for at least one sync run to confirm healthy execution.
- [ ] **Task 5 (AC:5)** – Rollback/runbook updates
  - [ ] Document rollback steps (e.g., `supabase functions delete ... --yes`, disable cron, restore secrets from backup) in Dev Notes/README.
  - [ ] Note monitoring/alerting hooks (UptimeRobot, Supabase logs) for after deployment.

## Dev Notes

- **Dependencies:** Requires Stories 4.1–4.4 complete (edge function code, schema, RLS). Do not deploy until migrations are applied. [Source: docs/epics.md#Story-4.5]
- **CLI workflow:** Follow PRD section 11.2 and Supabase CLI docs (context7:/supabase/cli) for deploy, secrets, serve, and cron commands; always test in staging first.
- **Environment parity:** Ensure secrets match Story 1.7 outputs and Windows MT5 service URLs; remind teams to update `.env.edge` for local smoke tests. [Source: docs/PRD-MT5-Integration-Service.md#11.3-Environment-Configuration]
- **Monitoring:** Use Supabase Edge logs + UptimeRobot (from Story 3.7) to monitor immediately after cron enables; capture log links in Dev Agent record.
- **Rollback:** Keep previous function versions zipped/exported; if deploy fails, run `supabase functions deploy <name> --from-archive previous.tar.gz` or delete cron entry.
- **Previous story learnings:** Story 4.4 just drafted, so no implementation feedback yet; this deployment story should confirm policies/migrations exist before go-live.

### Project Structure Notes

- Deploy scripts documented in `docs/DEPLOYMENT.md` (update with CLI commands and cron instructions).
- Consider adding GitHub Actions job to automate `supabase functions deploy` once manual process vetted.
- Store screenshots/log references in `docs/deployment-artifacts/` for auditing.

### References

- [Source: docs/epics.md#Story-4.5]
- [Source: docs/PRD-MT5-Integration-Service.md#11.2-Deployment-Strategy]
- [Source: docs/PRD-MT5-Integration-Service.md#11.3-Environment-Configuration]
- [Source: context7:/supabase/cli]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.md]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.md]
- [Source: docs/stories/4-3-database-schema-updates-for-mt5-integration.md]
- [Source: docs/stories/4-4-row-level-security-rls-policies-update.md]

## Dev Agent Record

### Context Reference

- docs/stories/4-5-supabase-edge-function-deployment.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (deployment docs, scripts)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
