# Story 1.8: End-to-End Local Network Testing

Status: ready-for-dev

## Story

As a **full-stack developer**,
I want **to verify complete connectivity between the Mac frontend, Supabase, and the Windows MT5 service**,
so that **I know the entire local environment works before starting MT5 core implementation**. [Source: docs/epics.md#Story-1.8]

## Acceptance Criteria

1. All five connectivity tests from the epic (Mac curl → Windows health, browser CORS fetch, `npm run dev`, Python `settings` load, MT5 Terminal init) pass with the documented expected outputs. [Source: docs/epics.md#Story-1.8]
2. Results of each test and the troubleshooting steps are recorded in `docs/LOCAL-DEVELOPMENT-GUIDE.md`, including IP/port references and common failure modes (firewall, CORS, MT5 auth). [Source: docs/epics.md#Story-1.8]
3. Any failures provide clear guidance for remediation so future developers can reproduce the validation checklist without guesswork. [Source: docs/epics.md#Story-1.8]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Execute the five prescribed tests and capture expected outputs:
  - [ ] Run `curl http://vms.tnm.local:8000/health` from the Mac terminal and record the healthy response snippet. [Source: docs/epics.md#Story-1.8]
  - [ ] From the Mac browser console (`http://localhost:5173`), run the `fetch` call and confirm no CORS errors. [Source: docs/epics.md#Story-1.8]
  - [ ] Launch the Vite dev server (`npm run dev`) and ensure it serves on `http://localhost:5173`. [Source: docs/epics.md#Story-1.8]
  - [ ] On Windows, import `settings` from `app.config` and print a value to confirm `.env` loading. [Source: docs/epics.md#Story-1.8]
  - [ ] Verify `MetaTrader5.initialize()` returns `True` to confirm MT5 Terminal readiness. [Source: docs/epics.md#Story-1.8]
- [ ] **Task 2 (AC:2,3)** – Document results and troubleshooting:
  - [ ] Update `docs/LOCAL-DEVELOPMENT-GUIDE.md` with an “End-to-End Validation Checklist” containing the commands, expected outputs, and IP/port references. [Source: docs/epics.md#Story-1.8]
  - [ ] Add troubleshooting guidance for common failures (firewall blocks, wrong IP, CORS misconfiguration, missing env values, MT5 login issues). [Source: docs/epics.md#Story-1.8]
  - [ ] Include a section highlighting when to advance to Epic 2 (all tests green) versus when to revisit earlier stories. [Source: docs/epics.md#Story-1.8]

## Dev Notes

- **Coverage focus:** This story is verification/documentation only; ensure the Local Development Guide shows each command, expected output, and remediation before Epic 2 starts. [Source: docs/epics.md#Story-1.8]
- **Dependencies:** Stories 1.1–1.7 must be complete; if prerequisites (e.g., MT5 install, env files) are missing, note that this validation cannot pass until earlier work is finished. [Source: docs/epics.md#Story-1.8]
- **Previous story continuity:** Story `1-7` remains drafted, so there are no completion learnings to inherit—document this so future stories know validation begins once earlier deliverables move to done. [Source: .bmad-ephemeral/sprint-status.yaml]

### Project Structure Notes

- Use the existing paths in `docs/LOCAL-DEVELOPMENT-GUIDE.md` (`C:\mt5-service`, `~/Desktop/tnm/tnm_concept`) for all commands to keep instructions aligned. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md#Development-Workflow]
- Add the new checklist/troubleshooting sections to the same guide rather than creating new files to maintain a single source of truth. [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md]

### References

- [Source: docs/epics.md#Story-1.8]
- [Source: docs/LOCAL-DEVELOPMENT-GUIDE.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]

## Dev Agent Record

### Context Reference

- `.bmad-ephemeral/stories/1-8-end-to-end-local-network-testing.context.xml`

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be populated if issues occur during testing._

### Completion Notes List

_To be filled out after tests succeed/fail with remediation steps._

### File List

_To be updated post-implementation (likely `docs/LOCAL-DEVELOPMENT-GUIDE.md`)._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
