# Story 6.3: WebSocket Connection Testing and Load Testing

Status: ready-for-dev

## Story

As a **backend developer**,
I want **the WebSocket endpoint load-tested under realistic concurrency**, 
so that **we prove it supports 300+ simultaneous MT5 users with acceptable latency**. [Source: docs/epics.md#Story-6.3]

## Acceptance Criteria

1. Load tests simulate 300 concurrent WebSocket clients (each account), connections stay open 5 minutes, heartbeat pings every 30s, using tooling such as `locust`/`websocket-bench`. [Source: docs/epics.md#Story-6.3]
2. Metrics captured: average message latency (<500ms), CPU usage (<70%), memory (<12 GB), zero unexpected drops/errors. [Source: docs/epics.md#Story-6.3; docs/PRD-MT5-Integration-Service.md#Performance]
3. Edge cases: client disconnects abruptly, server restart during active connections, MT5 terminal crash, network latency simulation. [Source: docs/epics.md#Story-6.3]
4. Results documented (charts/logs) and action items recorded for any bottlenecks. [Source: docs/epics.md#Story-6.3]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Test harness setup
  - [ ] Configure `locust` (or alternative) with WebSocket plugin; script connection flow (auth → subscribe → ping/pong).
- [ ] **Task 2 (AC:2)** – Metrics instrumentation
  - [ ] Use psutil/prometheus to capture CPU/memory; instrument latency tracking within test harness.
- [ ] **Task 3 (AC:3)** – Edge case scenarios
  - [ ] Simulate abrupt disconnects, server restarts, MT5 outage, and network delay injection.
- [ ] **Task 4 (AC:4)** – Reporting
  - [ ] Summarize results (charts/logs) in docs; note any scaling recommendations.
- [ ] **Task 5 (AC:5)** – Automation
  - [ ] Add instructions or scripts to rerun tests in staging; optionally integrate with CI pipeline.

## Dev Notes

- **Dependencies:** Requires Stories 6.1 (WebSocket) + 6.2 (hook) implemented in staging; ensure MT5 service accessible.
- **Environment:** Run tests in staging with telemetry (Grafana/Prometheus) enabled.
- **Safety:** Start with smaller load before ramping to 300; monitor for adverse impact.
- **Artifacts:** Store locust scripts/logs under `tests/load/websocket/` and attach Grafana snapshots.

### Project Structure Notes

- Place locust scripts at `tests/load/websocket/locustfile.py`.
- Document procedure in `docs/TESTING.md` or README.

### References

- [Source: docs/epics.md#Story-6.3]
- [Source: docs/PRD-MT5-Integration-Service.md#Performance]
- [Source: docs/stories/6-1-websocket-endpoint-implementation.md]

## Dev Agent Record

### Context Reference

- docs/stories/6-3-websocket-connection-testing-and-load-testing.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (locust scripts, docs)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
