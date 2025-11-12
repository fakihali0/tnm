# Story 2.3: MT5 Data Transformation Layer

Status: ready-for-dev

## Story

As a **backend developer**,
I want **conversion functions that turn MT5-native objects into MT5-agnostic JSON dictionaries**,
so that **our API responses match the PRD schemas and remain consistent even if the MT5 SDK changes**. [Source: docs/epics.md#Story-2.3]

## Acceptance Criteria

1. `app/utils/transformers.py` exposes `transform_account_info`, `transform_position`, `transform_deal`, and `transform_history_to_trades`, returning dictionaries that match the fields specified in the epic/PRD (balance/equity, position metadata, deal details, aggregated trade records). [Source: docs/epics.md#Story-2.3; docs/PRD-MT5-Integration-Service.md#5.2]
2. Timestamps from MT5 (broker time) are converted to UTC ISO 8601 strings (e.g., `"2025-11-12T08:00:00Z"`) using timezone-aware conversions; functions handle None inputs gracefully. [Source: docs/epics.md#Story-2.3; context7:/stub42/pytz]
3. `transform_position` adds `type_str` (“buy”/“sell”) and includes both `open_time` (UTC) and `open_time_broker` (broker timezone). [Source: docs/epics.md#Story-2.3]
4. `transform_deal` normalizes deal type strings, converts timestamps, and prepares data for grouping entry/exit deals. [Source: docs/epics.md#Story-2.3]
5. `transform_history_to_trades` pairs entry/exit deals into trade objects with duration, net profit, and pips (symbol-aware). [Source: docs/epics.md#Story-2.3]
6. Symbol names are standardized (strip broker suffixes) and numeric fields cast to floats; functions return empty structures for None inputs. [Source: docs/epics.md#Story-2.3; docs/PRD-MT5-Integration-Service.md#5.2]
7. Unit tests cover happy-path and edge cases (None input, missing fields, timezone conversions). [Source: docs/epics.md#Story-2.3]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Implement account & position transformers:
  - [ ] Add `transform_account_info(account_info)` converting MT5 AccountInfo to dict with numeric fields cast to float; return None if input is None. [Source: docs/epics.md#Story-2.3]
  - [ ] Add `transform_position(position)` that maps MT5 Position fields, adds `type_str`, and converts open time to UTC ISO plus broker ISO string. [Source: docs/epics.md#Story-2.3]
- [ ] **Task 2 (AC:4,5,6)** – Implement deal & trade aggregation:
  - [ ] Add `transform_deal(deal)` with `type_str`, entry/exit labels, UTC timestamps, and symbol normalization. [Source: docs/epics.md#Story-2.3]
  - [ ] Add `transform_history_to_trades(deals)` that groups related deals into trade records calculating duration, profit, and pips (use symbol-specific decimal logic). [Source: docs/epics.md#Story-2.3; docs/PRD-MT5-Integration-Service.md#5.2]
- [ ] **Task 3 (AC:2,6,7)** – Timezone utilities and tests:
  - [ ] Create helper to convert MT5 timestamps to timezone-aware datetimes (pytz/dateutil) and ISO strings; ensure broker offsets normalize to UTC. [Source: context7:/stub42/pytz]
  - [ ] Write unit tests covering None inputs, timezone conversion, symbol normalization, and grouping logic. [Source: docs/epics.md#Story-2.3]

## Dev Notes

- **Dependencies:** Relies on Story 2.2 raw retrieval outputs; keep transformers isolated (no direct MT5 calls) for unit testing. [Source: docs/stories/2-2-mt5-data-retrieval-functions.md]
- **Timezone handling:** Use timezone-aware conversion (`datetime.fromtimestamp(..., tz=pytz.UTC)` or `astimezone`) to avoid DST issues. [Source: context7:/stub42/pytz]
- **Symbol normalization:** Strip broker suffixes (e.g., `.r`, `_ecn`) via utility to match frontend expectations.
- **Trade grouping:** Entry/exit pairing should handle partial closes and compute pips based on symbol precision (forex vs indices). Document assumptions for future refinement.

### Project Structure Notes

- File: `app/utils/transformers.py` (new or existing). Add unit tests under `tests/` mirroring functions.
- Keep outputs aligned with PRD 5.2 schemas so API layers can directly JSON serialize.

### References

- [Source: docs/epics.md#Story-2.3]
- [Source: docs/PRD-MT5-Integration-Service.md#5.2]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/stub42/pytz]

## Dev Agent Record

### Context Reference

- `docs/stories/2-3-mt5-data-transformation-layer.context.xml`

### Agent Model Used

_To be filled during development._

### Debug Log References

_Document any anomalies in MT5 data structures or timezone conversions._

### Completion Notes List

_Record validation steps (sample transformations, unit test results)._

### File List

_Expected changes: `app/utils/transformers.py`, associated tests._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
