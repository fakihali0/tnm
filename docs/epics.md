# TNM AI - MT5 Integration Service - Epic Breakdown

**Author:** AF  
**Date:** November 12, 2025  
**Project Level:** Medium-High Complexity  
**Target Scale:** 200-300 concurrent users at $16-32/month operational cost  

---

## Overview

This document provides the complete epic and story breakdown for the **MT5 Integration Service**, decomposing requirements from the [PRD](./PRD-MT5-Integration-Service.md) into implementable, bite-sized stories optimized for autonomous development agents.

### Product Magic ✨

> "A cost-effective, self-hosted bridge that transforms traders' MT5 data into instant AI-powered insights, at 1/25th the cost of commercial alternatives"

### Project Context

TNM AI requires a self-hosted MT5 integration service to replace the discontinued MetaAPI integration. The service will:
- Enable 200-300 traders to connect MT5 accounts
- Provide real-time data synchronization
- Deliver AI-powered trading insights and risk monitoring
- Maintain cost efficiency ($16-32/month vs $800/month with MetaAPI)
- Ensure full data privacy and control

### Epic Structure Rationale

The 8 epics are organized to enable **incremental value delivery** with **minimal forward dependencies**:

1. **Epic 1: Foundation & Infrastructure** - Establishes the base (VPS, MT5, Python service scaffolding)
2. **Epic 2: MT5 Service Core** - Builds connection management and MT5 integration logic
3. **Epic 3: REST API Implementation** - Delivers 6 essential API endpoints
4. **Epic 4: Supabase Integration** - Connects backend data persistence layer
5. **Epic 5: Frontend MT5 Integration** - Re-enables user-facing features
6. **Epic 6: Real-time WebSocket (Phase 2)** - Adds advanced real-time capabilities
7. **Epic 7: Security & Compliance** - Hardens security and meets regulatory requirements
8. **Epic 8: Monitoring & Operations** - Ensures production readiness and observability

**MVP Scope (Weeks 1-4):** Epics 1-5 + partial Epic 7 (core security)  
**Growth Scope (Weeks 5-8):** Epic 6 + Epic 8  
**Vision Scope (Future):** Multi-region deployment, enterprise features

---

## Epic 1: Foundation & Infrastructure (Local Development)

**Epic Goal:** Set up local Windows development environment with MT5 Terminal, Python service structure, and network configuration to enable rapid testing and iteration before VPS deployment.

**Business Value:** Local development eliminates VPS costs during development ($0 vs €15-25/month), enables faster debugging, and reduces risk by validating everything before production deployment. VPS migration happens only after local validation (Phase 2).

---

### Story 1.1: Local Windows Machine Setup and Network Configuration

As a **backend developer**,  
I want **my local Windows computer configured for MT5 service development with network access from my Mac**,  
So that **I can test the full integration locally before spending money on VPS hosting**.

**Acceptance Criteria:**

**Given** I have a Windows 10/11 computer on my local network  
**When** I configure it for development  
**Then** the Windows machine is updated to latest version

**And** Static local IP address is assigned (10.4.0.180) and mapped to hostname (vms.tnm.local)
  - Document this IP address for all future configuration
**And** PowerShell execution policy is set to allow script execution:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
**And** Windows Defender firewall rule allows inbound traffic on port 8000:
  ```powershell
  New-NetFirewallRule -DisplayName "MT5 FastAPI Local Dev" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
  ```
**And** Chocolatey package manager is installed:
  ```powershell
  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  ```
**And** Connectivity test from Mac succeeds:
  ```bash
  # From Mac terminal
  ping vms.tnm.local
  # Should receive responses
  ```
**And** Remote Desktop (RDP) is optionally enabled for easier access from Mac

**Prerequisites:** None (first story)

**Technical Notes:**
- **Cost:** $0 (using existing hardware)
- **Network:** Both Mac and Windows must be on same Wi-Fi/Ethernet network
- **Static IP setup:** Windows Settings → Network & Internet → Properties → IP assignment → Manual
- **Router consideration:** Assign static IP via router DHCP reservation for stability
- **Security:** Firewall rule is local network only - safe for development
- Reference: Modified from WINDOWS-DEPLOYMENT-GUIDE.md for local dev
- **Future migration:** Same setup applies to VPS later, just with public IP

---

### Story 1.2: MT5 Terminal Installation and Headless Configuration

As a **backend developer**,  
I want **MetaTrader 5 Terminal installed and configured for headless operation**,  
So that **the Python service can connect to MT5 without requiring a GUI**.

**Acceptance Criteria:**

**Given** the Windows VPS is provisioned and accessible  
**When** I download and install MT5 Terminal from the official MetaQuotes website  
**Then** MT5 Terminal is installed in `C:\Program Files\MetaTrader 5\`

**And** MT5 is configured to run in headless mode (no GUI required)  
**And** MT5 Terminal can be started via command line  
**And** MT5 Terminal auto-starts on system boot (optional for this story, required later)  
**And** Test connection to at least one broker server (e.g., MetaQuotes-Demo) is successful

**Prerequisites:** Story 1.1 (VPS provisioned)

**Technical Notes:**
- Download URL: https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe
- Headless mode: Use `/portable` flag or configure via terminal64.exe
- Test account: Create demo account on MetaQuotes-Demo server for validation
- Reference: WINDOWS-DEPLOYMENT-GUIDE.md Section 2

---

### Story 1.3: Python Environment and Dependency Setup

As a **backend developer**,  
I want **Python 3.11+ installed with a virtual environment and all required dependencies**,  
So that **I can run the FastAPI service with MT5 integration**.

**Acceptance Criteria:**

**Given** the Windows VPS has MT5 Terminal installed  
**When** I install Python 3.11+ via Chocolatey  
**Then** Python is accessible via command line (`python --version` returns 3.11+)

**And** A Python virtual environment is created at `C:\mt5-service\venv\`  
**And** The following packages are installed in the virtual environment:
- `fastapi` (latest)
- `uvicorn[standard]` (ASGI server)
- `MetaTrader5` (v5.0.45+)
- `cryptography` (for AES-256 encryption)
- `python-jose[cryptography]` (for JWT)
- `httpx` (for HTTP client)
- `pydantic` (for data validation)
- `python-dotenv` (for environment variables)

**And** Virtual environment activation script works: `C:\mt5-service\venv\Scripts\activate`

**Prerequisites:** Story 1.1 (VPS provisioned)

**Technical Notes:**
- Install via Chocolatey: `choco install python311 -y`
- Create venv: `python -m venv C:\mt5-service\venv`
- Install deps: `pip install -r requirements.txt`
- Requirements file should be committed to repo

---

### Story 1.4: FastAPI Service Project Structure Scaffolding

As a **backend developer**,  
I want **a well-organized FastAPI project structure with placeholder files**,  
So that **subsequent stories can add features to a standardized codebase**.

**Acceptance Criteria:**

**Given** Python environment is set up with dependencies  
**When** I create the project directory structure  
**Then** the following folders and files exist:

```
C:\mt5-service\
├── venv\                  (virtual environment)
├── app\
│   ├── __init__.py
│   ├── main.py           (FastAPI app entry point)
│   ├── config.py         (environment configuration)
│   ├── models\
│   │   └── __init__.py   (Pydantic models)
│   ├── api\
│   │   ├── __init__.py
│   │   └── routes\
│   │       └── __init__.py
│   ├── core\
│   │   ├── __init__.py
│   │   ├── mt5_manager.py     (MT5 connection manager - placeholder)
│   │   ├── security.py        (encryption/auth - placeholder)
│   │   └── logger.py          (logging setup)
│   └── utils\
│       └── __init__.py
├── tests\
│   └── __init__.py
├── .env.example          (environment variable template)
├── .env                  (actual secrets - gitignored)
├── requirements.txt      (Python dependencies)
├── README.md             (service documentation)
└── run.py                (service entry point)
```

**And** `main.py` contains a minimal FastAPI app with:
  - `/health` endpoint returning `{"status": "ok"}`
  - **CORS middleware configured** for local development (critical!):
    ```python
    from fastapi.middleware.cors import CORSMiddleware
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    ```
**And** The service can be started via `python run.py` and responds to `GET /health`  
**And** `config.py` loads environment variables from `.env` file using `pydantic-settings`  
**And** CORS test from Mac browser succeeds:
  ```bash
  # From Mac - should not get CORS error
  curl http://192.168.1.100:8000/health
  ```

**Prerequisites:** Story 1.3 (Python environment ready)

**Technical Notes:**
- Use FastAPI best practices for project structure
- **CORS is critical:** Frontend on Mac (localhost:5173) calling Windows service (192.168.1.100:8000)
- Reference: FastAPI CORS documentation (via context7 MCP)
- Health endpoint is essential for future monitoring
- Logger should use structured JSON logging
- For production: Update `allow_origins` to include production frontend URL

---

### Story 1.5: ngrok Tunnel for Supabase Edge Function Testing (Optional)

As a **backend developer**,  
I want **a public URL tunnel to my local Windows service**,  
So that **Supabase edge functions (running on cloud) can call my local development service for testing**.

**Acceptance Criteria:**

**Given** the FastAPI service is running on `http://192.168.1.100:8000`  
**When** I need to test Supabase edge functions that call the MT5 service  
**Then** I install ngrok (free account sufficient for development):
  ```bash
  # On Mac or Windows
  brew install ngrok  # Mac
  choco install ngrok # Windows
  ```

**And** I create an ngrok tunnel to the local service:
  ```bash
  ngrok http 192.168.1.100:8000
  # Returns: https://abc123.ngrok.io → forwards to local service
  ```

**And** Supabase edge functions are configured with ngrok URL:
  ```typescript
  // In edge function
  const MT5_SERVICE_URL = Deno.env.get('MT5_SERVICE_URL') || 'https://abc123.ngrok.io';
  ```

**And** Edge function successfully calls local service through tunnel  
**And** ngrok dashboard shows request logs for debugging

**Alternative:** Skip ngrok and mock edge function responses during local frontend testing

**Prerequisites:** Story 1.4 (FastAPI service running)

**Technical Notes:**
- **ngrok free tier:** Sufficient for development (rate limits apply)
- **Tunnel expires:** Free ngrok URLs change on restart (get new URL each time)
- **Paid ngrok:** $8/month for static domain (optional)
- **Alternative:** Use Cloudflare Tunnel (free, more stable)
- **For production:** This story is skipped - real VPS with public IP used
- **Security:** Only use for development - never expose production credentials
- Reference: https://ngrok.com/docs
- **When to use:** Only when testing full Supabase integration locally

---

### Story 1.6: Manual Service Startup (Local Development)

As a **backend developer**,  
I want **a simple way to start/stop the FastAPI service manually during development**,  
So that **I have full control and can easily restart for debugging**.

**Acceptance Criteria:**

**Given** the FastAPI service code is ready  
**When** I want to start the service for development  
**Then** I run the service manually via PowerShell:
  ```powershell
  cd C:\mt5-service
  .\venv\Scripts\activate
  python run.py
  # Or using uvicorn directly:
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

**And** The `--reload` flag enables auto-restart on code changes (development only!)  
**And** Service logs display in the terminal for real-time debugging  
**And** Service stops gracefully with `Ctrl+C`

**And** A startup script `start-dev.ps1` exists for convenience:
  ```powershell
  # start-dev.ps1
  .\venv\Scripts\activate
  Write-Host "Starting MT5 Service on http://192.168.1.100:8000" -ForegroundColor Green
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

**And** Documentation includes:
  - How to start service
  - How to view logs
  - How to stop service
  - Common troubleshooting steps

**Optional (Phase 2 - VPS Deployment):**  
For production VPS deployment, use NSSM (Non-Sucking Service Manager) to create a Windows Service that auto-starts on boot. See WINDOWS-DEPLOYMENT-GUIDE.md Section 6.

**Prerequisites:** Story 1.4 (FastAPI service exists)

**Technical Notes:**
- **Development:** Manual start is preferred for flexibility
- **`--reload` flag:** Auto-restarts on file changes (FastAPI watches for changes)
- **Host `0.0.0.0`:** Allows access from network (not just localhost)
- **Port 8000:** Standard development port
- **Production (Phase 2):** NSSM service for auto-start/restart
- Reference: FastAPI development documentation (via context7 MCP)

---

### Story 1.7: Environment Variable Configuration and Secret Management

As a **backend developer**,  
I want **all secrets and configuration managed via environment variables**,  
So that **sensitive data is never committed to version control**.

**Acceptance Criteria:**

**Given** the FastAPI service project structure exists  
**When** I create `.env.example` with all required environment variable templates  
**Then** the following variables are documented in `.env.example`:

```
# Service Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
API_PORT=8000

# Authentication
MT5_SERVICE_API_KEY=<generate_secure_key_here>
JWT_SECRET_KEY=<generate_secure_key_here>

# Supabase Integration
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# MT5 Configuration
MT5_CONNECTION_POOL_SIZE=20
MT5_CONNECTION_TIMEOUT=300

# Caching (Phase 2)
REDIS_URL=redis://localhost:6379

# Encryption
ENCRYPTION_KEY=<32_byte_base64_key_for_aes256>
```

**And** A `.env` file is created (not committed to Git) with actual values:

```bash
# .env (Local Development)
ENVIRONMENT=development
LOG_LEVEL=DEBUG
API_PORT=8000

# Authentication (use simple keys for local dev)
MT5_SERVICE_API_KEY=dev_local_test_key_12345
JWT_SECRET_KEY=dev_jwt_secret_not_for_production

# Supabase Integration
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MT5 Configuration
MT5_CONNECTION_POOL_SIZE=5
MT5_CONNECTION_TIMEOUT=300

# Caching (Phase 2) - skip for now
# REDIS_URL=redis://localhost:6379

# Encryption (generate: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_base64_key_here

# CORS - Local Development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**And** `.gitignore` includes `.env` to prevent accidental commits  
**And** `config.py` loads all variables using `pydantic-settings` and validates required ones  
**And** The service fails to start with clear error message if required variables are missing  
**And** Frontend `.env.local` on Mac is configured:
  ```bash
  # tnm_concept/.env.local (Mac)
  VITE_MT5_SERVICE_URL=http://192.168.1.100:8000
  VITE_SUPABASE_URL=https://xyz.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

**Prerequisites:** Story 1.4 (FastAPI service structure)

**Technical Notes:**
- Use `pydantic-settings` (not `python-dotenv`) for type-safe config
- Generate secure keys: `openssl rand -base64 32`
- Encryption key must be exactly 32 bytes for AES-256
- Supabase keys available from Supabase dashboard
- **Local dev:** Simple API keys are fine (change for production!)
- **CORS origins:** Must match frontend dev server URL
- **Frontend config:** Windows service IP must be accessible from Mac
- Reference: FastAPI settings with pydantic (via context7 MCP)

---

### Story 1.8: End-to-End Local Network Testing

As a **full-stack developer**,  
I want **to verify complete connectivity between Mac frontend, Supabase, and Windows MT5 service**,  
So that **I confirm the local development environment is fully functional before writing integration code**.

**Acceptance Criteria:**

**Given** all Epic 1 stories are complete  
**When** I run end-to-end connectivity tests  
**Then** the following tests pass:

**Test 1: Mac → Windows Service (Direct)**
```bash
# From Mac terminal
curl http://192.168.1.100:8000/health
# Expected: {"status":"healthy", "mt5_initialized":false, ...}
```

**Test 2: Browser → Windows Service (CORS)**
```javascript
// From Mac browser console (http://localhost:5173)
fetch('http://192.168.1.100:8000/health')
  .then(r => r.json())
  .then(console.log);
// Expected: Health data logged (no CORS error)
```

**Test 3: Frontend Dev Server Access**
```bash
# From Mac
cd ~/Desktop/tnm/tnm_concept
npm run dev
# Expected: Frontend runs on http://localhost:5173
```

**Test 4: Environment Variables Loaded**
```python
# On Windows - test Python service
python -c "from app.config import settings; print(settings.MT5_SERVICE_API_KEY)"
# Expected: Prints API key (confirms .env loaded)
```

**Test 5: MT5 Terminal Accessible**
```python
# On Windows - test MT5 connection
python -c "import MetaTrader5 as mt5; print(mt5.initialize())"
# Expected: True (MT5 initialized)
```

**And** All tests documented in `docs/LOCAL-DEVELOPMENT-GUIDE.md`  
**And** Troubleshooting section covers common network issues  
**And** IP addresses and ports documented for reference

**Prerequisites:** Stories 1.1-1.7 (all foundation setup complete)

**Technical Notes:**
- **Purpose:** Catch networking/CORS issues before writing code
- **Common issues:** Firewall blocking, wrong IP, CORS misconfiguration
- **Debugging:** Use browser DevTools Network tab for CORS errors
- **Documentation:** Create LOCAL-DEVELOPMENT-GUIDE.md with this checklist
- **Success criteria:** All 5 tests pass = ready to start Epic 2

---

## Epic 2: MT5 Service Core

**Epic Goal:** Build the core MT5 integration logic including connection management, MT5 Terminal communication, and data transformation layer to enable querying trading account data.

**Business Value:** This is the heart of the integration - the ability to communicate with MT5 Terminal, manage multiple account connections efficiently, and transform MT5 native data into standardized formats for the API.

---

### Story 2.1: MT5 Connection Manager with Connection Pooling

As a **backend developer**,  
I want **a connection manager that maintains a pool of MT5 connections and handles account switching**,  
So that **multiple users can query their accounts efficiently without creating new connections for every request**.

**Acceptance Criteria:**

**Given** the MT5 Terminal is running and accessible  
**When** I implement the `MT5ConnectionManager` class in `app/core/mt5_manager.py`  
**Then** the connection manager has the following methods:
- `initialize()` - Initialize MT5 connection (call `mt5.initialize()`)
- `shutdown()` - Shutdown MT5 connection (call `mt5.shutdown()`)
- `login(login, password, server)` - Switch to specific account (call `mt5.login()`)
- `is_connected()` - Check if MT5 is initialized
- `get_account_info()` - Get current account info
- `get_last_error()` - Retrieve MT5 error details

**And** The connection manager maintains a pool of max 20 active connections (configurable)  
**And** Connections are reused via dynamic account switching using `mt5.login()`  
**And** Idle connections (no activity for 5 minutes) are logged out but MT5 remains initialized  
**And** Connection failures trigger automatic retry (3 attempts with exponential backoff)  
**And** All MT5 operations log errors with error codes for debugging

**Prerequisites:** Story 1.2 (MT5 installed), Story 1.3 (Python environment), Story 1.4 (Project structure)

**Technical Notes:**
- Import `MetaTrader5 as mt5` from MetaTrader5 package
- MT5 must be initialized before any operations: `mt5.initialize()`
- Use `mt5.login(login, password, server)` to switch accounts
- Connection pooling is logical (switch accounts) not physical (multiple MT5 instances)
- Reference: MetaTrader5 Python documentation
- Error codes: `mt5.last_error()` returns tuple (error_code, error_description)

---

### Story 2.2: MT5 Data Retrieval Functions

As a **backend developer**,  
I want **functions to retrieve account info, positions, and historical trades from MT5**,  
So that **the API endpoints can fetch real trading data**.

**Acceptance Criteria:**

**Given** the MT5 connection manager is implemented and can connect to accounts  
**When** I implement data retrieval functions in `app/core/mt5_manager.py`  
**Then** the following functions exist:

**`get_account_info_raw()`:**
- Calls `mt5.account_info()`
- Returns AccountInfo object with: balance, equity, margin, free_margin, margin_level, currency, leverage, profit, credit

**`get_positions_raw()`:**
- Calls `mt5.positions_get()`
- Returns list of Position objects with: ticket, symbol, type, volume, open_price, current_price, sl, tp, profit, swap, commission, magic, comment, time

**`get_history_deals_raw(from_date, to_date)`:**
- Calls `mt5.history_deals_get(from_date, to_date)`
- Returns list of Deal objects with: ticket, order, time, type, entry, position_id, volume, price, profit, swap, commission, symbol, comment

**`get_history_orders_raw(from_date, to_date)`:**
- Calls `mt5.history_orders_get(from_date, to_date)`
- Returns list of Order objects for closed trades

**And** All functions handle MT5 errors gracefully and return `None` on failure  
**And** Error details are logged with `mt5.last_error()`  
**And** Functions accept optional symbol filter parameter  
**And** Date parameters are converted to MT5-compatible datetime format

**Prerequisites:** Story 2.1 (Connection manager implemented)

**Technical Notes:**
- MT5 datetime uses Unix timestamp: `datetime(2023, 1, 1).timestamp()`
- Position types: 0=BUY, 1=SELL
- Deal types: 0=BUY, 1=SELL, 2=BALANCE, 3=CREDIT, etc.
- MT5 objects are NamedTuple-like structures
- Reference: `mt5.account_info()`, `mt5.positions_get()`, `mt5.history_deals_get()`

---

### Story 2.3: MT5 Data Transformation Layer

As a **backend developer**,  
I want **transformation functions that convert MT5 native objects to standardized JSON-serializable dictionaries**,  
So that **API responses are consistent and MT5-agnostic**.

**Acceptance Criteria:**

**Given** MT5 data retrieval functions return native MT5 objects  
**When** I implement transformation functions in `app/utils/transformers.py`  
**Then** the following functions exist:

**`transform_account_info(account_info: AccountInfo) -> dict`:**
- Converts MT5 AccountInfo to dictionary with keys: balance, equity, margin, free_margin, margin_level, currency, leverage, profit, credit
- All numeric values are converted to float
- Returns None if input is None

**`transform_position(position: Position) -> dict`:**
- Converts MT5 Position to dictionary
- Adds `type_str` field: "buy" or "sell"
- Converts timestamps to ISO 8601 format (UTC)
- Calculates `open_time` and `open_time_broker` fields
- Returns position dict with all essential fields

**`transform_deal(deal: Deal) -> dict`:**
- Converts MT5 Deal to dictionary
- Adds `type_str` field for deal type
- Converts timestamps to ISO 8601
- Handles different deal entry types (IN=0, OUT=1, INOUT=2)
- Groups deals into closed trades (match entry/exit deals)

**`transform_history_to_trades(deals: list) -> list`:**
- Groups related deals (entry + exit) into complete trade records
- Calculates trade duration, net profit, pips
- Returns list of trade dictionaries with: ticket, symbol, type, volume, open_price, close_price, open_time, close_time, profit, swap, commission, net_profit, duration_hours, pips

**And** All timestamps are converted from MT5 broker time to UTC  
**And** Symbol names are standardized (handle broker-specific suffixes)  
**And** All functions handle None/empty inputs gracefully  
**And** Unit tests exist for all transformation functions

**Prerequisites:** Story 2.2 (Data retrieval functions)

**Technical Notes:**
- Use `datetime.fromtimestamp(mt5_time, tz=timezone.utc).isoformat()`
- Position type: 0=buy, 1=sell
- Pips calculation depends on symbol type (forex: 4-5 decimals, indices: 1-2)
- Broker time offset may vary, normalize everything to UTC
- Reference: PRD Section 5.2 for expected JSON structure

---

### Story 2.4: Connection State Management and Error Handling

As a **backend developer**,  
I want **robust connection state management with automatic recovery from MT5 failures**,  
So that **temporary broker issues don't cause prolonged service downtime**.

**Acceptance Criteria:**

**Given** the MT5 connection manager is handling requests  
**When** MT5 Terminal crashes or broker server becomes unreachable  
**Then** the connection manager detects the failure via `mt5.last_error()`

**And** The manager attempts to reinitialize MT5 connection  
**And** Retry logic uses exponential backoff: 1s, 2s, 4s delays  
**And** After 3 failed attempts, the connection is marked as "unhealthy"  
**And** Subsequent requests return cached data (if available) or error response  
**And** A background health check task attempts reconnection every 30 seconds  
**And** Once reconnected, the connection status is restored to "healthy"

**And** Connection state is tracked with enum: `CONNECTED`, `DISCONNECTED`, `ERROR`, `RECONNECTING`  
**And** State changes are logged with timestamps  
**And** The `/health` endpoint includes MT5 connection state

**Prerequisites:** Story 2.1 (Connection manager), Story 1.4 (FastAPI service structure)

**Technical Notes:**
- Use FastAPI background tasks or `asyncio` for health checks
- Cache strategy: Store last successful response with TTL
- MT5 error codes: 10004=auth failed, 10009=terminal not initialized, etc.
- Circuit breaker pattern to avoid overwhelming broker server
- Reference: PRD Section 5.5 for error handling strategy

---

### Story 2.5: MT5 Connection Manager Unit Tests

As a **backend developer**,  
I want **comprehensive unit tests for the MT5 connection manager and data functions**,  
So that **core MT5 integration logic is verified and regressions are prevented**.

**Acceptance Criteria:**

**Given** the MT5 connection manager and data functions are implemented  
**When** I write unit tests in `tests/test_mt5_manager.py`  
**Then** the following test cases exist:

**Connection Manager Tests:**
- `test_initialize_success()` - MT5 initializes successfully
- `test_initialize_failure()` - Handles MT5 initialization failure
- `test_login_success()` - Account login succeeds
- `test_login_invalid_credentials()` - Handles auth failure
- `test_connection_retry_logic()` - Verifies exponential backoff
- `test_connection_pooling()` - Pool size limit enforced
- `test_idle_connection_timeout()` - Idle connections logged out

**Data Retrieval Tests:**
- `test_get_account_info()` - Account info retrieved correctly
- `test_get_positions()` - Open positions retrieved
- `test_get_history_deals()` - Historical deals retrieved with date filter
- `test_empty_positions()` - Handles accounts with no positions
- `test_mt5_error_handling()` - Handles MT5 errors gracefully

**Transformation Tests:**
- `test_transform_account_info()` - AccountInfo → dict conversion
- `test_transform_position()` - Position → dict with type_str
- `test_transform_deals_to_trades()` - Deal grouping logic
- `test_timezone_conversion()` - Timestamps converted to UTC
- `test_none_input_handling()` - Graceful handling of None inputs

**And** All tests use mocked MT5 calls (no actual MT5 Terminal required)  
**And** Test coverage is > 85% for `app/core/mt5_manager.py`  
**And** Tests run via `pytest` command  
**And** CI/CD pipeline runs tests automatically on commits

**Prerequisites:** Story 2.1, 2.2, 2.3, 2.4 (All MT5 core functions implemented)

**Technical Notes:**
- Use `unittest.mock` or `pytest-mock` for mocking MT5 functions
- Mock `mt5.initialize()`, `mt5.account_info()`, etc.
- Use fixtures for common test data (sample AccountInfo, Positions)
- Reference: pytest documentation for async test patterns

---

## Epic 3: REST API Implementation

**Epic Goal:** Implement all 6 REST API endpoints (connect, account info, positions, history, sync, health) with authentication, validation, and error handling.

**Business Value:** These endpoints are the primary interface through which the frontend and Supabase functions interact with MT5 data. Without them, no integration is possible.

---

### Story 3.1: API Authentication Middleware

As a **backend developer**,  
I want **authentication middleware that validates API keys and JWT tokens**,  
So that **only authorized services and users can access the MT5 API**.

**Acceptance Criteria:**

**Given** the FastAPI service has endpoints defined  
**When** I implement authentication middleware in `app/core/security.py`  
**Then** the following security functions exist:

**`verify_api_key(api_key: str = Header(...))`:**
- Validates `X-API-Key` header against `MT5_SERVICE_API_KEY` environment variable
- Returns 401 Unauthorized if missing or invalid
- Logs failed authentication attempts

**`verify_jwt_token(authorization: str = Header(...))`:**
- Extracts JWT from `Authorization: Bearer {token}` header
- Validates token signature using Supabase JWT secret
- Extracts user_id from token payload
- Returns 401 if token is invalid/expired
- Returns user_id if valid

**`verify_account_ownership(user_id: str, account_id: str)`:**
- Queries Supabase `trading_accounts` table
- Verifies that account_id belongs to user_id
- Returns 403 Forbidden if ownership check fails

**And** All API endpoints (except `/health`) require `X-API-Key` header  
**And** User-specific endpoints additionally require JWT authentication  
**And** Failed authentication attempts are logged with timestamp and IP  
**And** Rate limiting is configured: 100 requests/minute per API key

**Prerequisites:** Story 1.7 (Environment variables configured)

**Technical Notes:**
- Use FastAPI `Depends()` for dependency injection
- JWT validation: `python-jose` library
- Supabase JWT format: standard JWT with `sub` claim containing user_id
- Rate limiting: Use `slowapi` or `fastapi-limiter` library
- Reference: PRD Section 5.4 for authentication flow

---

### Story 3.2: POST /api/mt5/connect - Account Connection Endpoint

As a **backend developer**,  
I want **an endpoint to test and validate MT5 account credentials**,  
So that **users can verify their credentials before saving them**.

**Acceptance Criteria:**

**Given** the MT5 connection manager and authentication middleware are implemented  
**When** I implement `POST /api/mt5/connect` in `app/api/routes/mt5.py`  
**Then** the endpoint accepts the following request body:

```json
{
  "user_id": "uuid",
  "login": 12345678,
  "password": "investor_password",
  "server": "BrokerName-Server",
  "broker_name": "Broker Inc."
}
```

**And** The endpoint validates input parameters:
- `login` is a positive integer
- `password` is at least 6 characters
- `server` is not empty
- `broker_name` is not empty

**And** The endpoint calls `MT5ConnectionManager.login(login, password, server)`  
**And** If connection succeeds, retrieves account info via `MT5ConnectionManager.get_account_info()`  
**And** Returns success response with account details:

```json
{
  "success": true,
  "account_info": {
    "balance": 10000.00,
    "equity": 10050.00,
    "margin": 200.00,
    "free_margin": 9850.00,
    "margin_level": 5025.00,
    "currency": "USD",
    "leverage": 100,
    "profit": 50.00,
    "server": "BrokerName-Server"
  },
  "connection_id": "conn_uuid"
}
```

**And** If connection fails, returns error response:

```json
{
  "success": false,
  "error_code": "AUTH_FAILED",
  "error_message": "Invalid credentials or server unreachable",
  "details": "MT5 login returned error code 10004"
}
```

**And** Connection test times out after 10 seconds  
**And** Endpoint requires `X-API-Key` header  
**And** Endpoint does NOT save credentials (only tests connection)

**Prerequisites:** Story 2.1 (Connection manager), Story 3.1 (Authentication)

**Technical Notes:**
- Use Pydantic model for request validation
- Connection test should not interfere with active connections
- Use try/except to catch MT5 errors
- Reference: PRD Section 5.2.1 for endpoint specification

---

### Story 3.3: GET /api/mt5/account/{account_id}/info - Account Info Endpoint

As a **backend developer**,  
I want **an endpoint to retrieve current account state (balance, equity, margin)**,  
So that **the frontend can display live account information**.

**Acceptance Criteria:**

**Given** the MT5 connection manager can retrieve account info  
**When** I implement `GET /api/mt5/account/{account_id}/info` in `app/api/routes/mt5.py`  
**Then** the endpoint validates the request:
- Requires `X-API-Key` and `Authorization: Bearer {jwt}` headers
- Validates `account_id` is a valid UUID
- Verifies account ownership (user from JWT owns account)

**And** The endpoint:
1. Queries Supabase `trading_accounts` table to get account credentials
2. Decrypts account password using AES-256
3. Calls `MT5ConnectionManager.login(login, password, server)`
4. Retrieves account info via `get_account_info_raw()`
5. Transforms data via `transform_account_info()`
6. Returns JSON response

**Response format:**

```json
{
  "success": true,
  "account_id": "uuid",
  "timestamp": "2025-11-12T10:30:00Z",
  "data": {
    "balance": 10000.00,
    "equity": 10050.00,
    "margin": 200.00,
    "free_margin": 9850.00,
    "margin_level": 5025.00,
    "currency": "USD",
    "leverage": 100,
    "profit": 50.00,
    "credit": 0.00,
    "positions_count": 2
  },
  "cached": false,
  "cache_age_seconds": 0
}
```

**And** Response is cached for 30 seconds (in-memory cache)  
**And** Cached responses include `"cached": true` and cache age  
**And** Response time is < 1 second for fresh data, < 100ms for cached  
**And** Errors return appropriate HTTP status codes (401, 403, 500)

**Prerequisites:** Story 2.2 (Data retrieval), Story 2.3 (Transformers), Story 3.1 (Auth)

**Technical Notes:**
- Use Supabase Python client to query database
- Decrypt password: See Story 7.1 for encryption implementation
- Cache implementation: Use `cachetools` or simple dict with expiry
- Reference: PRD Section 5.2.2 for full specification

---

### Story 3.4: GET /api/mt5/account/{account_id}/positions - Open Positions Endpoint

As a **backend developer**,  
I want **an endpoint to retrieve all currently open positions for an account**,  
So that **users can see their active trades in real-time**.

**Acceptance Criteria:**

**Given** the MT5 connection manager can retrieve positions  
**When** I implement `GET /api/mt5/account/{account_id}/positions` in `app/api/routes/mt5.py`  
**Then** the endpoint validates authentication and ownership (same as Story 3.3)

**And** The endpoint accepts optional query parameters:
- `symbols` (string): Comma-separated list of symbols to filter (e.g., "EURUSD,GBPUSD")
- `type` (string): Filter by type ("buy" or "sell")

**And** The endpoint:
1. Retrieves account credentials from Supabase
2. Logs into MT5 account
3. Calls `get_positions_raw()` with optional symbol filter
4. Transforms each position via `transform_position()`
5. Calculates total profit across all positions
6. Returns JSON response

**Response format:**

```json
{
  "success": true,
  "account_id": "uuid",
  "timestamp": "2025-11-12T10:30:00Z",
  "positions": [
    {
      "ticket": 123456789,
      "symbol": "EURUSD",
      "type": "buy",
      "volume": 1.0,
      "open_price": 1.0850,
      "current_price": 1.0855,
      "sl": 1.0800,
      "tp": 1.0900,
      "profit": 50.00,
      "swap": -2.50,
      "commission": -5.00,
      "magic": 0,
      "comment": "Manual trade",
      "open_time": "2025-11-12T08:00:00Z",
      "open_time_broker": "2025-11-12T11:00:00+03:00"
    }
  ],
  "total_positions": 1,
  "total_profit": 42.50
}
```

**And** Response is cached for 5 seconds (shorter TTL for active trading data)  
**And** Response time is < 500ms  
**And** Empty positions list returns `"positions": []` not an error

**Prerequisites:** Story 2.2, 2.3, 3.1 (Data retrieval, transformers, auth)

**Technical Notes:**
- Symbol filter: Pass list to `mt5.positions_get(symbol="EURUSD")`
- Type filter: Apply after retrieval (filter transformed positions)
- Current price from `mt5.symbol_info_tick(symbol).bid/ask`
- Reference: PRD Section 5.2.3

---

### Story 3.5: GET /api/mt5/account/{account_id}/history - Historical Trades Endpoint

As a **backend developer**,  
I want **an endpoint to retrieve closed trades history for an account**,  
So that **users can analyze past trading performance**.

**Acceptance Criteria:**

**Given** the MT5 connection manager can retrieve historical deals  
**When** I implement `GET /api/mt5/account/{account_id}/history` in `app/api/routes/mt5.py`  
**Then** the endpoint validates authentication and ownership

**And** The endpoint accepts query parameters:
- `from_date` (string, ISO 8601): Start date (default: 30 days ago)
- `to_date` (string, ISO 8601): End date (default: now)
- `symbol` (string, optional): Filter by symbol
- `limit` (int): Max results (default: 100, max: 1000)
- `offset` (int): Pagination offset (default: 0)

**And** The endpoint:
1. Retrieves account credentials from Supabase
2. Logs into MT5 account
3. Parses date parameters and converts to MT5 timestamp format
4. Calls `get_history_deals_raw(from_date, to_date)`
5. Transforms deals to trades via `transform_history_to_trades()`
6. Applies symbol filter if provided
7. Calculates summary statistics (total profit/loss, win rate, total pips)
8. Paginates results based on limit/offset
9. Returns JSON response

**Response format:**

```json
{
  "success": true,
  "account_id": "uuid",
  "period": {
    "from": "2025-10-12T00:00:00Z",
    "to": "2025-11-12T23:59:59Z"
  },
  "trades": [
    {
      "ticket": 987654321,
      "symbol": "GBPUSD",
      "type": "sell",
      "volume": 0.5,
      "open_price": 1.2700,
      "close_price": 1.2680,
      "open_time": "2025-11-10T14:00:00Z",
      "close_time": "2025-11-11T16:30:00Z",
      "profit": 100.00,
      "swap": -1.50,
      "commission": -10.00,
      "net_profit": 88.50,
      "duration_hours": 26.5,
      "pips": 20
    }
  ],
  "total_trades": 45,
  "summary": {
    "total_profit": 1250.00,
    "total_loss": -890.00,
    "net_profit": 360.00,
    "win_rate": 0.62,
    "total_pips": 450
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}
```

**And** Response is cached for 5 minutes (historical data changes infrequently)  
**And** Response time is < 2 seconds  
**And** Date parsing handles multiple formats: ISO 8601, Unix timestamp  
**And** Invalid date ranges return 400 Bad Request

**Prerequisites:** Story 2.2, 2.3, 3.1 (Data retrieval, transformers, auth)

**Technical Notes:**
- Default from_date: `datetime.now() - timedelta(days=30)`
- MT5 deals must be grouped by position_id to form complete trades
- Win rate = winning_trades / total_trades
- Pagination: Slice results after transformation
- Reference: PRD Section 5.2.4

---

### Story 3.6: POST /api/mt5/account/{account_id}/sync - Manual Sync Trigger Endpoint

As a **backend developer**,  
I want **an endpoint to manually trigger data synchronization to Supabase**,  
So that **users can force an immediate data refresh instead of waiting for scheduled sync**.

**Acceptance Criteria:**

**Given** the account info, positions, and history endpoints are implemented  
**When** I implement `POST /api/mt5/account/{account_id}/sync` in `app/api/routes/mt5.py`  
**Then** the endpoint validates authentication and ownership

**And** The endpoint accepts request body:

```json
{
  "sync_type": "full",  // "full" or "incremental"
  "sync_history": true,
  "history_days": 30
}
```

**And** The endpoint:
1. Validates sync_type is "full" or "incremental"
2. Generates unique sync_id (UUID)
3. Adds sync task to FastAPI BackgroundTasks
4. Immediately returns response (non-blocking):

```json
{
  "success": true,
  "sync_id": "sync_uuid",
  "started_at": "2025-11-12T10:30:00Z",
  "estimated_duration_seconds": 15,
  "status": "processing"
}
```

**And** Background task executes sync:
- "full" sync: Retrieve account info + positions + history (full history_days)
- "incremental" sync: Retrieve account info + positions + history since last sync
- Update Supabase `trading_accounts` table with latest balance/equity
- Upsert positions into `trades` table
- Insert new closed trades from history
- Update `last_sync_at` timestamp
- Log sync results in `sync_logs` table

**And** Sync errors do not crash the background task  
**And** Sync status can be queried via sync_id (optional endpoint for status check)  
**And** Rate limit: Max 1 manual sync per account per minute

**Prerequisites:** Story 3.3, 3.4, 3.5 (All data retrieval endpoints)

**Technical Notes:**
- Use FastAPI `BackgroundTasks.add_task()`
- Supabase upsert: `supabase.table('trades').upsert(data, on_conflict='ticket')`
- Incremental sync: Query `last_sync_at` from database
- Reference: PRD Section 5.2.5

---

### Story 3.7: GET /health - Service Health Check Endpoint

As a **DevOps engineer**,  
I want **a health check endpoint that reports service and MT5 connection status**,  
So that **monitoring tools can detect issues and alert the team**.

**Acceptance Criteria:**

**Given** the MT5 connection manager and FastAPI service are running  
**When** I implement `GET /health` in `app/api/routes/health.py`  
**Then** the endpoint does NOT require authentication (public endpoint)

**And** The endpoint returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00Z",
  "version": "1.0.0",
  "mt5_initialized": true,
  "active_connections": 12,
  "total_accounts": 245,
  "uptime_seconds": 86400,
  "resource_usage": {
    "cpu_percent": 25.5,
    "memory_mb": 512,
    "disk_gb_free": 150
  },
  "last_error": null
}
```

**And** Status values: "healthy", "degraded", "unhealthy"
- "healthy": All systems operational, MT5 connected
- "degraded": MT5 reconnecting or minor issues
- "unhealthy": MT5 failed, service error

**And** Response time is < 100ms  
**And** HTTP status codes:
- 200 OK: "healthy"
- 200 OK: "degraded" (still responding but with warnings)
- 503 Service Unavailable: "unhealthy"

**And** The endpoint checks:
- MT5 initialization status
- Number of active connections in pool
- Total registered accounts (query Supabase)
- Service uptime (track start time)
- Resource usage (CPU, memory, disk via `psutil`)
- Last error from MT5 or service logs

**Prerequisites:** Story 2.1 (MT5 connection manager), Story 1.4 (FastAPI service)

**Technical Notes:**
- Use `psutil` library for resource monitoring
- Store service start_time as global variable
- Query Supabase for account count: `supabase.table('trading_accounts').select('id', count='exact')`
- This endpoint is used by UptimeRobot and Nginx health checks
- Reference: PRD Section 5.2.6

---

## Epic 4: Supabase Integration

**Epic Goal:** Update Supabase edge functions to call the Python MT5 service, modify database schema to support new integration, and ensure proper data persistence.

**Business Value:** Supabase acts as the data persistence and orchestration layer. It manages user authentication, stores account credentials securely, and synchronizes MT5 data into the database for AI analysis.

---

### Story 4.1: Update connect-mt5-account Edge Function

As a **backend developer**,  
I want **the connect-mt5-account edge function to call the Python MT5 service**,  
So that **users can connect their MT5 accounts via the frontend**.

**Acceptance Criteria:**

**Given** the Python MT5 service `/api/mt5/connect` endpoint is operational  
**When** I update `/supabase/functions/connect-mt5-account/index.ts`  
**Then** the edge function:
1. Receives account credentials from frontend (login, password, server, broker_name)
2. Validates input parameters
3. Calls Python service `POST /api/mt5/connect` with credentials and `X-API-Key` header
4. If connection test succeeds:
   - Encrypts password using AES-256
   - Inserts record into `trading_accounts` table
   - Stores encrypted credentials in `account_integrations` table
   - Returns success response with account_id
5. If connection fails, returns error without saving data

**And** The function removes all MetaAPI integration code  
**And** Environment variable `MT5_SERVICE_URL` is configured  
**And** Environment variable `MT5_SERVICE_API_KEY` is configured  
**And** Error handling includes retry logic (1 retry on timeout)  
**And** Function logs all connection attempts for debugging

**Prerequisites:** Story 3.2 (Connect endpoint), Story 7.1 (Encryption)

**Technical Notes:**
- Use Deno's `fetch()` for HTTP requests
- MT5 service URL: `https://mt5.tnm.com/api/mt5/connect`
- Reference existing edge function structure
- Test with Supabase CLI: `supabase functions serve`

---

### Story 4.2: Update sync-trading-data Edge Function

As a **backend developer**,  
I want **the sync-trading-data edge function to retrieve MT5 data and store it in Supabase**,  
So that **account data is automatically synchronized every 5 minutes**.

**Acceptance Criteria:**

**Given** the Python MT5 service endpoints (info, positions, history) are operational  
**When** I update `/supabase/functions/sync-trading-data/index.ts`  
**Then** the edge function:
1. Queries all active accounts from `trading_accounts` where `is_active = true`
2. For each account (process in batches of 10):
   - Calls `GET /api/mt5/account/{id}/info`
   - Calls `GET /api/mt5/account/{id}/positions`
   - Calls `GET /api/mt5/account/{id}/history?from_date={last_sync_at}`
3. Updates `trading_accounts` table:
   - Set `balance`, `equity`, `margin` from account info
   - Set `last_sync_at` to current timestamp
4. Upserts positions into `trades` table (match by `ticket`)
5. Inserts new closed trades from history
6. Logs sync results per account

**And** Sync errors for one account do not stop sync for other accounts  
**And** Failed accounts are logged in `sync_logs` table with error details  
**And** Function has 5-minute timeout (Supabase function limit)  
**And** Batch processing prevents timeout on large account lists  
**And** Scheduled via Supabase cron: `0 */5 * * *` (every 5 minutes)

**Prerequisites:** Story 3.3, 3.4, 3.5 (API endpoints), Story 4.3 (Database schema)

**Technical Notes:**
- Batch processing: Process 10 accounts, wait, process next 10
- Use `Promise.allSettled()` for batch requests
- Upsert query: `supabase.from('trades').upsert(trades, { onConflict: 'ticket' })`
- Reference: PRD Section 6.1 for edge function flow

---

### Story 4.3: Database Schema Updates for MT5 Integration

As a **database developer**,  
I want **database schema updated to support the new MT5 integration**,  
So that **all required data can be stored and queried efficiently**.

**Acceptance Criteria:**

**Given** existing `trading_accounts` and `trades` tables exist  
**When** I create migration files in `/supabase/migrations/`  
**Then** the following schema changes are applied:

**`trading_accounts` table modifications:**
```sql
ALTER TABLE trading_accounts
ADD COLUMN IF NOT EXISTS mt5_service_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_connection_error TEXT,
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS broker_server_time_offset INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_trading_accounts_sync_status 
ON trading_accounts(is_active, connection_status, last_sync_at);
```

**`sync_logs` table creation (new):**
```sql
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES trading_accounts(id),
  sync_type VARCHAR(50), -- 'scheduled', 'manual', 'realtime'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(50), -- 'success', 'failed', 'partial'
  trades_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_account ON sync_logs(account_id, started_at DESC);
```

**And** Migration is tested locally with Supabase CLI  
**And** Rollback migration is created  
**And** Migration is applied to staging environment before production  
**And** Existing data is preserved (no data loss)

**Prerequisites:** None (database changes are independent)

**Technical Notes:**
- Create migration: `supabase migration new mt5_integration_schema`
- Test locally: `supabase db reset` (dev only!)
- Apply migration: `supabase db push`
- Reference: PRD Section 6.2 for schema details

---

### Story 4.4: Row Level Security (RLS) Policies Update

As a **security engineer**,  
I want **RLS policies enforced on all MT5-related tables**,  
So that **users can only access their own trading data**.

**Acceptance Criteria:**

**Given** the database schema is updated  
**When** I create/update RLS policies in migration files  
**Then** the following policies exist:

**`trading_accounts` policies:**
```sql
-- Enable RLS
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own accounts
CREATE POLICY "Users can view own trading accounts"
ON trading_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own trading accounts"
ON trading_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own trading accounts"
ON trading_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own trading accounts"
ON trading_accounts FOR DELETE
USING (auth.uid() = user_id);
```

**`trades` policies:**
```sql
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
ON trades FOR SELECT
USING (
  account_id IN (
    SELECT id FROM trading_accounts WHERE user_id = auth.uid()
  )
);
```

**`sync_logs` policies (optional - admin only):**
```sql
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
ON sync_logs FOR SELECT
USING (
  account_id IN (
    SELECT id FROM trading_accounts WHERE user_id = auth.uid()
  )
);
```

**And** RLS is tested with sample user accounts  
**And** Users cannot access other users' data  
**And** Service role key bypasses RLS for edge functions  
**And** Policies are documented in migration comments

**Prerequisites:** Story 4.3 (Schema updates)

**Technical Notes:**
- Test RLS: Use Supabase SQL editor with different auth contexts
- Service role key: Required for edge functions to query all accounts
- Reference: PRD Section 6.3 for RLS policies

---

### Story 4.5: Supabase Edge Function Deployment

As a **DevOps engineer**,  
I want **updated edge functions deployed to Supabase production**,  
So that **the integration is live and functional for users**.

**Acceptance Criteria:**

**Given** edge functions are updated and tested locally  
**When** I deploy edge functions to Supabase  
**Then** the following functions are deployed:
- `connect-mt5-account`
- `sync-trading-data`

**And** Environment variables are configured in Supabase dashboard:
- `MT5_SERVICE_URL=https://mt5.tnm.com`
- `MT5_SERVICE_API_KEY=<secure_key>`
- `ENCRYPTION_KEY=<32_byte_key>`

**And** Scheduled cron job is configured for `sync-trading-data`:
- Schedule: `0 */5 * * *` (every 5 minutes)
- Enabled: true

**And** Function logs are monitored for errors  
**And** Test invocations succeed from Supabase dashboard  
**And** Rollback procedure is documented

**Prerequisites:** Story 4.1, 4.2 (Edge functions updated)

**Technical Notes:**
- Deploy: `supabase functions deploy connect-mt5-account`
- Set secrets: `supabase secrets set MT5_SERVICE_API_KEY=xxx`
- Cron schedule: Configure in Supabase dashboard → Edge Functions → Cron
- Monitor: Supabase dashboard → Edge Functions → Logs

---

## Epic 5: Frontend MT5 Integration

**Epic Goal:** Re-enable frontend components for MT5 account linking, display synced data, and provide user-facing features for the integration.

**Business Value:** Without the frontend, users cannot interact with the MT5 integration. This epic delivers the user experience.

---

### Story 5.1: Re-enable AccountLinkForm Component

As a **frontend developer**,  
I want **the AccountLinkForm component re-enabled and connected to Supabase edge function**,  
So that **users can link their MT5 accounts through the UI**.

**Acceptance Criteria:**

**Given** the `connect-mt5-account` edge function is deployed  
**When** I update `/tnm_concept/src/components/tnm-pro/AccountLinkForm.tsx`  
**Then** the component:
1. Removes the "temporarily unavailable" alert banner
2. Re-enables the form submit button
3. Adds broker dropdown with common brokers (XM, IC Markets, FTMO, etc.)
4. Adds server dropdown filtered by selected broker
5. Adds "Test Connection" button (calls edge function without saving)
6. Adds "Connect Account" button (tests + saves if successful)

**And** Form validation:
- Login: Required, positive integer
- Password: Required, min 6 characters
- Broker: Required, selected from dropdown
- Server: Required, selected from dropdown

**And** UI feedback:
- Loading spinner during connection test
- Success message with account balance on successful connection
- Error message with details on failure
- Connection status indicator (testing → success/error)

**And** On successful connection:
- Account appears in LinkedAccountsList
- Success toast notification
- Form is reset for next account

**Prerequisites:** Story 4.1 (Edge function deployed)

**Technical Notes:**
- Use existing Supabase client for edge function call
- Broker/server data: Create config file `src/config/brokers.ts`
- Loading state: Use existing loading utilities
- Reference: Existing AccountLinkForm structure

---

### Story 5.2: Update auth.ts State Management

As a **frontend developer**,  
I want **the auth.ts Zustand store updated to support MT5 account operations**,  
So that **account data is managed consistently across the app**.

**Acceptance Criteria:**

**Given** the edge functions and API endpoints are operational  
**When** I update `/tnm_concept/src/store/auth.ts`  
**Then** the `useAccountStore` includes:

**Updated `addAccount` method:**
```typescript
addAccount: async (accountData) => {
  set({ isConnecting: true });
  
  try {
    const { data, error } = await supabase.functions.invoke('connect-mt5-account', {
      body: accountData
    });
    
    if (error) throw error;
    
    // Refresh accounts list
    await get().loadAccounts();
    
    return { success: true, account_id: data.account_id };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    set({ isConnecting: false });
  }
}
```

**New methods:**
- `syncAccount(accountId)` - Triggers manual sync
- `deleteAccount(accountId)` - Removes account
- `refreshAccountData(accountId)` - Fetches latest data
- `getAccountStatus(accountId)` - Returns connection status

**And** State includes:
- `isConnecting: boolean`
- `lastSyncTime: Record<string, Date>`
- `syncErrors: Record<string, string>`

**And** All methods handle errors gracefully  
**And** Loading states are tracked for UI feedback

**Prerequisites:** Story 4.1 (Edge function), Story 5.1 (Form component)

**Technical Notes:**
- Use existing Zustand store patterns
- Error handling: Toast notifications for user feedback
- Reference: Existing auth store implementation

---

### Story 5.3: Update LinkedAccountsList Component

As a **frontend developer**,  
I want **the LinkedAccountsList component to display synced MT5 accounts with live data**,  
So that **users can see their connected accounts and their status**.

**Acceptance Criteria:**

**Given** users have linked MT5 accounts  
**When** I update `/tnm_concept/src/components/tnm-pro/LinkedAccountsList.tsx`  
**Then** the component:
1. Removes "live synchronization disabled" info alert
2. Displays list of linked accounts with:
   - Broker name and server
   - Account number (login)
   - Current balance and equity
   - Connection status badge (connected/syncing/error)
   - Last sync time (e.g., "2 minutes ago")
   - Next sync countdown (e.g., "Next sync in 3 minutes")
3. Adds action buttons per account:
   - "Refresh Now" - Manual sync
   - "View Details" - Opens modal with full account info
   - "Disconnect" - Removes account

**And** Connection status badges:
- Green: "Connected" (last sync < 10 minutes ago)
- Yellow: "Syncing" (sync in progress)
- Red: "Error" (last sync failed)
- Gray: "Disconnected" (inactive)

**And** Account details modal shows:
- Full account info (balance, equity, margin, etc.)
- Open positions count
- Recent trade count
- Last successful sync timestamp
- Sync history (last 5 syncs)

**And** Real-time updates when sync completes  
**And** Loading states during refresh operations

**Prerequisites:** Story 4.2 (Sync function), Story 5.2 (State management)

**Technical Notes:**
- Use relative time formatting: `formatDistanceToNow()` from `date-fns`
- Sync countdown: Calculate based on 5-minute interval
- Real-time updates: Poll database or use Supabase Realtime subscriptions
- Reference: Existing linked accounts UI patterns

---

### Story 5.4: Update AIHub Component for Live Data Display

As a **frontend developer**,  
I want **the AIHub component to display live MT5 data from synced accounts**,  
So that **users can see their trading data in the AI analysis interface**.

**Acceptance Criteria:**

**Given** users have synced MT5 accounts with data  
**When** I update `/tnm_concept/src/components/tnm-pro/AIHub.tsx` (or UnifiedAIHub)  
**Then** the component:
1. Displays aggregate account data:
   - Total balance across all accounts
   - Total equity
   - Total open positions
   - Total profit/loss (daily, weekly, monthly)
2. Shows account selector dropdown (if multiple accounts)
3. Displays position list with real-time P&L
4. Shows recent closed trades
5. Displays sync status indicator

**And** Data updates automatically when sync completes  
**And** Charts/graphs use synced historical data  
**And** AI analysis uses current positions and trades  
**And** Loading states show when data is being fetched

**Prerequisites:** Story 4.2 (Data synced to database), Story 5.3 (Account list)

**Technical Notes:**
- Query `trades` table for positions and history
- Aggregate calculations: Sum balances from multiple accounts
- Use existing chart components (if available)
- Real-time: Supabase Realtime subscriptions on `trades` table

---

### Story 5.5: Frontend Environment Configuration

As a **frontend developer**,  
I want **environment variables configured for MT5 integration**,  
So that **the frontend knows how to connect to backend services**.

**Acceptance Criteria:**

**Given** the Python MT5 service and Supabase functions are deployed  
**When** I update `/tnm_concept/.env.local` (development) and Vercel env vars (production)  
**Then** the following variables are configured:

**Development (.env.local):**
```
VITE_MT5_SERVICE_URL=https://mt5.tnm.com
VITE_MT5_SERVICE_WS=wss://mt5.tnm.com/ws
VITE_ENABLE_REALTIME=false
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

**Production (Vercel dashboard):**
- Same variables with production URLs

**And** Frontend code uses environment variables:
```typescript
const MT5_SERVICE_URL = import.meta.env.VITE_MT5_SERVICE_URL;
```

**And** Build fails if required env vars are missing  
**And** Development and production configs are documented

**Prerequisites:** Story 1.5 (Python service deployed)

**Technical Notes:**
- Vite env vars: Must start with `VITE_`
- Set in Vercel: Dashboard → Project → Settings → Environment Variables
- Reference: Vite documentation on env variables

---

## Epic 6: Real-time WebSocket (Phase 2)

**Epic Goal:** Implement WebSocket endpoint for real-time position monitoring and push notifications when account data changes.

**Business Value:** WebSocket provides instant updates without polling, improving user experience and reducing server load. This is a Growth feature (Phase 2).

---

### Story 6.1: WebSocket Endpoint Implementation

As a **backend developer**,  
I want **a WebSocket endpoint that streams real-time account updates**,  
So that **users receive instant notifications when positions change**.

**Acceptance Criteria:**

**Given** the Python MT5 service has REST API endpoints operational  
**When** I implement `WS /ws/account/{account_id}` in `app/api/routes/websocket.py`  
**Then** the WebSocket endpoint:
1. Accepts connections with JWT token in query param: `/ws/account/{id}?token={jwt}`
2. Validates JWT and verifies account ownership
3. Accepts WebSocket connection via `await websocket.accept()`
4. Sends connection acknowledgment message
5. Starts background monitoring task (polls MT5 every 1 second)
6. Detects changes in account data and positions
7. Sends push messages when changes detected
8. Handles client disconnection gracefully

**Message types sent to client:**

**Connection acknowledged:**
```json
{
  "type": "connected",
  "account_id": "uuid",
  "monitoring_interval": "1s"
}
```

**Account info update (balance changed):**
```json
{
  "type": "account_update",
  "timestamp": "2025-11-12T10:30:15Z",
  "changes": {
    "balance": { "old": 10000.00, "new": 10050.00, "diff": 50.00 },
    "equity": { "old": 10020.00, "new": 10055.00 }
  }
}
```

**Position opened:**
```json
{
  "type": "position_opened",
  "timestamp": "2025-11-12T10:30:20Z",
  "position": { "ticket": 123456789, "symbol": "EURUSD", "type": "buy", "volume": 1.0, "price": 1.0850 }
}
```

**And** Heartbeat mechanism:
- Client sends `{"type": "ping"}` every 30 seconds
- Server responds `{"type": "pong"}`
- Connection closed if no ping for 90 seconds

**And** Error handling:
- MT5 connection loss sends error message
- Automatic reconnect attempts
- Graceful degradation to cached data

**Prerequisites:** Story 3.3, 3.4 (Account info and positions endpoints)

**Technical Notes:**
- Use FastAPI WebSocket: `from fastapi import WebSocket`
- Background monitoring: `asyncio.create_task()` for polling loop
- Change detection: Compare previous state with current state
- Reference: PRD Section 5.3 for WebSocket protocol

---

### Story 6.2: Frontend WebSocket Hook (useRealtimeMT5Data)

As a **frontend developer**,  
I want **a React hook that manages WebSocket connection and state**,  
So that **components can easily subscribe to real-time MT5 updates**.

**Acceptance Criteria:**

**Given** the WebSocket endpoint is implemented  
**When** I create `src/hooks/useRealtimeMT5Data.ts`  
**Then** the hook:
1. Accepts `accountId` parameter
2. Establishes WebSocket connection to `/ws/account/{accountId}`
3. Handles connection lifecycle (open, message, error, close)
4. Parses incoming messages and updates React state
5. Implements automatic reconnection (5-second delay)
6. Sends heartbeat pings every 30 seconds
7. Provides connection status

**Hook API:**
```typescript
const {
  accountData,      // Latest account info
  positions,        // Current positions list
  isConnected,      // Connection status
  error,            // Error message (if any)
  lastUpdate        // Timestamp of last update
} = useRealtimeMT5Data(accountId);
```

**And** Hook handles all message types (account_update, position_opened, etc.)  
**And** Toast notifications for important events (position opened/closed)  
**And** Connection status indicator updates in real-time  
**And** Hook cleans up WebSocket on unmount

**Prerequisites:** Story 6.1 (WebSocket endpoint)

**Technical Notes:**
- Use `useEffect` for WebSocket lifecycle management
- JWT token: Get from Supabase session
- WebSocket URL: `wss://mt5.tnm.com/ws/account/${accountId}?token=${jwt}`
- Reference: React WebSocket patterns

---

### Story 6.3: WebSocket Connection Testing and Load Testing

As a **backend developer**,  
I want **WebSocket endpoint tested under load with multiple concurrent connections**,  
So that **we verify it can handle 300+ simultaneous users**.

**Acceptance Criteria:**

**Given** the WebSocket endpoint is implemented  
**When** I run load tests using `locust` or `websocket-bench`  
**Then** the tests:
1. Simulate 300 concurrent WebSocket connections
2. Each connection subscribes to a different account
3. Connections remain open for 5 minutes
4. Heartbeat pings sent every 30 seconds
5. Measure message latency (should be < 1 second)
6. Monitor server resource usage (CPU, memory)

**And** Test results show:
- All 300 connections established successfully
- Average message latency < 500ms
- Server CPU usage < 70%
- Server memory usage < 12 GB
- No connection drops or errors

**And** Edge cases tested:
- Client disconnects abruptly
- Server restart while connections active
- MT5 Terminal crash during WebSocket session
- Network latency simulation

**Prerequisites:** Story 6.1 (WebSocket endpoint implemented)

**Technical Notes:**
- Load testing tool: `locust` with WebSocket support
- Monitor with: `psutil`, Grafana (if configured)
- Run tests on staging environment first
- Document test results and bottlenecks

---

## Epic 7: Security & Compliance

**Epic Goal:** Implement credential encryption, enhance authentication mechanisms, audit logging, and ensure GDPR compliance.

**Business Value:** Trading account credentials are highly sensitive. Robust security is non-negotiable for user trust and regulatory compliance.

---

### Story 7.1: AES-256 Credential Encryption Implementation

As a **security engineer**,  
I want **MT5 account passwords encrypted using AES-256**,  
So that **credentials are never stored in plain text**.

**Acceptance Criteria:**

**Given** the service handles MT5 account credentials  
**When** I implement encryption functions in `app/core/security.py`  
**Then** the following functions exist:

**`encrypt_password(plain_password: str, key: bytes) -> str`:**
- Uses AES-256 in CBC or GCM mode
- Generates random IV (Initialization Vector) for each encryption
- Returns base64-encoded string: `iv + encrypted_data`
- Key is 32 bytes (256 bits)

**`decrypt_password(encrypted_password: str, key: bytes) -> str`:**
- Extracts IV from encrypted string
- Decrypts using AES-256 with same key
- Returns plain text password
- Raises exception if decryption fails

**And** Encryption key is loaded from environment variable `ENCRYPTION_KEY`  
**And** Key is never logged or exposed in errors  
**And** Encrypted passwords are stored in `account_integrations` table  
**And** Unit tests verify encrypt/decrypt roundtrip

**Prerequisites:** Story 1.7 (Environment variables)

**Technical Notes:**
- Use `cryptography` library: `from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes`
- Generate key: `openssl rand -base64 32`
- IV size: 16 bytes for AES
- Store format: `base64(iv + ciphertext)`
- Reference: PRD Section 8.2 for security requirements

---

### Story 7.2: Audit Logging for Credential Access

As a **security engineer**,  
I want **all credential access and authentication events logged**,  
So that **security incidents can be investigated and detected**.

**Acceptance Criteria:**

**Given** the service handles authentication and credentials  
**When** I implement audit logging in `app/core/logger.py`  
**Then** the following events are logged:

**Authentication events:**
- API key validation attempts (success/failure)
- JWT token validation attempts (success/failure)
- Failed login attempts with account_id and IP address
- Rate limit violations

**Credential access events:**
- MT5 password decryption events (account_id, user_id, timestamp)
- Account connection attempts
- Account deletion requests

**And** Log format is structured JSON:
```json
{
  "timestamp": "2025-11-12T10:30:00Z",
  "event_type": "credential_access",
  "account_id": "uuid",
  "user_id": "uuid",
  "ip_address": "1.2.3.4",
  "action": "decrypt_password",
  "result": "success"
}
```

**And** Logs are written to `logs/audit.log` (separate from application logs)  
**And** Log rotation: Daily rotation, keep 90 days  
**And** Sensitive data (passwords, keys) is NEVER logged  
**And** Failed authentication attempts trigger alerts after 5 failures

**Prerequisites:** Story 7.1 (Encryption implemented)

**Technical Notes:**
- Use Python `logging` module with JSON formatter
- Log rotation: `logging.handlers.TimedRotatingFileHandler`
- Alert mechanism: Send webhook to monitoring service (Phase 2)
- Reference: PRD Section 8.2 for security requirements

---

### Story 7.3: GDPR Data Deletion Implementation

As a **backend developer**,  
I want **users able to request complete data deletion (GDPR right to erasure)**,  
So that **the service complies with GDPR regulations**.

**Acceptance Criteria:**

**Given** a user requests account deletion  
**When** The deletion process is triggered  
**Then** the following data is deleted:

**From Supabase:**
- All records in `trading_accounts` where `user_id = {user_id}`
- All records in `trades` where `account_id IN (user's accounts)`
- All records in `account_integrations` where `user_id = {user_id}`
- All records in `sync_logs` where `account_id IN (user's accounts)`

**And** Deletion is performed within 24 hours of request  
**And** User receives confirmation email when deletion is complete  
**And** Deleted data cannot be recovered  
**And** Audit logs retain deletion event record (but not the deleted data)  
**And** Cascade deletion ensures no orphaned records

**And** Data export functionality exists:
- User can request data export before deletion
- Export includes: Account info, all trades, sync logs
- Export format: JSON and CSV
- Export delivered via secure download link (expires in 7 days)

**Prerequisites:** Story 4.3 (Database schema)

**Technical Notes:**
- Implement edge function: `delete-user-data`
- Use Supabase RLS to ensure only user can delete their data
- Cascade delete: Use database foreign key constraints with `ON DELETE CASCADE`
- Data export: Generate files in edge function, upload to Supabase Storage
- Reference: PRD Section 8.5 for data retention policy

---

### Story 7.4: Rate Limiting and DDoS Protection

As a **DevOps engineer**,  
I want **rate limiting implemented on all API endpoints**,  
So that **the service is protected from abuse and DDoS attacks**.

**Acceptance Criteria:**

**Given** the FastAPI service has public endpoints  
**When** I implement rate limiting middleware  
**Then** the following limits are enforced:

**Per API Key:**
- 100 requests/minute for all endpoints combined
- 10 requests/minute for `/api/mt5/connect` (expensive operation)
- 1 request/minute for `/api/mt5/account/{id}/sync` (manual sync)

**Per IP Address (if no API key):**
- 20 requests/minute for `/health` endpoint
- All other endpoints require API key (no IP-based access)

**And** Rate limit responses:
- HTTP 429 Too Many Requests
- Header: `Retry-After: {seconds}`
- Body: `{"error": "Rate limit exceeded", "retry_after": 60}`

**And** Rate limit counters reset every minute  
**And** Nginx also implements connection limits:
- Max 50 connections per IP
- Request timeout: 30 seconds
- Body size limit: 1 MB

**Prerequisites:** Story 1.5 (Nginx configured)

**Technical Notes:**
- Use `slowapi` library for FastAPI rate limiting
- Nginx config: `limit_conn_zone` and `limit_req_zone`
- Redis-based rate limiting for distributed systems (Phase 2)
- Reference: PRD Section 8.2 for security requirements

---

## Epic 8: Monitoring & Operations

**Epic Goal:** Implement comprehensive monitoring, logging, alerting, and operational dashboards to ensure production readiness.

**Business Value:** Without monitoring, issues go undetected and users suffer. This epic ensures the service is observable and maintainable.

---

### Story 8.1: Structured Logging Implementation

As a **backend developer**,  
I want **structured JSON logging across the entire service**,  
So that **logs are machine-readable and searchable**.

**Acceptance Criteria:**

**Given** the FastAPI service generates logs  
**When** I implement structured logging in `app/core/logger.py`  
**Then** all logs are in JSON format:

```json
{
  "timestamp": "2025-11-12T10:30:00.123Z",
  "level": "INFO",
  "logger": "app.api.routes.mt5",
  "message": "Account info retrieved successfully",
  "account_id": "uuid",
  "user_id": "uuid",
  "duration_ms": 234,
  "correlation_id": "req_abc123"
}
```

**And** Log levels are used correctly:
- ERROR: Exceptions, failures, critical issues
- WARN: Deprecated features, recoverable errors
- INFO: Important business events (account connected, sync completed)
- DEBUG: Detailed diagnostic information

**And** Correlation IDs track requests across services:
- Generate unique ID per request
- Include in all log entries for that request
- Pass to Supabase functions via header

**And** Sensitive data is sanitized:
- Passwords replaced with `***REDACTED***`
- API keys truncated to last 4 characters
- PII (email, names) excluded from logs

**And** Log files:
- `logs/app.log` - Application logs
- `logs/audit.log` - Audit/security logs
- `logs/error.log` - Error-level logs only

**Prerequisites:** Story 1.4 (FastAPI service structure)

**Technical Notes:**
- Use `python-json-logger` or custom JSON formatter
- Correlation ID: Generate with `uuid.uuid4()` per request
- Sanitization: Custom log filter to redact sensitive fields
- Log rotation: Daily, keep 30 days

---

### Story 8.2: UptimeRobot External Monitoring Setup

As a **DevOps engineer**,  
I want **UptimeRobot configured to monitor service availability**,  
So that **I'm alerted immediately when the service goes down**.

**Acceptance Criteria:**

**Given** the service is deployed to production  
**When** I configure UptimeRobot (https://uptimerobot.com)  
**Then** the following monitors are created:

**HTTP Monitor: MT5 Service Health**
- URL: `https://mt5.tnm.com/health`
- Interval: 60 seconds
- Expected response: HTTP 200 with `"status": "healthy"`
- Alert on: HTTP 503 or timeout

**HTTP Monitor: Supabase Edge Functions**
- URL: Test invoke of edge function (via Supabase API)
- Interval: 5 minutes
- Alert on: Function error or timeout

**And** Alert channels configured:
- Email: DevOps team
- Slack: #alerts channel
- SMS: Critical alerts only (production down > 5 minutes)

**And** Alert thresholds:
- Alert if down for 2 minutes (2 consecutive failures)
- Escalate to SMS if down for 5 minutes
- Send recovery notification when back up

**And** Status page:
- Public status page created (status.tnm.com)
- Shows service uptime and recent incidents

**Prerequisites:** Story 3.7 (Health endpoint implemented)

**Technical Notes:**
- UptimeRobot free tier: 50 monitors, 5-minute intervals
- Paid tier recommended: 60-second intervals, SMS alerts
- Status page: UptimeRobot provides built-in status page

---

### Story 8.3: Error Tracking with Sentry (Optional)

As a **backend developer**,  
I want **automatic error tracking and reporting via Sentry**,  
So that **exceptions are captured with full context for debugging**.

**Acceptance Criteria:**

**Given** the service encounters errors in production  
**When** I integrate Sentry in `app/main.py`  
**Then** Sentry automatically captures:
- Unhandled exceptions
- HTTP 500 errors
- Background task failures
- MT5 connection errors

**And** Error reports include:
- Full stack trace
- Request context (URL, method, headers)
- User context (user_id, account_id)
- Environment (Python version, dependencies)
- Breadcrumbs (recent log entries leading to error)

**And** Sentry configuration:
- Environment: "production" or "staging"
- Release tracking: Git commit SHA
- Sample rate: 100% for errors, 10% for transactions
- PII scrubbing: Enabled (remove passwords, keys)

**And** Alert rules:
- Notify Slack on new error types
- Notify email on error spike (> 10 errors/minute)
- Daily digest of all errors

**Prerequisites:** Story 1.4 (FastAPI service), Story 8.1 (Structured logging)

**Technical Notes:**
- Install: `pip install sentry-sdk[fastapi]`
- Initialize in main.py: `sentry_sdk.init(dsn=SENTRY_DSN, integrations=[FastApiIntegration()])`
- Sentry free tier: 5,000 errors/month
- Reference: Sentry FastAPI documentation

---

### Story 8.4: Performance Metrics Collection

As a **backend developer**,  
I want **performance metrics collected and exposed via `/metrics` endpoint**,  
So that **I can monitor service health and identify bottlenecks**.

**Acceptance Criteria:**

**Given** the service is running and handling requests  
**When** I implement metrics collection in `app/core/metrics.py`  
**Then** the following metrics are tracked:

**Request Metrics:**
- Request count (total, per endpoint)
- Request duration (average, p50, p95, p99)
- Response status codes (2xx, 4xx, 5xx)
- Active connections

**MT5 Metrics:**
- MT5 connection pool size
- MT5 login attempts (success/failure)
- MT5 API call duration
- MT5 errors by type

**System Metrics:**
- CPU usage (percent)
- Memory usage (MB)
- Disk usage (GB free)
- Active threads

**And** Metrics are exposed at `/metrics` endpoint in Prometheus format:
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/mt5/account/info",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 250
```

**And** `/metrics` endpoint does NOT require authentication (for Prometheus scraping)  
**And** Metrics are collected with minimal performance overhead (< 1% CPU)

**Prerequisites:** Story 3.7 (Health endpoint)

**Technical Notes:**
- Use `prometheus-fastapi-instrumentator` library
- Add middleware to track request metrics automatically
- Custom metrics: Use `prometheus_client` gauges and counters
- Grafana dashboard (Phase 2): Visualize metrics

---

### Story 8.5: Automated Backup and Recovery Procedures

As a **DevOps engineer**,  
I want **automated daily backups of the database and VPS**,  
So that **data can be restored in case of disaster**.

**Acceptance Criteria:**

**Given** the service is running in production  
**When** I configure backup procedures  
**Then** the following backups are automated:

**Supabase Database Backups:**
- Frequency: Daily at 2:00 AM UTC
- Retention: 30 days
- Backup method: Supabase automatic backups (enabled in dashboard)
- Backup includes: All tables, schema, RLS policies
- Test restoration: Monthly restoration drill

**Windows VPS Snapshot:**
- Frequency: Weekly (Sundays at 3:00 AM UTC)
- Retention: 4 weeks
- Snapshot includes: Entire VPS disk
- Provider: Contabo or Hetzner snapshot feature

**Application Data Backup:**
- Frequency: Daily
- Backup includes: Environment files, configuration, logs (last 7 days)
- Storage: Supabase Storage or S3-compatible bucket
- Encryption: AES-256 encryption for backup files

**And** Recovery procedures documented:
- Step-by-step restoration guide
- RTO (Recovery Time Objective): < 2 hours
- RPO (Recovery Point Objective): < 24 hours
- Contact information for escalation

**And** Disaster recovery testing:
- Quarterly full restoration test
- Document test results and timings
- Update procedures based on learnings

**Prerequisites:** Story 1.6 (Windows Service configured), Story 4.3 (Database schema)

**Technical Notes:**
- Supabase backups: Automatic with paid plan
- VPS snapshots: Schedule via provider dashboard
- Application backup script: PowerShell script with encryption
- Reference: PRD Section 8.3 for reliability requirements

---

## Epic Summary

**Implementation Timeline (UPDATED for Local Development):**

**Phase 1 - Local Development & MVP (Weeks 1-3):**
- ✅ **Epic 1: Foundation & Infrastructure - LOCAL** (Week 1)
  - 8 stories: Local Windows setup, MT5, Python, FastAPI, CORS, ngrok, manual startup, testing
  - **Cost: $0** (using existing hardware)
- ✅ **Epic 2: MT5 Service Core** (Week 1-2)
  - 5 stories: Connection manager, data retrieval, transformers, error handling, tests
- ✅ **Epic 3: REST API Implementation** (Week 2)
  - 7 stories: Auth middleware, 6 REST endpoints
- ✅ **Epic 4: Supabase Integration** (Week 2-3)
  - 5 stories: Edge functions (use ngrok URL for local testing), database schema, RLS
- ✅ **Epic 5: Frontend MT5 Integration** (Week 3)
  - 5 stories: Forms, state, components (call local Windows IP: 192.168.1.100:8000)
- ✅ **Epic 7: Security & Compliance - Core** (Week 3)
  - 2 stories: AES-256 encryption, basic audit logging
- ✅ **Epic 8: Monitoring & Operations - Basic** (Week 3)
  - 2 stories: Structured logging, basic health checks

**Phase 2 - VPS Deployment & Growth (Weeks 4-8):**
- ✅ **VPS Migration** (Week 4)
  - Provision Hetzner/Contabo VPS (€15-25/month)
  - Copy working code from local Windows to VPS
  - Add Nginx + SSL (win-acme)
  - Add NSSM Windows Service
  - Update frontend URLs to production
  - Deploy & test
- ✅ **Epic 6: Real-time WebSocket** (Week 5-6)
  - 3 stories: WebSocket endpoint, frontend hook, load testing
- ✅ **Epic 7: Security & Compliance - Complete** (Week 7)
  - 2 remaining stories: GDPR deletion, rate limiting
- ✅ **Epic 8: Monitoring & Operations - Complete** (Week 7-8)
  - 3 remaining stories: UptimeRobot, Sentry, metrics, backups

**Phase 3 - Vision (Future):**
- Multi-region deployment
- Enterprise features
- Advanced analytics

---

## Story Statistics

- **Total Epics:** 8
- **Total Stories:** 41 (added Story 1.8 for E2E testing)
- **Phase 1 - Local MVP:** 29 stories (Weeks 1-3, $0 cost)
- **VPS Migration:** 1 epic of infrastructure updates (Week 4, ~€15-25/month starts)
- **Phase 2 - Growth:** 11 stories (Weeks 5-8)
- **Estimated Duration:** 8 weeks total
  - **Week 1-3:** Local development and testing ($0)
  - **Week 4:** VPS deployment (start paying)
  - **Week 5-8:** Growth features on production VPS

---

## Local Development Benefits

✅ **Cost Savings:** $0 for 3 weeks vs €45-75 if started with VPS  
✅ **Risk Reduction:** Validate everything locally before production  
✅ **Faster Iteration:** No deployment delays, instant testing  
✅ **Easy Debugging:** Direct access to Windows machine, real-time logs  
✅ **Network Flexibility:** Test on same network as production users will experience  
✅ **Confidence:** Deploy to VPS only when 100% sure it works  

---

## MCP-Enhanced Development Notes

**Context7 (Upstash) Contributions:**
- ✅ FastAPI CORS middleware patterns for cross-origin requests
- ✅ Local development configuration with pydantic-settings
- ✅ Testing patterns with TestClient
- ✅ Environment-based configuration best practices

**Sequential-Thinking Contributions:**
- ✅ Structured epic decomposition with clear dependencies
- ✅ Risk analysis (local first reduces deployment risk)
- ✅ Cost optimization strategy (validate before paying)

**Serena Contributions:**
- ✅ TNM AI codebase analysis (auth.ts, AccountLinkForm, Supabase functions)
- ✅ Existing component structure understanding
- ✅ Integration points identification

---

## Next Steps

1. ✅ **Epic Breakdown Complete** - Ready for implementation
2. ⏭ **Start Story 1.1** - Configure local Windows machine
3. ⏭ **Week 1-3:** Build & test locally on Windows machine
4. ⏭ **Week 4:** Provision VPS & migrate (only when local works perfectly)
5. ⏭ **Week 5-8:** Add growth features on production VPS
6. 🎯 **Architecture Workflow (Optional):** Run `workflow architecture` for technical architecture document

---

_For implementation: Use the `create-story` workflow to generate detailed implementation plans for each story. Start with Story 1.1 and work sequentially through Epic 1 before moving to Epic 2._

**Local Development Quick Start:**
1. Configure Windows machine (Story 1.1)
2. Install MT5 Terminal (Story 1.2)
3. Set up Python environment (Story 1.3)
4. Create FastAPI project with CORS (Story 1.4)
5. Test connectivity from Mac (Story 1.8)
6. Begin Epic 2 implementation 🚀

