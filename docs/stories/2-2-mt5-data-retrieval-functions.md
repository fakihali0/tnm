# Story 2.2: MT5 Data Retrieval Functions

Status: drafted

## Story

As a **backend developer**,
I want **functions to retrieve account info, open positions, and historical trades from MT5**,
so that **API endpoints can serve real trading data sourced from the terminal**. [Source: docs/epics.md#Story-2.2]

## Acceptance Criteria

1. `app/core/mt5_manager.py` exposes raw retrieval helpers: `get_account_info_raw`, `get_positions_raw`, `get_history_deals_raw(from_dt, to_dt, symbol=None)`, and `get_history_orders_raw(from_dt, to_dt, symbol=None)` that wrap the corresponding MetaTrader5 calls. [Source: docs/epics.md#Story-2.2]
2. Each helper extracts the required fields listed in the epic (balances, position ticket/symbol/volume/etc., deal/order metadata) and returns typed dicts/objects for downstream transformation. [Source: docs/epics.md#Story-2.2]
3. Date parameters accept Python `datetime` objects (timezone-aware) and are converted to MT5-compatible timestamps before invocation; optional symbol filters limit the dataset when provided. [Source: docs/epics.md#Story-2.2; context7:/dateutil/dateutil]
4. All functions handle MT5 errors gracefully: retries unnecessary here but failures must return `None`/empty lists, log `mt5.last_error()` diagnostics, and avoid crashing the service. [Source: docs/epics.md#Story-2.2]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Implement account/position retrieval:
  - [ ] Add `get_account_info_raw` that calls `mt5.account_info()` and extracts balance, equity, margin, free_margin, margin_level, currency, leverage, profit, credit fields into a dict/Pydantic-ready structure. [Source: docs/epics.md#Story-2.2]
  - [ ] Add `get_positions_raw` that calls `mt5.positions_get(symbol=symbol)` when provided and returns a list of dicts containing ticket, symbol, type, volume, prices, sl/tp, profit, swap, commission, magic, comment, and time. [Source: docs/epics.md#Story-2.2]
- [ ] **Task 2 (AC:1,2,3)** – Implement history retrieval utilities:
  - [ ] Add helper to convert Python datetimes to MT5 timestamps (handle timezone via `dateutil` or `datetime.timestamp()`), verifying inputs are timezone-aware to avoid DST drift. [Source: context7:/dateutil/dateutil]
  - [ ] Implement `get_history_deals_raw(from_dt, to_dt, symbol=None)` returning deal metadata (ticket, order, time, type, entry, position_id, volume, price, profit, swap, commission, symbol, comment). [Source: docs/epics.md#Story-2.2]
  - [ ] Implement `get_history_orders_raw(from_dt, to_dt, symbol=None)` returning closed order metadata. [Source: docs/epics.md#Story-2.2]
- [ ] **Task 3 (AC:4)** – Error handling and logging:
  - [ ] Centralize MT5 error logging with helper that records `mt5.last_error()` codes + descriptions and returns `None`/empty list when a call fails. [Source: docs/epics.md#Story-2.2]
  - [ ] Add lightweight validation to ensure connection manager is initialized before fetching; raise/log meaningful errors when not connected. [Source: docs/epics.md#Story-2.2]

## Dev Notes

- **Connection dependency:** These helpers should rely on the `MT5ConnectionManager` from Story 2.1 for lifecycle management; avoid re-initializing MT5 inside data functions. [Source: docs/epics.md#Story-2.2]
- **Datetime handling:** Encourage timezone-aware inputs (UTC recommended) and convert via `datetime.timestamp()` or `dateutil` utilities before calling MT5’s history APIs. [Source: context7:/dateutil/dateutil]
- **Future transformation:** Keep outputs raw but structured (dict/NamedTuple) so later stories can adapt them into domain models without re-calling MT5.

### Project Structure Notes

- File: `app/core/mt5_manager.py` (same as Story 2.1).
- Reuse settings from Story 1.7 for any configurable ranges (default history window, timezone) if needed.

### References

- [Source: docs/epics.md#Story-2.2]
- [Source: docs/PRD-MT5-Integration-Service.md#Success-Criteria]
- [Source: docs/stories/2-1-mt5-connection-manager-with-connection-pooling.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/dateutil/dateutil]

## Dev Agent Record

### Context Reference

<!-- To be filled by story-context workflow -->

### Agent Model Used

_To be recorded during development._

### Debug Log References

_To be provided if MT5 data fetches fail during implementation._

### Completion Notes List

_To capture verification steps (sample responses, log snippets) once implemented._

### File List

_Expected modifications: `app/core/mt5_manager.py`, tests/utilities if added._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
