# Story 8.5: Automated Backup and Recovery Procedures

Status: ready-for-dev

## Story

As a **DevOps engineer**,  
I want **automated Supabase, VPS snapshot, and application-data backups with rehearsed recovery drills**,  
so that **we can meet the PRD’s RPO/RTO targets and recover from disasters confidently**. [Source: docs/epics.md#Story-8.5; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]

## Acceptance Criteria

1. Supabase Postgres backups are scheduled at 02:00 UTC daily with 30‑day retention via Supabase dashboard/API. Backups capture schema, data, and RLS policies. Documentation includes how to trigger ad-hoc exports and where Supabase stores snapshots. Monthly restore drills are logged with duration/results. [Source: docs/epics.md#Story-8.5; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
2. Windows VPS snapshots run weekly (Sundays 03:00 UTC) via provider automation (Contabo/Hetzner). Retention = 4 snapshots. Snapshot job IDs, schedules, and verification steps (boot snapshot → smoke test) are captured in the runbook. [Source: docs/epics.md#Story-8.5]
3. Application data backup pipeline runs daily: collects `.env`, configuration, and the past 7 days of logs; compresses/encrypts (AES‑256), and uploads to Supabase Storage or S3-compatible bucket. Secrets for storage keys stay in `.env`. Decryption/replay steps documented. [Source: docs/epics.md#Story-8.5]
4. Recovery procedures specify RPO < 24 h and RTO < 2 h: step-by-step instructions for restoring Supabase, redeploying the MT5 service from snapshot, rehydrating configs/logs, and validating health. Contact list + escalation path included. [Source: docs/epics.md#Story-8.5; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
5. Disaster recovery testing plan: quarterly full restore drill (Supabase + VPS + app data). Each drill logs duration, gaps, and improvements in `docs/operations/dr-playbook.md`, satisfying the epic requirement for lessons-learned updates. [Source: docs/epics.md#Story-8.5]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Supabase backups  
  - [ ] Enable/verify daily backups in Supabase dashboard, confirm retention policy (30 days).  
  - [ ] Document backup IDs, location, and CLI/API commands to trigger exports.  
  - [ ] Schedule monthly restoration dry run in calendar; log results in runbook.
- [ ] **Task 2 (AC:2)** – VPS snapshot automation  
  - [ ] Configure provider cron/panel for weekly snapshots; note job IDs, costs, retention.  
  - [ ] Run manual snapshot + restore test (boot new instance) and record verification checklist.  
  - [ ] Update `docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md` with snapshot SOP.
- [ ] **Task 3 (AC:3)** – Application data backups  
  - [ ] Script (PowerShell/Python) to tar `.env`, configs, and last 7 days of logs; encrypt with AES‑256 (use Story 7.1 key).  
  - [ ] Upload to Supabase Storage or S3 bucket; ensure bucket lifecycle deletes >30 days.  
  - [ ] Document restore script (decrypt + place files) and store checksum logs.
- [ ] **Task 4 (AC:4)** – Recovery documentation  
  - [ ] Author `docs/operations/dr-playbook.md` detailing RPO/RTO targets, steps to restore DB, VPS, app data, and health validation.  
  - [ ] Include escalation contacts (DevOps lead, vendor support) and maintenance window guidance.  
  - [ ] Align with Story 8.2 status page to communicate incidents.
- [ ] **Task 5 (AC:5)** – DR drill + evidence  
  - [ ] Plan quarterly drill; run first rehearsal (even partial) and record timings in the playbook.  
  - [ ] Capture screenshots/logs proving backup jobs executed successfully (Supabase dashboard, provider snapshot list).  
  - [ ] Add references to Dev Agent Debug Log for traceability.

## Dev Notes

- **Dependencies:** Relies on Story 7.1 (encryption key management) for securing backup archives, Story 1.6 (Windows service) for consistent process control, and Story 4.3 (DB schema) to ensure backups include new tables.  
- **Security:** Do not store secrets in plaintext runbooks—obfuscate or point to secure vault locations.  
- **Tooling:** Supabase CLI can export DB; Windows Task Scheduler/PowerShell handles file backups; provider API/CLI automates snapshots.  
- **Previous story learnings:** None yet from Epic 8, so no completion notes to incorporate.

### Project Structure Notes

- Create/update `docs/operations/dr-playbook.md` and link from README/LOCAL-DEVELOPMENT-GUIDE.  
- Backup scripts can live under `scripts/backup/` with documentation in `docs/operations`.  
- Maintain evidence (screenshots, logs) under `docs/operations/evidence/` to support audits.

### References

- [Source: docs/epics.md#Story-8.5]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Dev Agent Record

### Context Reference

- docs/stories/8-5-automated-backup-and-recovery-procedures.context.xml

### Agent Model Used

_To be noted during implementation._

### Debug Log References

_Record backup job outputs, DR drill logs, and Supabase dashboard screenshots._

### Completion Notes List

_Summarize automation scripts, retention policies, and drill outcomes after delivery._

### File List

_Track added/modified files: `scripts/backup/*.ps1`, `docs/operations/dr-playbook.md`, Supabase CLI configs, provider snapshot SOPs._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
