# Story 2.5: MT5 Connection Manager Unit Tests

Status: ready-for-dev

## Story

As a **backend developer**,
I want **comprehensive pytest coverage for MT5 connection, data retrieval, and transformation layers**,
so that **regressions are caught early and the MT5 stack can evolve safely**. [Source: docs/epics.md#Story-2.5]

## Acceptance Criteria

1. `tests/test_mt5_manager.py` (and related files) include unit tests covering the scenarios listed in the epic: initialization/login success, failure paths, retry/backoff, pooling limits, idle timeout cleanup, data retrieval success/empty/error, transformation outputs, timezone conversion, and None handling. [Source: docs/epics.md#Story-2.5]
2. MT5 SDK calls are mocked (no live terminal) using `monkeypatch`/fixtures per pytest best practices. [Source: docs/epics.md#Story-2.5; context7:/pytest-dev/pytest]
3. Coverage for `app/core/mt5_manager.py` exceeds 85% (config via pytest-cov or coverage.py) and test suite runs via `pytest`. [Source: docs/epics.md#Story-2.5]
4. Tests validate exponential backoff timing, connection state transitions, and circuit-breaker behavior introduced in Story 2.4. [Source: docs/stories/2-4-connection-state-management-and-error-handling.md]
5. Transformation tests confirm JSON output matches PRD 5.2 schema expectations (fields present, UTC timestamps, symbol normalization). [Source: docs/PRD-MT5-Integration-Service.md#5.2; docs/stories/2-3-mt5-data-transformation-layer.md]
6. CI-ready command documented (`pytest --maxfail=1 --disable-warnings -q` or similar) and integrated into project README/build notes.

## Tasks / Subtasks

- [ ] **Task 1 (AC:1,2)** – Test scaffolding & fixtures:
  - [ ] Create pytest fixtures for mocked MT5 responses (account info, positions, deals) using `monkeypatch` to intercept `MetaTrader5` functions. [Source: context7:/pytest-dev/pytest]
  - [ ] Add helper factories for fake MT5 objects to keep tests readable.
- [ ] **Task 2 (AC:1,3,4)** – Connection manager tests:
  - [ ] Write tests covering initialize/login success, failure, invalid credentials, pooling enforcement, idle timeout, retry/backoff, and circuit-breaker state transitions. [Source: docs/epics.md#Story-2.5; docs/stories/2-4-connection-state-management-and-error-handling.md]
  - [ ] Assert state enum values and log outputs when possible (use caplog fixture).
- [ ] **Task 3 (AC:1,5)** – Data retrieval + transformation tests:
  - [ ] Validate account/position/history functions return expected dicts for populated data, empty responses, and MT5 errors. [Source: docs/stories/2-2-mt5-data-retrieval-functions.md]
  - [ ] Cover transformation utilities (account, position, deal, history-to-trades), including timezone conversion to UTC and None handling. [Source: docs/stories/2-3-mt5-data-transformation-layer.md; docs/PRD-MT5-Integration-Service.md#5.2]
- [ ] **Task 4 (AC:3,6)** – Coverage & CI wiring:
  - [ ] Configure pytest/coverage (e.g., `pytest --cov=app/core/mt5_manager.py --cov=app/utils/transformers.py`) ensuring >85% coverage for the manager module.
  - [ ] Document test commands in README or CONTRIBUTING and ensure tooling integrates with existing CI scripts.

## Dev Notes

- **Mocking strategy:** Use pytest monkeypatch fixtures to stub MetaTrader5 module APIs; centralize mocks to avoid copy/paste. [Source: context7:/pytest-dev/pytest]
- **Async/backoff testing:** Inject fake sleep/backoff functions so tests run fast; verify delays by inspecting call order rather than sleeping real time.
- **Stateful tests:** Reset connection manager between tests to avoid shared state; consider fixture-scoped instances.
- **Schema alignment:** Reuse sample payloads from PRD 5.2 when asserting output shape.

### Project Structure Notes

- Tests live under `tests/` (e.g., `tests/test_mt5_manager.py`, `tests/test_mt5_transformers.py`).
- Ensure test modules import from `app.core` / `app.utils` using the same path aliasing as the app (`@` alias corresponds to `src` in tsconfig but Python likely uses relative imports).

### References

- [Source: docs/epics.md#Story-2.5]
- [Source: docs/PRD-MT5-Integration-Service.md#5.5]
- [Source: docs/stories/2-1-mt5-connection-manager-with-connection-pooling.md]
- [Source: docs/stories/2-2-mt5-data-retrieval-functions.md]
- [Source: docs/stories/2-3-mt5-data-transformation-layer.md]
- [Source: docs/stories/2-4-connection-state-management-and-error-handling.md]
- [Source: .bmad-ephemeral/sprint-status.yaml]
- [Source: context7:/pytest-dev/pytest]

## Dev Agent Record

### Context Reference

- `docs/stories/2-5-mt5-connection-manager-unit-tests.context.xml`

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_Note flaky tests or environment-specific issues if they arise._

### Completion Notes List

_Summarize coverage report, CI command output, and key assertions validated._

### File List

_Expected: `tests/test_mt5_manager.py`, `tests/test_mt5_transformers.py`, coverage config/README updates._

## Change Log

| Date       | Version | Changes                                  | Author |
|------------|---------|------------------------------------------|--------|
| 2025-11-12 | 1.0     | Initial draft generated via create-story | AF (via BMad Master) |
