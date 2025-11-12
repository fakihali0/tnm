# Story 1.6: Manual Service Startup (Local Development)

Status: ready-for-dev

## Story

As a **backend developer**,
I want **a simple way to start and stop the FastAPI MT5 service manually during development**,
so that **I can control restarts, view logs, and debug locally before investing in VPS automation**. [Source: docs/epics.md#Story-1.6]

## Acceptance Criteria

1. The FastAPI service can be launched manually from `C:\mt5-service` by activating the virtual environment and running either `python run.py` or `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`, matching the workflow promised in the epic. [Source: docs/epics.md#Story-1.6]
2. The manual start procedure surfaces streaming logs in the same PowerShell session and shuts down cleanly when the developer issues `Ctrl+C`, ensuring predictable debugging cycles. [Source: docs/epics.md#Story-1.6]
3. A reusable PowerShell helper `start-dev.ps1` exists in `C:\mt5-service`, activates the venv, prints the service URL, and runs Uvicorn with reload enabled for rapid iteration. [Source: docs/epics.md#Story-1.6; docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
4. Local documentation explains how to start, stop, view logs, and troubleshoot the manual workflow, and calls out that NSSM/VPS automation belongs to later deployment stories. [Source: docs/epics.md#Story-1.6; docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow; docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Author definitive manual command steps in the Local Development Guide:
  - [ ] Add PowerShell snippets for activating the venv, running `python run.py`, and running `uvicorn ... --reload`, plus log-watching and `Ctrl+C` shutdown notes. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
  - [ ] Expand troubleshooting tips (missing venv, port conflicts, permissions) so developers can recover quickly when the manual start fails. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
- [ ] **Task 2 (AC:3)** – Implement the `start-dev.ps1` helper:
  - [ ] Create the script in `C:\mt5-service` that activates the virtual environment, prints a "Starting MT5 Service on http://vms.tnm.local:8000" banner, and starts Uvicorn with `--reload`. [Source: docs/epics.md#Story-1.6]
  - [ ] Document script usage (prerequisites, how to stop, how logs appear) in the Local Development Guide’s Daily Workflow and Quick Reference sections. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
- [ ] **Task 3 (AC:4)** – Align documentation with future deployment expectations:
  - [ ] Update local docs to reference `start-dev.ps1`, describe log tail options (console + `Get-Content logs\app.log -Tail 50 -Wait`), and restate that manual control precedes NSSM automation. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
  - [ ] Add a short “Next step” note pointing to the Windows Deployment Guide section that covers NSSM so readers understand this story deliberately stops before service registration. [Source: docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md]

## Dev Notes

- **Runtime pattern:** The service must continue running under a developer-controlled PowerShell session so logs stream inline; this reinforces the fast feedback loop described in the Local Development Guide before formalizing any Windows Service. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- **Helper script contract:** The `start-dev.ps1` snippet referenced throughout the guide needs to be real—activate the venv (`.\venv\Scripts\activate`), echo the URL, then launch Uvicorn with reload so file changes immediately restart the service. [Source: docs/epics.md#Story-1.6]
- **Shutdown & troubleshooting:** Document clear `Ctrl+C` shutdown steps plus log inspection commands (console + `Get-Content logs\app.log -Tail 50 -Wait`) to help devs gather evidence when the service fails prior to NSSM automation. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
- **Deployment boundary:** Call out that NSSM-based Windows Service registration belongs to the VPS phase in the Windows Deployment Guide, so keep this story scoped to manual control and ensure the docs set expectations accordingly. [Source: docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md]

### Learnings from Previous Story

Story `1-5-ngrok-tunnel-for-supabase-edge-function-testing` is still in `ready-for-dev`, so there are no completed learnings or review findings to inherit yet. Note in Dev Notes that this is effectively the first implemented story after the manual setup track. [Source: .bmad-ephemeral/sprint-status.yaml]

### Project Structure Notes

- Scripts and runtime assets should continue to live inside `C:\mt5-service` alongside the virtual environment, aligning with the Local Development Guide’s assumptions and minimizing path drift for future stories. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- When documenting log monitoring, reference the optional `logs/app.log` tail workflow already present in the guide so developers know where persistent logs live versus console output. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]

### References

- [Source: docs/epics.md#Story-1.6]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Quick-Reference]
- [Source: docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]

## Dev Agent Record

### Context Reference

- `.bmad-ephemeral/stories/1-6-manual-service-startup-local-development.context.xml`

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be populated during implementation._

### Completion Notes List

_To be filled out by the dev agent when the story is delivered._

### File List

_To be completed post-implementation (NEW/MODIFIED/DELETED entries)._ 

## Change Log

| Date       | Version | Changes                                    | Author |
|------------|---------|--------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story   | AF (via BMad Master) |
