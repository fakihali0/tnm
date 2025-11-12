# Story 1.7: Environment Variable Configuration and Secret Management

Status: drafted

## Story

As a **backend developer**,
I want **all MT5 service configuration and secrets managed through environment files**,
so that **sensitive data stays out of version control and both backend and frontend load consistent settings**. [Source: docs/epics.md#Story-1.7]

## Acceptance Criteria

1. `.env.example` lists every required backend variable (service config, auth keys, Supabase URL/service role key, MT5 pool settings, optional Redis URL, AES-256 encryption key, and CORS origins) using the exact structure in the epic while keeping placeholders for secrets. [Source: docs/epics.md#Story-1.7]
2. `.env` (gitignored) contains concrete local-development values, including generated API/JWT/encryption keys (`openssl rand -base64 32`) and local MT5 connection defaults, matching the example layout. [Source: docs/epics.md#Story-1.7]
3. `config.py` loads variables via `pydantic-settings` (not python-dotenv), validates mandatory values, and fails service startup with a descriptive error when any required field is missing. [Source: docs/epics.md#Story-1.7; docs/PRD-MT5-Integration-Service.md#Security]
4. `.gitignore` keeps `.env` (and other secret-bearing files) excluded while documenting `.env.example` as the committed template. [Source: repo .gitignore]
5. `tnm_concept/.env.local` contains the Mac frontend values (`VITE_MT5_SERVICE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) so the React app can call the Windows service and Supabase during local testing. [Source: docs/epics.md#Story-1.7; docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2,4)** – Author backend environment templates
  - [ ] Update/create `C:\mt5-service\.env.example` with the full variable list, placeholder values, and inline comments referencing key generation commands. [Source: docs/epics.md#Story-1.7]
  - [ ] Produce a sample `.env` (untracked) for local dev documentation, including guidance on generating secure strings via `openssl rand -base64 32`. [Source: docs/epics.md#Story-1.7]
  - [ ] Confirm `.gitignore` already excludes `.env`/`*.env` and add clarifying comments if needed. [Source: repo .gitignore]
- [ ] **Task 2 (AC:3)** – Enforce typed config loading in `config.py`
  - [ ] Implement a `Settings` class using `pydantic-settings` (`BaseSettings`) with strict field types and default values where appropriate. [Source: docs/epics.md#Story-1.7]
  - [ ] Ensure application startup imports the settings object and raises a descriptive error/log entry if required values are missing. [Source: docs/PRD-MT5-Integration-Service.md#Security]
  - [ ] Document how developers regenerate secrets and restart the service when validation fails. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
- [ ] **Task 3 (AC:5)** – Align frontend `.env.local`
  - [ ] Document required entries in `tnm_concept/.env.local` (`VITE_MT5_SERVICE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and ensure CORS origins reference `http://localhost:5173`. [Source: docs/epics.md#Story-1.7]
  - [ ] Update the Local Development Guide to remind developers to sync Mac/frontend env values with the Windows service IP. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]

## Dev Notes

- **Runtime boundary:** Backend env files live under `C:\mt5-service` (Windows host) while frontend envs belong in `tnm_concept/.env.local` on the Mac; keep instructions explicit so values don’t leak across repos. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- **Security posture:** Service credentials must never be committed—`pydantic-settings` validation helps enforce this by halting boot with clear error messages, satisfying the PRD’s “fail fast on missing secrets” requirement. [Source: docs/PRD-MT5-Integration-Service.md#Security]
- **BaseSettings configuration:** Follow the official `pydantic-settings` guidance for `model_config` (e.g., `env_file`, `env_prefix`) and field aliases so settings automatically pull from `.env`. [Source: context7:/pydantic/pydantic-settings]
- **Key generation guidance:** Include `openssl rand -base64 32` snippets in documentation for JWT/encryption keys and remind developers to rotate production secrets separately from local values. [Source: docs/epics.md#Story-1.7]
- **CORS + frontend alignment:** Ensure CORS origins and `VITE_MT5_SERVICE_URL` reference the Windows LAN IP (`http://vms.tnm.local:8000`) so the Mac-based frontend can communicate without browser errors. [Source: docs/epics.md#Story-1.7]

### Learnings from Previous Story

- Story `1-6-manual-service-startup-local-development` remains in `drafted`, so there are no completion notes, new files, or review findings to inherit yet. Treat this story as the first implementation-ready configuration deliverable for Epic 1. [Source: .bmad-ephemeral/sprint-status.yaml]

### Project Structure Notes

- `.env`/`.env.example` remain beside the FastAPI code under `C:\mt5-service`; document their purpose inside the repo README or Local Development Guide to maintain discoverability. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- Frontend `.env.local` lives in `tnm_concept/` and mirrors the Vite convention already described in earlier stories; reinforce the separation to avoid cross-environment confusion. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]

### References

- [Source: docs/epics.md#Story-1.7]
- [Source: docs/PRD-MT5-Integration-Service.md#Security]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- [Source: repo/.gitignore]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/pydantic/pydantic-settings]

## Dev Agent Record

### Context Reference

<!-- Story context XML will be added once story-context workflow runs -->

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be populated if issues arise during implementation._

### Completion Notes List

_To be filled out by the dev agent when work completes (e.g., keys generated, validation tested)._ 

### File List

_To be updated post-implementation indicating NEW/MODIFIED/DELETED files._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
