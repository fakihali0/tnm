# Product Requirements Document: MT5 Integration Service

**Project:** TNM AI - MT5 Integration Service  
**Version:** 1.0.0  
**Date:** November 12, 2025  
**Author:** AF (with BMad Master)  
**Status:** Draft

---

## Executive Summary

TNM AI platform requires a self-hosted MT5 (MetaTrader 5) integration service to replace the discontinued MetaAPI integration. This service will enable 200-300 traders to connect their MT5 accounts for real-time data synchronization, enabling AI-powered trading insights, risk monitoring, and performance analytics.

### The Product Magic ✨

**"A cost-effective, self-hosted bridge that transforms traders' MT5 data into instant AI-powered insights, at 1/25th the cost of commercial alternatives"**

The service delivers real-time position monitoring, instant balance updates, and seamless AI analysis - all while maintaining full data privacy and control at just $16-32/month operating cost.

---

## 1. Vision & Alignment

### 1.1 Vision Statement

Create a reliable, secure, and cost-effective MT5 integration that enables TNM AI to deliver real-time trading insights to 200-300 concurrent users without dependency on expensive third-party APIs.

### 1.2 Project Classification

- **Project Type:** Backend Service / REST API / WebSocket Service
- **Domain:** Financial Trading (FinTech)
- **Complexity:** Medium-High
- **Regulatory Context:** Financial data handling, credential security

### 1.3 Context & Background

**Current State:**
- TNM AI has MT5 integration disabled since January 2025
- Previous MetaAPI integration removed due to high costs ($800/month for 300 users)
- Database structure preserved (trading_accounts, trades tables intact)
- Frontend components exist but disabled
- Users cannot sync live trading data

**Opportunity:**
- Python MetaTrader5 package enables direct MT5 connection
- Windows VPS costs $16-32/month (vs $800 with MetaAPI)
- 25x cost reduction while maintaining full control
- Better data privacy and customization

### 1.4 Product Brief Reference

Context gathered from:
- Cost Analysis Document: `/docs/technical/MT5-INTEGRATION-COST-ANALYSIS.md`
- MetaAPI Removal Documentation: `/tnm_concept/METAAPI_REMOVED.md`
- Existing TNM AI architecture analysis

---

## 2. Success Criteria

### 2.1 Primary Success Metrics

**Technical Success:**
- ✅ Support 200-300 concurrent user accounts
- ✅ < 2 second response time for account data requests
- ✅ 99.5% uptime during trading hours (Mon-Fri 00:00-23:00 UTC)
- ✅ Zero credential leaks or security breaches
- ✅ < 1 second latency for WebSocket real-time updates

**Business Success:**
- ✅ Monthly operating cost ≤ $32 (target: $16-20)
- ✅ Cost per user ≤ $0.11/month
- ✅ 25x cost reduction vs MetaAPI maintained
- ✅ 80%+ user adoption within 3 months of launch

**User Success:**
- ✅ Users can connect MT5 accounts in < 2 minutes
- ✅ Real-time position updates visible on dashboard
- ✅ AI insights generated from live trading data
- ✅ Zero user-reported data sync failures

### 2.2 Key Performance Indicators (KPIs)

**Operational Metrics:**
- Account connection success rate: > 95%
- Data sync reliability: > 99%
- Average sync cycle time: < 30 seconds
- WebSocket connection stability: > 99%
- MT5 API call success rate: > 98%

**User Experience Metrics:**
- Account setup completion rate: > 90%
- Active connected accounts: > 200 within Q1 2026
- User-reported sync issues: < 5 per month
- Real-time update delivery: < 1 second lag

### 2.3 Definition of "Launch Ready"

Service is production-ready when:
1. All REST API endpoints operational with < 2s response time
2. WebSocket real-time updates functional for 50+ concurrent users
3. Credential encryption and security audit passed
4. Load tested with 300 simulated accounts
5. Monitoring and alerting system operational
6. Frontend integration complete and tested
7. Documentation complete (API docs, deployment guide)
8. Disaster recovery procedure documented and tested

---

## 3. Scope Definition

### 3.1 MVP Scope (Phase 1 - Weeks 1-4)

**Must Have for Launch:**

**Core MT5 Service (Windows VPS):**
- ✅ Python FastAPI service with MT5 connection management
- ✅ REST API endpoints for account operations
- ✅ Connection pooling (20 active connections)
- ✅ Credential encryption (AES-256)
- ✅ Basic error handling and logging

**Essential API Endpoints:**
- `POST /api/mt5/connect` - Test and validate MT5 account credentials
- `GET /api/mt5/account/{id}/info` - Retrieve account balance, equity, margin
- `GET /api/mt5/account/{id}/positions` - Get open positions
- `GET /api/mt5/account/{id}/history` - Fetch historical trades (30 days)
- `GET /health` - Service health check

**Supabase Integration:**
- Re-enable `connect-mt5-account` edge function
- Update `sync-trading-data` edge function
- Scheduled sync every 5 minutes
- Database updates for trades table

**Frontend Updates:**
- Re-enable AccountLinkForm component
- Update auth store (removetemporary unavailable messages)
- Display synced account data
- Show sync status and last update time

**Security Essentials:**
- API key authentication
- Encrypted credential storage
- HTTPS/TLS for all communications
- Rate limiting (100 requests/minute per user)

**Deployment:**
- Windows VPS setup (Contabo/Hetzner)
- MT5 Terminal installation (headless mode)
- Python service deployment
- Nginx reverse proxy
- Basic monitoring (UptimeRobot)

### 3.2 Growth Features (Phase 2 - Weeks 5-8)

**Real-time Updates:**
- ✅ WebSocket endpoint `/ws/account/{id}`
- ✅ Live position monitoring (1-second polling)
- ✅ Change detection and push notifications
- ✅ Balance update alerts
- ✅ New trade notifications

**Advanced Caching:**
- ✅ Redis integration for frequently accessed data
- ✅ Smart cache invalidation
- ✅ Reduced MT5 API calls

**Enhanced Monitoring:**
- ✅ Grafana + Prometheus dashboards
- ✅ Performance metrics tracking
- ✅ Error rate monitoring
- ✅ Resource utilization alerts

**Multi-Broker Support:**
- ✅ Broker-specific configuration handling
- ✅ Server list management
- ✅ Connection optimization per broker

### 3.3 Vision Features (Phase 3 - Future)

**Advanced Features:**
- Multi-region deployment (US, EU, Asia VPS)
- Automatic failover and load balancing
- Historical data export (CSV/JSON)
- Advanced analytics and reporting API
- Trading signal detection
- Custom alert rules engine

**Enterprise Features:**
- White-label API for third parties
- Multi-tenancy for B2B
- SLA guarantees and premium support
- Compliance reporting tools

### 3.4 Explicitly Out of Scope

**Not Included:**
- ❌ Trading execution (read-only access via investor passwords)
- ❌ Order placement or modification
- ❌ MT4 support (MT5 only for MVP)
- ❌ Direct broker integrations (only MT5 terminal)
- ❌ Mobile app (web-only initially)
- ❌ Historical data beyond 6 months
- ❌ Third-party analytics integrations (initially)

---

## 4. Domain-Specific Considerations

### 4.1 Financial Trading Domain Requirements

**Regulatory Compliance:**
- Service handles trading data (not executing trades - lower regulatory burden)
- Investor passwords only (read-only access)
- No fund transfers or order placement
- User responsible for broker compliance

**Data Sensitivity:**
- Trading account credentials (high sensitivity)
- Account balances and P&L (personal financial data)
- Position information (trading strategy data)
- Historical performance data

**Industry Standards:**
- FIX Protocol awareness (not implementing, but understanding data structures)
- MT5 API conventions and limitations
- Broker-specific requirements and rate limits

### 4.2 Security Requirements (Financial Data)

**Credential Protection:**
- AES-256 encryption for passwords at rest
- TLS 1.3 for data in transit
- Investor passwords only (never full access passwords)
- Credential rotation support

**Access Control:**
- User can only access their own accounts
- JWT-based authentication
- API key rotation capability
- Audit logging for all credential access

**Data Privacy:**
- GDPR-compliant data handling
- Right to deletion (remove account data)
- Data retention policies (6 months historical)
- No sharing of trading data with third parties

### 4.3 MT5 Platform Constraints

**Technical Limitations:**
- MT5 Terminal required (Windows-only)
- Connection limits per broker server
- API call rate limits (vary by broker)
- Data refresh intervals (tick-based)

**Broker Variability:**
- Different servers per broker
- Varying connection stability
- Different data formats
- Symbol naming conventions differ

---

## 5. Backend Service Architecture Requirements

### 5.1 Python FastAPI Service Specifications

**Core Service Components:**

**Connection Manager:**
- Maintain pool of 20 active MT5 connections
- Dynamic account switching via `mt5.login()`
- Connection timeout after 5 minutes of inactivity
- Automatic reconnection on failure
- Connection state tracking per account

**Request Handler:**
- Async/await for non-blocking operations
- Request queuing for high load
- Graceful degradation under stress
- Circuit breaker pattern for broker failures

**Data Transformer:**
- MT5 native format → standardized JSON
- Timezone normalization (broker time → UTC)
- Symbol name standardization
- Currency conversion support

**Cache Layer:**
- In-memory cache for hot data (< 30 seconds old)
- Redis integration for distributed caching
- Cache invalidation on data changes
- Configurable TTL per data type

### 5.2 REST API Endpoint Specifications

#### **5.2.1 Account Connection**

**POST /api/mt5/connect**

*Purpose:* Test MT5 account credentials and establish connection

*Request Body:*
```json
{
  "user_id": "uuid",
  "login": 12345678,
  "password": "investor_password",
  "server": "BrokerName-Server",
  "broker_name": "Broker Inc."
}
```

*Response (Success):*
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

*Response (Failure):*
```json
{
  "success": false,
  "error_code": "AUTH_FAILED",
  "error_message": "Invalid credentials or server unreachable",
  "details": "MT5 login returned error code 10004"
}
```

*Validation Rules:*
- Login must be positive integer
- Password minimum 6 characters
- Server must match known broker servers
- Test connection within 10 seconds or timeout

---

#### **5.2.2 Account Information**

**GET /api/mt5/account/{account_id}/info**

*Purpose:* Retrieve current account state (balance, equity, margin)

*Headers:*
- `Authorization: Bearer {supabase_jwt}`
- `X-API-Key: {service_api_key}`

*Response:*
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

*Performance:*
- Target response time: < 1 second (fresh data)
- Target response time: < 100ms (cached data)
- Cache TTL: 30 seconds

---

#### **5.2.3 Open Positions**

**GET /api/mt5/account/{account_id}/positions**

*Purpose:* Get all currently open positions

*Query Parameters:*
- `symbols` (optional): Filter by symbols (comma-separated)
- `type` (optional): Filter by type (buy/sell)

*Response:*
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

*Performance:*
- Target response time: < 500ms
- Cache TTL: 5 seconds for active trading

---

#### **5.2.4 Historical Trades**

**GET /api/mt5/account/{account_id}/history**

*Purpose:* Retrieve closed trades history

*Query Parameters:*
- `from_date`: Start date (ISO 8601, default: 30 days ago)
- `to_date`: End date (ISO 8601, default: now)
- `symbol` (optional): Filter by symbol
- `limit`: Max results (default: 100, max: 1000)
- `offset`: Pagination offset

*Response:*
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

*Performance:*
- Target response time: < 2 seconds
- Cache TTL: 5 minutes (historical data rarely changes)

---

#### **5.2.5 Sync Trigger**

**POST /api/mt5/account/{account_id}/sync**

*Purpose:* Manually trigger data synchronization to Supabase

*Request Body:*
```json
{
  "sync_type": "full",  // "full" or "incremental"
  "sync_history": true,
  "history_days": 30
}
```

*Response:*
```json
{
  "success": true,
  "sync_id": "sync_uuid",
  "started_at": "2025-11-12T10:30:00Z",
  "estimated_duration_seconds": 15,
  "status": "processing"
}
```

---

#### **5.2.6 Health & Status**

**GET /health**

*Purpose:* Service health check for monitoring

*Response:*
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

---

### 5.3 WebSocket Real-time Updates (Phase 2)

**WebSocket Endpoint: /ws/account/{account_id}**

*Connection:*
```javascript
ws://mt5-service.tnm.com/ws/account/{account_id}?token={jwt}
```

*Authentication:*
- JWT token in query parameter or WebSocket headers
- Connection rejected if invalid or expired

*Message Types:*

**1. Connection Acknowledged:**
```json
{
  "type": "connected",
  "account_id": "uuid",
  "monitoring_interval": "1s"
}
```

**2. Account Info Update:**
```json
{
  "type": "account_update",
  "timestamp": "2025-11-12T10:30:15Z",
  "changes": {
    "balance": {
      "old": 10000.00,
      "new": 10050.00,
      "diff": 50.00
    },
    "equity": {
      "old": 10020.00,
      "new": 10055.00
    }
  }
}
```

**3. Position Opened:**
```json
{
  "type": "position_opened",
  "timestamp": "2025-11-12T10:30:20Z",
  "position": {
    "ticket": 123456789,
    "symbol": "EURUSD",
    "type": "buy",
    "volume": 1.0,
    "price": 1.0850
  }
}
```

**4. Position Closed:**
```json
{
  "type": "position_closed",
  "timestamp": "2025-11-12T10:35:00Z",
  "ticket": 123456789,
  "close_price": 1.0865,
  "profit": 150.00
}
```

**5. Position Modified:**
```json
{
  "type": "position_modified",
  "timestamp": "2025-11-12T10:32:00Z",
  "ticket": 123456789,
  "changes": {
    "sl": {
      "old": 1.0800,
      "new": 1.0820
    }
  }
}
```

**6. Error Message:**
```json
{
  "type": "error",
  "error_code": "CONNECTION_LOST",
  "message": "MT5 connection lost, attempting reconnect",
  "retry_in_seconds": 5
}
```

**Heartbeat:**
- Client sends `{"type": "ping"}` every 30 seconds
- Server responds `{"type": "pong"}`
- Connection closed if no pong after 90 seconds

---

### 5.4 Authentication & Authorization

**Service-level Authentication:**
- API Key required for all endpoints
- Stored in environment variable `MT5_SERVICE_API_KEY`
- Validated on every request
- 401 Unauthorized if missing/invalid

**User-level Authorization:**
- Supabase JWT token required
- Validated via Supabase auth
- User can only access their own accounts
- Account ownership verified against `trading_accounts` table

**Request Flow:**
```
Client Request
    ↓
Verify API Key (service access)
    ↓
Verify JWT Token (user identity)
    ↓
Check Account Ownership (authorization)
    ↓
Process Request
```

---

### 5.5 Error Handling Strategy

**Error Categories:**

**1. MT5 Connection Errors:**
- Error codes: `MT5_INIT_FAILED`, `MT5_LOGIN_FAILED`, `MT5_DISCONNECTED`
- Action: Retry up to 3 times with exponential backoff
- User notification: "Unable to connect to trading account"

**2. Broker Server Errors:**
- Error codes: `BROKER_TIMEOUT`, `BROKER_UNAVAILABLE`, `BROKER_RATE_LIMIT`
- Action: Queue request for retry, return cached data if available
- User notification: "Broker server temporarily unavailable"

**3. Invalid Credentials:**
- Error code: `AUTH_FAILED`
- Action: Do not retry, mark account as needs re-authentication
- User notification: "Please verify your account credentials"

**4. Service Overload:**
- Error code: `SERVICE_OVERLOADED`
- Action: Return 503 with retry-after header
- Response: HTTP 503 with "Retry-After: 30"

**5. Invalid Request:**
- Error codes: `INVALID_ACCOUNT_ID`, `INVALID_PARAMETERS`
- Action: Return 400 Bad Request immediately
- No retry

**Standardized Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "MT5_CONNECTION_FAILED",
    "message": "Unable to establish connection to MT5 terminal",
    "details": "Connection timeout after 10 seconds",
    "retry_after_seconds": 30,
    "support_reference": "err_20251112_103045_abc123"
  }
}
```

---

## 6. Supabase Integration Requirements

### 6.1 Edge Functions Updates

**Function: connect-mt5-account**

*Purpose:* Handle new MT5 account connection from frontend

*Flow:*
1. Receive account credentials from frontend
2. Encrypt password using AES-256
3. Call Python service `/api/mt5/connect` to validate
4. If successful, store in `trading_accounts` table
5. Store encrypted credentials in `account_integrations` table
6. Return account_id to frontend

*Code Location:* `/supabase/functions/connect-mt5-account/index.ts`

*Required Updates:*
- Replace MetaAPI calls with Python service calls
- Add service URL configuration
- Update error handling
- Add retry logic

---

**Function: sync-trading-data**

*Purpose:* Scheduled sync of trading data from all active accounts

*Trigger:* Cron schedule (every 5 minutes)

*Flow:*
1. Query all active accounts from `trading_accounts`
2. For each account:
   - Call Python service `/api/mt5/account/{id}/info`
   - Call Python service `/api/mt5/account/{id}/positions`
   - Call Python service `/api/mt5/account/{id}/history?from_date={last_sync}`
3. Update `trading_accounts` table with latest balances
4. Insert/update `trades` table with positions and history
5. Update `last_sync_at` timestamp
6. Log sync results

*Code Location:* `/supabase/functions/sync-trading-data/index.ts`

*Required Updates:*
- Remove MetaAPI integration code
- Add Python service integration
- Implement batch processing (10 accounts per batch)
- Add error handling per account (one failure doesn't stop sync)
- Add sync status tracking

---

### 6.2 Database Schema Updates

**Table: trading_accounts (existing - modifications needed)**

```sql
ALTER TABLE trading_accounts
ADD COLUMN IF NOT EXISTS mt5_service_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_connection_error TEXT,
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS broker_server_time_offset INTEGER DEFAULT 0;

-- Index for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_trading_accounts_sync_status 
ON trading_accounts(is_active, connection_status, last_sync_at);
```

**Table: account_integrations (existing - ensure encrypted storage)**

```sql
-- Verify encryption is in place
-- encrypted_password column should store AES-256 encrypted value
-- Never store plain text passwords
```

**Table: sync_logs (new - optional but recommended)**

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

---

### 6.3 Row Level Security (RLS) Policies

**trading_accounts table:**
```sql
-- Users can only view their own accounts
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

**trades table:**
```sql
-- Users can only view trades from their accounts
CREATE POLICY "Users can view own trades"
ON trades FOR SELECT
USING (
  account_id IN (
    SELECT id FROM trading_accounts WHERE user_id = auth.uid()
  )
);
```

---

## 7. Frontend Integration Requirements

### 7.1 Component Updates

**Component: AccountLinkForm.tsx**

*Location:* `/src/components/tnm-pro/AccountLinkForm.tsx`

*Required Changes:*
- Remove "temporarily unavailable" alert banner
- Re-enable form submission
- Update submit handler to call Supabase edge function
- Add real-time connection status feedback
- Add broker server dropdown (populated from config)
- Add connection testing UI (loading spinner, success/error states)

*User Flow:*
1. User enters MT5 login number
2. User enters investor password
3. User selects broker from dropdown
4. User selects server from dropdown (filtered by broker)
5. Click "Test Connection" - validates without saving
6. If successful, click "Connect Account" - saves to database
7. Show success message with account balance

---

**Component: LinkedAccountsList.tsx**

*Location:* `/src/components/tnm-pro/LinkedAccountsList.tsx`

*Required Changes:*
- Remove "live synchronization disabled" info alert
- Add sync status indicators (last sync time, next sync in X minutes)
- Add manual sync button per account
- Add real-time connection status badge (connected/disconnected/error)
- Add "View Details" modal showing account info

---

**Component: AIHub / UnifiedAIHub**

*Location:* `/src/components/tnm-pro/AIHub.tsx`

*Required Changes:*
- Display real-time account data
- Show live position updates
- Enable WebSocket connection when user opens dashboard
- Add real-time P&L updates
- Show sync status indicator

---

### 7.2 State Management Updates

**Store: auth.ts (useAccountStore)**

*Location:* `/src/store/auth.ts`

*Required Changes:*

```typescript
// Update addAccount method
addAccount: async (accountData) => {
  set({ isConnecting: true });
  
  try {
    // Call Supabase edge function
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

---

### 7.3 New Hooks

**Hook: useRealtimeMT5Data**

*Purpose:* WebSocket connection for real-time updates

```typescript
export const useRealtimeMT5Data = (accountId: string) => {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;

    const ws = new WebSocket(
      `wss://${MT5_SERVICE_URL}/ws/account/${accountId}?token=${getAuthToken()}`
    );

    ws.onopen = () => {
      console.log('Connected to MT5 real-time feed');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'account_update':
          setAccountData(prev => ({ ...prev, ...message.changes }));
          break;
        case 'position_opened':
          toast.success(`New position opened: ${message.position.symbol}`);
          break;
        case 'position_closed':
          toast.info(`Position closed: Profit ${message.profit}`);
          break;
        case 'error':
          setError(message.message);
          break;
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        // Reconnect logic
      }, 5000);
    };

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      ws.close();
    };
  }, [accountId]);

  return { accountData, isConnected, error };
};
```

---

## 8. Non-Functional Requirements

### 8.1 Performance Requirements

**Response Time Targets:**
- Account connection test: < 5 seconds
- Account info retrieval: < 1 second (fresh), < 100ms (cached)
- Position retrieval: < 500ms
- Historical data (30 days): < 2 seconds
- Health check: < 100ms

**Throughput:**
- Minimum 100 requests/second sustained
- Peak 300 requests/second for 5 minutes
- Support 300 concurrent WebSocket connections

**Resource Efficiency:**
- CPU usage < 70% under normal load
- Memory usage < 12 GB (out of 16 GB available)
- Disk I/O < 50 MB/s
- Network bandwidth < 10 Mbps

**Scalability:**
- Single VPS handles 300 users (Phase 1)
- Horizontal scaling to 3 VPS for 900 users (Phase 3)
- Database queries < 50ms with proper indexing

---

### 8.2 Security Requirements

**Authentication:**
- API key authentication for service access
- JWT token authentication for user requests
- API key rotation capability (monthly recommended)
- Failed authentication attempts logged

**Credential Protection:**
- AES-256 encryption for passwords at rest
- TLS 1.3 for all communications
- Investor passwords only (never full access)
- Credentials never logged or exposed in errors
- Automatic credential sanitization in logs

**Access Control:**
- Users can only access their own accounts
- Row Level Security (RLS) enforced in Supabase
- Service-to-service API key separate from user auth
- Admin access requires separate authentication

**Data Protection:**
- All PII encrypted at rest
- Trading data encrypted in transit
- Secure key management (environment variables)
- Regular security audits (quarterly)

**Compliance:**
- GDPR-compliant data handling
- Right to deletion implemented
- Data retention policy enforced (6 months)
- Audit logging for all data access

---

### 8.3 Reliability & Availability Requirements

**Uptime Target:**
- 99.5% availability during trading hours (Mon-Fri 00:00-23:00 UTC)
- Planned maintenance windows on weekends only
- Maximum 3.6 hours downtime per month

**Fault Tolerance:**
- Automatic service restart on crash
- Connection retry logic (3 attempts with exponential backoff)
- Graceful degradation (serve cached data if MT5 unavailable)
- Circuit breaker pattern for broker failures

**Disaster Recovery:**
- Daily database backups
- Weekly VPS snapshots
- Recovery Time Objective (RTO): < 2 hours
- Recovery Point Objective (RPO): < 15 minutes
- Documented recovery procedures

**Monitoring & Alerting:**
- Service health checks every 60 seconds
- Alert on service down > 2 minutes
- Alert on error rate > 5%
- Alert on CPU > 80% for > 5 minutes
- Alert on memory > 90%
- Alert on disk space < 20 GB

---

### 8.4 Operational Requirements

**Logging:**
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Log rotation (daily, keep 30 days)
- Request logging (excluding sensitive data)
- Error logging with stack traces
- Performance metrics logging

**Monitoring Tools:**
- UptimeRobot for external monitoring
- Grafana + Prometheus for metrics (Phase 2)
- Sentry for error tracking (optional)
- Custom dashboard for key metrics

**Deployment:**
- Zero-downtime deployments
- Rollback capability within 5 minutes
- Health check before routing traffic
- Automated deployment pipeline (GitHub Actions)

**Maintenance:**
- Weekly security updates
- Monthly dependency updates
- Quarterly security audits
- Annual penetration testing

---

### 8.5 Data Retention & Privacy

**Data Retention Policy:**
- Active account data: Retained while account active
- Historical trades: 6 months from close date
- Sync logs: 30 days
- Error logs: 90 days
- User can request full data export (CSV/JSON)
- User can request account deletion (GDPR right to erasure)

**Data Deletion:**
- On account disconnect: Mark inactive, retain 30 days
- On user deletion: Permanent deletion within 24 hours
- On request: Export data, then delete within 7 days

---

## 9. Integration Requirements

### 9.1 TNM AI Platform Integration

**Supabase Edge Functions:**
- `connect-mt5-account`: Handle new account connections
- `sync-trading-data`: Scheduled sync (every 5 minutes)
- `disconnect-mt5-account`: Handle account disconnection
- All functions call Python MT5 service

**Database Integration:**
- Read/write to `trading_accounts` table
- Read/write to `trades` table
- Read/write to `account_integrations` table
- Respect Row Level Security policies

**Frontend Integration:**
- React components updated
- State management (Zustand) updated
- Real-time hooks added
- WebSocket connection management

---

### 9.2 External Service Dependencies

**MT5 Terminal:**
- Windows-based application
- Must be running for service to work
- Headless mode (no GUI required)
- Connection to broker servers

**Broker Servers:**
- External dependency (not controlled by us)
- Varying availability and performance
- Must handle broker downtime gracefully

**Redis Cache (Phase 2):**
- Upstash Redis (cloud) or self-hosted
- Used for distributed caching
- Optional but recommended for performance

---

### 9.3 MCP Server Integration (Development)

**Context7 MCP:**
- Used during development for retrieving relevant patterns
- Access to trading domain knowledge
- API integration examples

**Sequential Thinking MCP:**
- Used for structured problem-solving during development
- Architecture decision documentation
- Complex logic design

**Serena MCP:**
- IDE assistance during implementation
- Code generation and refactoring
- Testing assistance

*Note: MCP servers are development tools, not runtime dependencies*

---

## 10. Testing Requirements

### 10.1 Unit Testing

**Python Service:**
- Test connection manager logic
- Test API endpoint handlers
- Test data transformation functions
- Test error handling scenarios
- Coverage target: > 80%

**Supabase Edge Functions:**
- Test edge function logic
- Mock Python service calls
- Test database operations
- Test authentication/authorization

**Frontend Components:**
- Test component rendering
- Test user interactions
- Test state management
- Test WebSocket connection handling

---

### 10.2 Integration Testing

**End-to-End Flows:**
- Account connection flow (frontend → Supabase → Python → MT5)
- Data sync flow (scheduled job)
- Real-time update flow (WebSocket)
- Error handling flows

**Load Testing:**
- Simulate 300 concurrent users
- Measure response times under load
- Test connection pool efficiency
- Identify bottlenecks

---

### 10.3 Security Testing

**Penetration Testing:**
- API endpoint security
- Authentication bypass attempts
- SQL injection attempts
- XSS/CSRF testing

**Credential Security:**
- Verify encryption at rest
- Verify TLS in transit
- Test credential leak scenarios
- Audit logging verification

---

## 11. Deployment & DevOps

### 11.1 Infrastructure Requirements

**Windows VPS Specifications:**
- Provider: Contabo or Hetzner
- OS: Windows Server 2022 Core (or Standard)
- CPU: 4-6 vCores
- RAM: 16 GB
- Storage: 200-400 GB SSD
- Network: 1 Gbps
- Location: EU or US (choose based on user base)

**Software Stack:**
- Python 3.11+
- MT5 Terminal (latest version)
- Redis (optional, Phase 2)
- Nginx (reverse proxy)
- Certbot (SSL certificates)

---

### 11.2 Deployment Strategy

**Initial Deployment:**
1. Provision Windows VPS
2. Install MT5 Terminal
3. Configure MT5 for headless operation
4. Install Python and dependencies
5. Deploy FastAPI service
6. Configure Nginx reverse proxy
7. Set up SSL certificate (Let's Encrypt)
8. Configure firewall (only ports 443, 22)
9. Set up monitoring
10. Deploy Supabase edge functions
11. Update frontend environment variables
12. Run smoke tests
13. Go live

**CI/CD Pipeline:**
- GitHub Actions for automated testing
- Automated deployment on merge to main
- Health check before routing traffic
- Automatic rollback on failure

---

### 11.3 Environment Configuration

**Environment Variables (Python Service):**
```
MT5_SERVICE_API_KEY=<secure_api_key>
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=<anon_key>
REDIS_URL=redis://localhost:6379 (optional)
LOG_LEVEL=INFO
ENVIRONMENT=production
MT5_CONNECTION_POOL_SIZE=20
MT5_CONNECTION_TIMEOUT=300
CACHE_TTL_SECONDS=30
```

**Environment Variables (Supabase):**
```
MT5_SERVICE_URL=https://mt5.tnm.com
MT5_SERVICE_API_KEY=<same_as_above>
ENCRYPTION_KEY=<aes256_key>
```

**Environment Variables (Frontend):**
```
VITE_MT5_SERVICE_WS=wss://mt5.tnm.com/ws
VITE_ENABLE_REALTIME=true
```

---

## 12. Documentation Requirements

**Technical Documentation:**
- API reference (OpenAPI/Swagger spec)
- Architecture diagram
- Database schema documentation
- Deployment guide
- Troubleshooting guide

**User Documentation:**
- How to connect MT5 account
- Supported brokers list
- FAQ
- Security best practices
- Data retention policy

**Developer Documentation:**
- Setup instructions (local development)
- Code structure overview
- Testing guide
- Contributing guidelines

---

## 13. Success Metrics & KPIs

### 13.1 Technical KPIs

**Performance Metrics:**
- Average API response time: < 1s target
- P95 response time: < 2s
- WebSocket message latency: < 1s
- Service uptime: > 99.5%
- Error rate: < 1%

**Resource Metrics:**
- CPU utilization: < 70% average
- Memory usage: < 12 GB
- Active connections: track trend
- Cache hit rate: > 80% (Phase 2)

---

### 13.2 Business KPIs

**Adoption Metrics:**
- Connected accounts: 200+ within Q1 2026
- Active users (daily): > 50
- User retention: > 85% after 30 days

**Cost Metrics:**
- Monthly operating cost: ≤ $32
- Cost per user: ≤ $0.11/month
- Cost savings vs MetaAPI: > $750/month

---

### 13.3 User Experience KPIs

**Onboarding:**
- Account connection success rate: > 95%
- Time to first successful connection: < 3 minutes
- Connection abandonment rate: < 10%

**Satisfaction:**
- User-reported sync issues: < 5/month
- Support tickets: < 10/month
- Feature adoption rate: > 60% use real-time

---

## 14. Risks & Mitigations

### 14.1 Technical Risks

**Risk: Windows VPS Downtime**
- Impact: High - Service unavailable
- Probability: Low (99.9% uptime SLA)
- Mitigation: 
  - Choose reliable provider (Contabo/Hetzner)
  - Set up monitoring and alerts
  - Maintain backup VPS (Phase 3)
  - Document recovery procedures

**Risk: MT5 Terminal Crash**
- Impact: High - No data sync
- Probability: Medium
- Mitigation:
  - Process monitoring (systemd)
  - Automatic restart on crash
  - Health check endpoint
  - Graceful degradation (serve cached data)

**Risk: Broker Server Issues**
- Impact: Medium - Specific accounts affected
- Probability: Medium
- Mitigation:
  - Per-account error handling
  - Don't cascade failures
  - Retry logic with backoff
  - User notification

---

### 14.2 Security Risks

**Risk: Credential Breach**
- Impact: Critical - User accounts compromised
- Probability: Low
- Mitigation:
  - Use investor passwords only (read-only)
  - AES-256 encryption at rest
  - TLS 1.3 in transit
  - Regular security audits
  - Immediate incident response plan

**Risk: API Key Leak**
- Impact: High - Unauthorized service access
- Probability: Low
- Mitigation:
  - Environment variable storage
  - Never commit to Git
  - API key rotation capability
  - Rate limiting
  - IP whitelisting option

---

### 14.3 Business Risks

**Risk: User Adoption Below Target**
- Impact: Medium - Lower ROI
- Probability: Low
- Mitigation:
  - Clear user onboarding
  - Excellent documentation
  - Responsive support
  - Gradual rollout with feedback

**Risk: Broker Compatibility Issues**
- Impact: Medium - Some users can't connect
- Probability: Medium
- Mitigation:
  - Test with major brokers
  - Maintain broker compatibility list
  - Provide troubleshooting guide
  - User-reported broker support

---

## 15. Timeline & Milestones

### Phase 1: MVP (Weeks 1-4)

**Week 1: Python Service Core**
- Day 1-2: VPS setup, MT5 installation
- Day 3-5: FastAPI service structure, connection manager
- Day 6-7: Core API endpoints (connect, info, positions)

**Week 2: Supabase Integration**
- Day 8-10: Update edge functions
- Day 11-12: Database schema updates
- Day 13-14: End-to-end testing

**Week 3: Frontend Updates**
- Day 15-17: Re-enable AccountLinkForm
- Day 18-19: Update state management
- Day 20-21: Integration testing

**Week 4: Testing & Launch**
- Day 22-24: Load testing, security testing
- Day 25-26: Bug fixes, optimization
- Day 27-28: Documentation, deployment
- **Launch: Day 28**

---

### Phase 2: Real-time & Optimization (Weeks 5-8)

**Week 5-6: WebSocket Implementation**
- WebSocket endpoint
- Real-time monitoring
- Change detection
- Frontend hooks

**Week 7: Redis Caching**
- Redis integration
- Cache strategy
- Performance optimization

**Week 8: Monitoring & Docs**
- Grafana/Prometheus setup
- Complete documentation
- User guides

---

### Phase 3: Scale & Enterprise (Future)

- Multi-region deployment
- Load balancing
- Advanced features
- Enterprise tier

---

## 16. Appendices

### Appendix A: Glossary

**MT5 (MetaTrader 5):** Trading platform used by retail forex/CFD traders  
**Investor Password:** Read-only password for MT5 account (cannot place trades)  
**Broker:** Financial institution providing MT5 trading services  
**Position:** Open trade in the market  
**Equity:** Account balance + floating P&L  
**Margin:** Collateral required to maintain open positions  
**Free Margin:** Available funds for new positions  
**Pips:** Smallest price movement in currency pairs  
**Swap:** Overnight interest on positions held past market close  
**WebSocket:** Protocol for bidirectional real-time communication

---

### Appendix B: Reference Documents

- Cost Analysis: `/docs/technical/MT5-INTEGRATION-COST-ANALYSIS.md`
- MetaAPI Removal: `/tnm_concept/METAAPI_REMOVED.md`
- TNM AI Architecture: Project README
- Supabase Documentation: https://supabase.com/docs
- MetaTrader5 Python: https://pypi.org/project/MetaTrader5/

---

### Appendix C: Decision Log

**Decision 1: Self-hosted vs SaaS**
- **Chosen:** Self-hosted Python service
- **Rationale:** 25x cost reduction, full control, data privacy
- **Trade-off:** More operational overhead

**Decision 2: WebSocket vs Long Polling**
- **Chosen:** WebSocket for real-time (Phase 2)
- **Rationale:** Better performance, lower latency
- **Trade-off:** More complex implementation

**Decision 3: Single VPS vs Multi-region**
- **Chosen:** Single VPS for MVP
- **Rationale:** Sufficient for 300 users, simpler to manage
- **Trade-off:** Single point of failure (acceptable for MVP)

**Decision 4: REST + WebSocket Hybrid**
- **Chosen:** Both patterns
- **Rationale:** REST for reliability, WebSocket for real-time
- **Trade-off:** More code to maintain

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-12 | AF + BMad Master | Initial PRD creation |

**Approval:**

- Product Owner: AF
- Technical Lead: [To be assigned]
- Security Review: [Pending]
- Final Approval: [Pending]

**Next Steps:**

1. ✅ PRD Review & Approval
2. ⏭ Run Epic Breakdown workflow (`workflow create-epics-and-stories`)
3. ⏭ Run Architecture workflow (`workflow architecture`)
4. ⏭ Begin Phase 1 implementation

---

**End of Document**
