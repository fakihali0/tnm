# Story 5.5: Frontend Environment Configuration

Status: ready-for-dev

## Story

As a **frontend developer**,
I want **MT5-related environment variables configured for both dev and production**, 
so that **the React app can talk to the MT5 service and Supabase edge functions consistently**. [Source: docs/epics.md#Story-5.5]

## Acceptance Criteria

1. `tnm_concept/.env.local` (gitignored) includes `VITE_MT5_SERVICE_URL`, `VITE_MT5_SERVICE_WS`, `VITE_ENABLE_REALTIME`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` with documented sample values (MT5 prod URL, Supabase project). [Source: docs/epics.md#Story-5.5; docs/PRD-MT5-Integration-Service.md#11.3-Environment-Configuration]
2. Vercel project settings include the same variables for production; documentation lists exact names/values (no secrets committed). [Source: docs/epics.md#Story-5.5]
3. Frontend code references env vars via `import.meta.env` (e.g., `const MT5_URL = import.meta.env.VITE_MT5_SERVICE_URL;`) and build fails if required vars missing. [Source: docs/epics.md#Story-5.5]
4. README/Local Development Guide updated with instructions for generating keys, configuring ngrok/test URLs, and syncing env files across Mac/Windows. [Source: docs/epics.md#Story-5.5; docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md; docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
5. Verification steps include `npm run build` (ensures env exists) and manual GitHub/Vercel inspection screenshot/log for prod envs. [Source: docs/epics.md#Story-5.5]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Local env template
  - [ ] Update `.env.local.example` (if needed) and ensure `.env.local` reference values (MT5 URL, Supabase URL/anon key, realtime flag) are documented.
  - [ ] Mention ngrok override instructions for dev.
- [ ] **Task 2 (AC:2)** – Production env setup
  - [ ] Document Vercel variables (names, sample values) and add checklist for rotating secrets.
  - [ ] Capture evidence (screenshot/log) for Dev Agent record.
- [ ] **Task 3 (AC:3)** – Code usage + safeguards
  - [ ] Audit components/services to pull URLs/keys from `import.meta.env`; remove hardcoded values.
  - [ ] Add build-time checks (e.g., script verifying required vars) or update README to instruct `npm run build` fails when missing.
- [ ] **Task 4 (AC:4)** – Documentation updates
  - [ ] Update README or Local Development Guide with env table and instructions referencing Stories 1.5/1.7.
  - [ ] Note how to sync Mac `.env.local` with Windows `.env` used by MT5 service.
- [ ] **Task 5 (AC:5)** – Verification
  - [ ] Run `npm run build` locally to confirm success.
  - [ ] Provide proof that Vercel env vars exist (screenshot or CLI output) and share location in Dev Notes.

## Dev Notes

- **Dependencies:** Builds on Stories 1.5 (ngrok workflow), 1.7 (backend/env governance), and 4.5 (Supabase deploy); align variable names with backend expectations.
- **Security:** Never commit actual secrets; `.env.local` stays gitignored, `.env.local.example` uses placeholders.
- **Prod parity:** Document different values for staging/prod (MT5 prod URL vs staging). Ensure `VITE_ENABLE_REALTIME` toggles features (e.g., WebSocket from Epic 6 when ready).
- **Verification artifacts:** Store Vercel screenshots/log links in Dev Notes or `docs/deployment-artifacts/`.

### Project Structure Notes

- Env templates: `tnm_concept/.env.local.example` (if created) and README instructions.
- Scripts: consider adding `scripts/check-env.ts` to validate required vars before build.

### References

- [Source: docs/epics.md#Story-5.5]
- [Source: docs/PRD-MT5-Integration-Service.md#11.3-Environment-Configuration]
- [Source: docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: docs/stories/4-5-supabase-edge-function-deployment.context.xml]

## Dev Agent Record

### Context Reference

- docs/stories/5-5-frontend-environment-configuration.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (env templates, docs, scripts)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
