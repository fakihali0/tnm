# connect-mt5-account Edge Function

**Story:** 4-1: Update connect-mt5-account Edge Function  
**Status:** ✅ Refactored to use Python MT5 Service

## Overview

This Supabase Edge Function handles MT5 account connection requests from the frontend. It has been refactored to call the Python MT5 Integration Service instead of MetaAPI.

## Flow

1. **Authentication:** Validates user JWT token
2. **Input Validation:** Validates login, password, server, broker_name
3. **MT5 Service Call:** Posts to `{MT5_SERVICE_URL}/api/mt5/connect` with retry logic
4. **Credential Encryption:** Encrypts password using AES-256-GCM
5. **Database Persistence:** 
   - Inserts record into `trading_accounts`
   - Stores encrypted credentials in `account_integrations`
6. **Response:** Returns account details or error

## Request Schema

```typescript
POST /connect-mt5-account

Headers:
  Authorization: Bearer <user_jwt_token>
  Content-Type: application/json

Body:
{
  "login": "12345678",
  "password": "SecureP@ss123",
  "server": "Broker-Demo",
  "broker_name": "Broker Name Ltd"
}
```

## Response Schema

### Success (200 OK)
```json
{
  "success": true,
  "account": {
    "id": "uuid-v4",
    "platform": "MT5",
    "broker_name": "Broker Company",
    "server": "Broker-Demo",
    "login": "12345678",
    "balance": 10000.00,
    "equity": 10000.00,
    "currency": "USD",
    "trade_mode": "DEMO"
  }
}
```

### Error (500)
```json
{
  "success": false,
  "error": "Sanitized error message"
}
```

## Environment Variables

Required environment variables (set via `supabase secrets set`):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | `eyJhbG...` |
| `MT5_SERVICE_URL` | Python MT5 service base URL | `http://localhost:8000` or ngrok URL |
| `MT5_SERVICE_API_KEY` | API key for MT5 service | From Story 3-1 |
| `CREDENTIAL_ENCRYPTION_KEY` | AES-256 encryption key (base64) | From Story 7-1 |

## Features

### Input Validation
- Login: 3-50 characters
- Password: 4-100 characters
- Server: 3-100 characters
- Broker name: 2-100 characters

### Retry Logic
- Single retry on timeout errors (AC requirement)
- 30-second timeout per request
- 1-second delay between retries

### Security
- Passwords never logged
- Credentials encrypted before storage (AES-256-GCM)
- Security events logged for auditing
- Error messages sanitized to prevent information disclosure
- Request IDs for tracing

### Error Handling
- Validation failures: No database writes
- MT5 connection failures: No database writes
- Database errors: Cleanup attempted
- All errors logged with request ID

## Local Testing

### Prerequisites
1. Python MT5 service running (Story 3-2 complete)
2. Supabase project configured
3. Environment variables set

### Setup

```bash
# Navigate to project root
cd d:/tnm/tnm_concept

# Create .env.edge file with required variables
cat > .env.edge << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MT5_SERVICE_URL=http://localhost:8000
MT5_SERVICE_API_KEY=your_mt5_api_key
CREDENTIAL_ENCRYPTION_KEY=your_base64_encryption_key
EOF

# Start the function locally
supabase functions serve connect-mt5-account --env-file .env.edge
```

### Test with curl

```bash
# Get user JWT token first (from Supabase Auth)
USER_TOKEN="your_user_jwt_token"

# Test connection
curl -X POST http://localhost:54321/functions/v1/connect-mt5-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "12345678",
    "password": "TestPassword123",
    "server": "Broker-Demo",
    "broker_name": "Test Broker"
  }'
```

### Test Success Path
```bash
# Ensure MT5 service is running
curl http://localhost:8000/health

# Test with valid credentials
curl -X POST http://localhost:54321/functions/v1/connect-mt5-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "valid_mt5_login",
    "password": "valid_password",
    "server": "Broker-Demo",
    "broker_name": "Broker Name"
  }'

# Expected: 200 OK with account details
```

### Test Failure Paths

#### 1. Missing Authentication
```bash
curl -X POST http://localhost:54321/functions/v1/connect-mt5-account \
  -H "Content-Type: application/json" \
  -d '{"login": "123", "password": "pass", "server": "srv", "broker_name": "bkr"}'

# Expected: 500 with "Missing Authorization header"
```

#### 2. Invalid Input
```bash
curl -X POST http://localhost:54321/functions/v1/connect-mt5-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "12",
    "password": "short",
    "server": "ab",
    "broker_name": "x"
  }'

# Expected: 500 with validation error
```

#### 3. Invalid MT5 Credentials
```bash
curl -X POST http://localhost:54321/functions/v1/connect-mt5-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "99999999",
    "password": "WrongPassword",
    "server": "InvalidServer",
    "broker_name": "Test Broker"
  }'

# Expected: 500 with sanitized error message
```

## Deployment

### Stage/Production

```bash
# Set secrets for production
supabase secrets set MT5_SERVICE_URL=https://mt5.tnm.com
supabase secrets set MT5_SERVICE_API_KEY=production_api_key
supabase secrets set CREDENTIAL_ENCRYPTION_KEY=production_encryption_key

# Deploy function
supabase functions deploy connect-mt5-account
```

### Verify Deployment

```bash
# Check function logs
supabase functions logs connect-mt5-account

# Test deployed function
curl -X POST https://your-project.supabase.co/functions/v1/connect-mt5-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Monitoring

### Security Events
All connection attempts are logged via `log_security_event` RPC:
- `mt5_connection_attempt`: Every connection attempt
- `mt5_connection_success`: Successful connections
- `mt5_connection_failed`: Failed connections

### Logs Include
- Request ID (for tracing)
- User ID
- Masked login (first 3 chars + ***)
- Server
- Broker name
- Timestamp
- User agent

### Query Logs
```sql
-- View recent connection attempts
SELECT * FROM security_events 
WHERE event_type LIKE 'mt5_connection_%' 
ORDER BY created_at DESC 
LIMIT 50;

-- Failed connections by user
SELECT user_id, COUNT(*) as failures
FROM security_events
WHERE event_type = 'mt5_connection_failed'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY failures DESC;
```

## Changes from MetaAPI Version

### Removed
- ❌ MetaAPI account creation
- ❌ MetaAPI deployment
- ❌ MetaAPI account polling
- ❌ `METAAPI_KEY` environment variable
- ❌ 30-second polling loop

### Added
- ✅ Direct MT5 service integration
- ✅ Single retry on timeout
- ✅ Request ID tracking
- ✅ Service role client for secure writes
- ✅ Transactional cleanup on integration error
- ✅ `mt5_service_account_id` field
- ✅ Provider changed to `mt5_direct`

### Improved
- 🔄 Faster response time (no polling)
- 🔄 Better error messages
- 🔄 Enhanced logging with request IDs
- 🔄 Atomic database operations

## Database Schema

### trading_accounts
```sql
id: uuid (PK)
user_id: uuid (FK -> profiles)
platform: varchar (MT5)
broker_name: varchar
server: varchar
login_number: varchar
account_name: varchar
balance: decimal
equity: decimal
margin: decimal
free_margin: decimal
margin_level: decimal
currency: varchar
leverage: integer
is_active: boolean
connection_status: varchar
mt5_service_account_id: varchar (NEW)
last_sync_at: timestamp
```

### account_integrations
```sql
id: uuid (PK)
account_id: uuid (FK -> trading_accounts)
provider: varchar (mt5_direct)
external_account_id: varchar
encrypted_credentials: text
encryption_key_id: varchar
credentials: jsonb (stores IV)
```

## Acceptance Criteria Status

✅ **AC1:** Accepts and validates login, password, server, broker_name; removes MetaAPI logic  
✅ **AC2:** Calls Python service with X-API-Key header and retry logic  
✅ **AC3:** Encrypts password, inserts trading_accounts and account_integrations  
✅ **AC4:** Failed validations/errors don't write to database; includes logging  
✅ **AC5:** Configurable via MT5_SERVICE_URL and MT5_SERVICE_API_KEY  
✅ **AC6:** Manual testing via supabase functions serve

## Known Limitations

1. **Encryption Key:** Requires Story 7-1 encryption key to be properly configured
2. **Database Schema:** Requires `mt5_service_account_id` column in `trading_accounts`
3. **Service Availability:** Depends on Python MT5 service being accessible
4. **Single Retry:** Only retries once on timeout (as per AC)

## Next Steps

- Story 4-2: Update sync-trading-data function
- Story 4-3: Database schema migrations
- Story 7-1: Complete encryption key management (if not done)

## References

- Story 3-2: POST /api/mt5/connect endpoint
- Story 7-1: AES-256 encryption helper
- PRD: MT5 Integration Service Function Specifications
