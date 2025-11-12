# Story 7.1: AES-256 Credential Encryption Implementation

Status: ready-for-dev

## Story

As a **security engineer**,
I want **MT5 account passwords encrypted/decrypted via AES-256 helpers**,
so that **credentials are never stored or transmitted in plain text**. [Source: docs/epics.md#Story-7.1]

## Acceptance Criteria

1. Implement `encrypt_password(plain_password: str, key: bytes) -> str` in `app/core/security.py` using AES-256 (CBC or GCM), random IV (16 bytes), returning base64-encoded `iv + ciphertext`. [Source: docs/epics.md#Story-7.1; docs/PRD-MT5-Integration-Service.md#8.2 Security]
2. Implement `decrypt_password(encrypted_password: str, key: bytes) -> str` that reverses the process, raising descriptive errors if decryption fails. [Source: docs/epics.md#Story-7.1]
3. Key is loaded from `ENCRYPTION_KEY` env var (32 bytes, never logged); helper functions consume it via config module. [Source: docs/epics.md#Story-7.1; docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
4. `account_integrations` stores encrypted passwords only; update relevant code to use new helpers (connect edge function, manual sync, etc.). [Source: docs/epics.md#Story-7.1; docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
5. Unit tests verify encrypt/decrypt roundtrip, invalid key/IV handling, and ensure key never appears in logs. [Source: docs/epics.md#Story-7.1]

## Tasks / Subtasks

- [ ] **Task 1 (AC:1)** – Encryption helper
  - [ ] Implement AES-256 encrypt function using `cryptography` library and random IV.
  - [ ] Return base64 string combining IV + ciphertext.
- [ ] **Task 2 (AC:2)** – Decryption helper
  - [ ] Parse base64 payload, extract IV, decrypt, and raise exceptions on failure.
- [ ] **Task 3 (AC:3)** – Key management
  - [ ] Load `ENCRYPTION_KEY` via config, validate length (32 bytes), never log value.
  - [ ] Document rotation steps.
- [ ] **Task 4 (AC:4)** – Integrate helpers
  - [ ] Update Supabase edge functions (`connect-mt5-account`, sync) and backend storage logic to encrypt before storing / decrypt when needed.
- [ ] **Task 5 (AC:5)** – Testing
  - [ ] Add unit tests for helpers; ensure roundtrip works and invalid payloads raise errors.
  - [ ] Update docs describing how to generate keys (`openssl rand -base64 32`).

## Dev Notes

- **Dependencies:** Requires existing env governance (Story 1.7) and connect/sync flows (Stories 4.1/4.2). Ensure key stored securely (not in repo) and rotated via ops.
- **Library choice:** Use `cryptography` (hazmat primitives) for AES-256; prefer GCM for authenticity if feasible.
- **Logging:** Never log plaintext or keys; log-only high-level events.
- **Error handling:** Provide descriptive errors when decryption fails (bad key, tampering) but avoid leaking sensitive data.

### Project Structure Notes

- Helpers in `app/core/security.py` or `app/utils/crypto.py`.
- Config updates in `app/core/config.py` (load `ENCRYPTION_KEY`).
- Tests under `tests/unit/test_crypto.py`.

### References

- [Source: docs/epics.md#Story-7.1]
- [Source: docs/PRD-MT5-Integration-Service.md#8.2 Security Requirements]
- [Source: docs/stories/1-7-environment-variable-configuration-and-secret-management.md]
- [Source: docs/stories/4-1-update-connect-mt5-account-edge-function.context.xml]
- [Source: docs/stories/4-2-update-sync-trading-data-edge-function.context.xml]

## Dev Agent Record

### Context Reference

- docs/stories/7-1-aes-256-credential-encryption-implementation.context.xml

### Agent Model Used

_To be recorded during implementation._

### Debug Log References

_To be captured during testing._

### Completion Notes List

_To be completed after verification._

### File List

_To be updated when files are created/modified (security helpers, config, tests)._ 

## Change Log

| Date       | Version | Changes                                 | Author |
|------------|---------|-----------------------------------------|--------|
| 2025-11-12 | 1.0     | Draft created via create-story workflow | AF (via Bob) |
