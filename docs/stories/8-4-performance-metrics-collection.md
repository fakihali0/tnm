# Story 8.4: Performance Metrics Collection

Status: ready-for-dev

## Story

As a **backend developer**,  
I want **Prometheus-format metrics collected from the MT5 FastAPI service and exposed at `/metrics`**,  
so that **operations can monitor latency, MT5 pool health, and system pressure per the PRD observability plan**. [Source: docs/epics.md#Story-8.4; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Acceptance Criteria

1. `app/core/metrics.py` wires `prometheus-fastapi-instrumentator` (or equivalent) and registers middleware so HTTP requests automatically emit counters, histograms (with configurable buckets), and status code labels. Metrics include total/endpoint counts, duration histograms (avg/p50/p95/p99 derived), and active connections, matching the epic’s request metrics list. [Source: docs/epics.md#Story-8.4; context7:/trallnag/prometheus-fastapi-instrumentator]
2. Custom Prometheus collectors cover MT5-specific metrics: connection pool size (gauge), login success/failure counters, API call durations per MT5 method, and MT5 error counts by type. Metrics tap into the existing MT5 manager/service layer so values stay accurate without tight coupling. [Source: docs/epics.md#Story-8.4]
3. System metrics (CPU %, memory MB, disk free GB, active threads) are gathered via a lightweight sampler (e.g., `psutil`) and exported as gauges. Sampling interval and overhead are documented to keep CPU impact <1%, satisfying the epic requirement. [Source: docs/epics.md#Story-8.4; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
4. `/metrics` endpoint exposes Prometheus text format without authentication (per scraping needs) but is rate-limited to prevent abuse, and documentation notes that only trusted networks should reach it (Nginx IP allowlist). Endpoint reuses the instrumentator’s handler and returns the header/body illustrated in the epic. [Source: docs/epics.md#Story-8.4; docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]
5. Verification: pytest (or equivalent) ensures metrics render correctly and custom gauges update when MT5 operations run; manual QA captures `curl /metrics` output plus Prometheus scrape/recording rules for integration. Dev Agent Debug Log lists evidence, and docs/operations/monitoring.md explains how Grafana dashboards (Phase 2) will consume these metrics. [Source: docs/epics.md#Story-8.4; docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Instrument FastAPI automatically  
  - [ ] Add `prometheus-fastapi-instrumentator` dependency and create `Instrumentator().instrument(app)` in `app/main.py`.  
  - [ ] Configure histogram buckets suitable for MT5 latency (e.g., 0.1, 0.5, 1, 2, 5 seconds) and label normalizers to avoid high-cardinality paths.  
  - [ ] Ensure middleware logs minimal overhead and respects Story 8.1 structured logging conventions.
- [ ] **Task 2 (AC:2)** – MT5 custom metrics  
  - [ ] In `app/core/metrics.py`, define gauges/counters for pool size, login outcomes, API call durations, MT5 errors.  
  - [ ] Update MT5 manager/service to increment metrics at the appropriate touchpoints (e.g., login, API call wrapper).  
  - [ ] Document naming conventions (`mt5_*`) for clarity.
- [ ] **Task 3 (AC:3)** – System sampler  
  - [ ] Implement a background task (async loop or scheduler) that samples CPU/memory/disk/thread count every 15 seconds and updates Prometheus gauges.  
  - [ ] Use `psutil` (or built-in resource modules if preferred) and ensure exceptions don’t break the sampler.  
  - [ ] Expose configuration for sampling interval via `.env`.
- [ ] **Task 4 (AC:4)** – `/metrics` endpoint + hardening  
  - [ ] Mount the instrumentator’s `/metrics` route (no auth) but add guidance to Nginx config for IP allowlists/rate limits.  
  - [ ] Update docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md and docs/NETWORK-CONFIG.md to mention the new endpoint and firewall expectations.  
  - [ ] Confirm endpoint returns the example Prometheus output snippet from the epic.
- [ ] **Task 5 (AC:5)** – Testing & docs  
  - [ ] Add pytest covering metrics registry output, including custom MT5 gauges.  
  - [ ] Provide manual QA steps (`ab`/`hey` load, `curl /metrics`, Prometheus scrape config snippet) plus evidence stored in Dev Agent Debug Log.  
  - [ ] Update/author `docs/operations/monitoring.md` to describe Prometheus scrape job and Grafana dashboard placeholders.

## Dev Notes

- **Library guidance:** `prometheus-fastapi-instrumentator` provides decorators and label transformers; follow context7 instructions for `Instrumentator().instrument(app)` and curl verification. [Source: context7:/trallnag/prometheus-fastapi-instrumentator]  
- **Security:** While `/metrics` stays unauthenticated for Prometheus, restrict access via Nginx/IP allowlists and document scraping credentials.  
- **Dependency alignment:** Sampling + metrics rely on structured logging from Story 8.1 and may feed Grafana dashboards once Story 8.2 (status) and later observability work complete.  
- **Previous story learnings:** Story 8.3 is newly drafted—no implementation notes to import yet.

### Project Structure Notes

- New module: `mt5-service/app/core/metrics.py`; initialization in `app/main.py`.  
- System sampler/background task can reside in `app/core/background.py` or similar; ensure it starts with the app.  
- Documentation additions under `docs/operations/monitoring.md` and updates to existing network/deployment guides for `/metrics`.

### References

- [Source: docs/epics.md#Story-8.4]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.3-Reliability-&-Availability-Requirements]  
- [Source: docs/PRD-MT5-Integration-Service.md#8.4-Operational-Requirements]  
- [Source: context7:/trallnag/prometheus-fastapi-instrumentator]

## Dev Agent Record

### Context Reference

- docs/stories/8-4-performance-metrics-collection.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Add curl/Prometheus scrape evidence after verification._

### Completion Notes List

_Document sampler interval, MT5 metric wiring, and Prometheus job configuration after delivery._

### File List

_Track files such as `app/core/metrics.py`, `app/main.py`, `app/core/mt5_manager.py`, `tests/test_metrics.py`, `docs/operations/monitoring.md`, `docs/technical/WINDOWS-DEPLOYMENT-GUIDE.md`, `docs/NETWORK-CONFIG.md`._

## Change Log

| Date       | Version | Changes                                 | Author         |
|------------|---------|-----------------------------------------|----------------|
| 2025-11-13 | 1.0     | Draft created via create-story workflow | Bob (Scrum SM) |
