# sync-trading-data Edge Function

**Story:** 4-2: Update sync-trading-data Edge Function  
**Status:** ✅ Refactored to use Python MT5 Service

## Overview

This Supabase Edge Function orchestrates periodic synchronization of MT5 account data. It processes all active trading accounts in batches, fetching account info, positions, and historical trades from the Python MT5 service and persisting them to Supabase.

## Flow

1. **Load Active Accounts:** Query all `trading_accounts` where `is_active = true`
2. **Batch Processing:** Process accounts in batches of 10 using `Promise.allSettled`
3. **For Each Account:**
   - Fetch account info (balance, equity, margin)
   - Fetch open positions
   - Fetch historical trades since last sync
4. **Persist Data:**
   - Update `trading_accounts` with latest balances
   - Upsert positions into `trades` table
   - Insert new historical trades
5. **Log Results:** Write sync outcomes to `sync_logs` table
6. **Error Handling:** Account failures don't stop other accounts from syncing

## Scheduling

This function is designed to run every 5 minutes via Supabase Cron:

```
0 */5 * * *
```

### Configure Cron (Supabase Dashboard)
1. Go to Edge Functions → sync-trading-data
2. Click "Enable Cron"
3. Set schedule: `0 */5 * * *`
4. Save

### Configure Cron (CLI)
```bash
# Deploy with cron schedule
supabase functions deploy sync-trading-data --no-verify-jwt

# Then set schedule in dashboard or via API
```

## Request Schema

This function is typically invoked by Supabase Cron, but can be manually triggered:

```bash
# Manual invocation (no auth required for cron functions)
curl -X POST https://your-project.supabase.co/functions/v1/sync-trading-data
```

## Response Schema

### Success Response
```json
{
  "success": true,
  "executionId": "uuid-v4",
  "totalAccounts": 25,
  "successCount": 23,
  "failureCount": 1,
  "partialCount": 1,
  "duration_ms": 12450,
  "syncResults": [
    {
      "account_id": "uuid",
      "status": "success",
      "started_at": "2025-01-15T10:30:00.000Z",
      "completed_at": "2025-01-15T10:30:02.150Z",
      "duration_ms": 2150,
      "trades_synced": 15
    },
    {
      "account_id": "uuid",
      "status": "failed",
      "started_at": "2025-01-15T10:30:00.000Z",
      "completed_at": "2025-01-15T10:30:01.500Z",
      "duration_ms": 1500,
      "trades_synced": 0,
      "error_message": "Failed to fetch account info: Connection timeout"
    }
  ]
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | `eyJhbG...` |
| `MT5_SERVICE_URL` | Python MT5 service base URL | `https://mt5.tnm.com` |
| `MT5_SERVICE_API_KEY` | API key for MT5 service | From Story 3-1 |

## Features

### Batch Processing
- **Batch Size:** 10 accounts per batch
- **Concurrency:** `Promise.allSettled` for parallel processing
- **Isolation:** Failure of one account doesn't affect others
- **Throttling:** 100ms delay between batches

### Resilient Sync
- **Partial Success:** Account sync can partially succeed (e.g., info fetched but positions failed)
- **Error Tracking:** Errors logged per account in `sync_logs`
- **Failure Counter:** `sync_failure_count` incremented on errors
- **Last Error:** `last_connection_error` stores error message

### Data Integrity
- **Upserts:** Positions upserted by `ticket` to avoid duplicates
- **History:** Only new trades since `last_sync_at` are fetched
- **Atomic Updates:** Account balance updated only if info fetch succeeds

### Performance
- **Timeout:** 30-second timeout per MT5 service request
- **5-Minute Limit:** Respects Supabase function execution limit
- **Instrumentation:** Logs batch timings and totals

## Database Operations

### trading_accounts Updates
```sql
UPDATE trading_accounts SET
  balance = ?,
  equity = ?,
  margin = ?,
  free_margin = ?,
  margin_level = ?,
  last_sync_at = NOW(),
  last_successful_sync_at = NOW(),
  sync_failure_count = 0,
  last_connection_error = NULL
WHERE id = ?
```

### trades Upserts (Positions)
```sql
INSERT INTO trades (
  account_id, ticket, symbol, type, volume,
  open_price, open_time, stop_loss, take_profit,
  current_price, profit, swap, commission, status, comment
) VALUES (...)
ON CONFLICT (ticket) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  profit = EXCLUDED.profit,
  swap = EXCLUDED.swap
```

### trades Inserts (History)
```sql
INSERT INTO trades (
  account_id, ticket, symbol, type, volume,
  open_price, open_time, close_price, close_time,
  profit, swap, commission, status, comment
) VALUES (...)
ON CONFLICT (ticket) DO UPDATE SET
  close_price = EXCLUDED.close_price,
  close_time = EXCLUDED.close_time,
  status = 'closed'
```

### sync_logs Inserts
```sql
INSERT INTO sync_logs (
  account_id, sync_type, started_at, completed_at,
  status, trades_synced, error_message, duration_ms
) VALUES (...)
```

## Local Testing

### Prerequisites
1. Python MT5 service running (Stories 3-3, 3-4, 3-5 complete)
2. Database schema updated (Story 4-3)
3. Active accounts in `trading_accounts`

### Setup

```bash
# Navigate to project root
cd d:/tnm/tnm_concept

# Create/update .env.edge file
cat > .env.edge << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MT5_SERVICE_URL=http://localhost:8000
MT5_SERVICE_API_KEY=your_mt5_api_key
EOF

# Start the function locally
supabase functions serve sync-trading-data --env-file .env.edge --no-verify-jwt
```

### Manual Invocation

```bash
# Trigger sync manually
curl -X POST http://localhost:54321/functions/v1/sync-trading-data

# Expected: JSON with syncResults for all active accounts
```

### Test Scenarios

#### 1. Normal Sync (All Accounts Succeed)
```bash
# Ensure MT5 service is running
curl http://localhost:8000/health

# Trigger sync
curl -X POST http://localhost:54321/functions/v1/sync-trading-data

# Expected: successCount = totalAccounts
```

#### 2. Partial Failure (Some Accounts Fail)
```bash
# Stop MT5 service temporarily to simulate failure
# Or have accounts with invalid credentials

curl -X POST http://localhost:54321/functions/v1/sync-trading-data

# Expected: Mixed results in syncResults array
# Some with status="success", others with status="failed"
```

#### 3. No Active Accounts
```bash
# Disable all accounts in database
UPDATE trading_accounts SET is_active = false;

curl -X POST http://localhost:54321/functions/v1/sync-trading-data

# Expected: totalAccounts = 0, message about no accounts
```

#### 4. Large Batch (Test Batching)
```bash
# Add 25+ active accounts to database

curl -X POST http://localhost:54321/functions/v1/sync-trading-data

# Expected: Multiple batches processed (check logs for "Processing batch X/Y")
```

## Monitoring

### Sync Logs Query
```sql
-- Recent sync executions
SELECT 
  sl.account_id,
  ta.login_number,
  ta.broker_name,
  sl.status,
  sl.trades_synced,
  sl.duration_ms,
  sl.error_message,
  sl.started_at
FROM sync_logs sl
JOIN trading_accounts ta ON ta.id = sl.account_id
WHERE sl.sync_type = 'scheduled'
ORDER BY sl.started_at DESC
LIMIT 100;

-- Success rate by account
SELECT 
  account_id,
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successes,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failures,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / COUNT(*) * 100, 
    2
  ) as success_rate_pct,
  AVG(duration_ms) as avg_duration_ms
FROM sync_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY account_id
ORDER BY failures DESC;

-- Accounts with recent failures
SELECT 
  ta.id,
  ta.login_number,
  ta.broker_name,
  ta.sync_failure_count,
  ta.last_connection_error,
  ta.last_sync_at,
  ta.last_successful_sync_at
FROM trading_accounts ta
WHERE ta.sync_failure_count > 0
  AND ta.is_active = true
ORDER BY ta.sync_failure_count DESC;
```

### Function Logs
```bash
# View real-time logs during development
supabase functions serve sync-trading-data --env-file .env.edge --no-verify-jwt

# View deployed function logs
supabase functions logs sync-trading-data --tail

# Filter by execution ID
supabase functions logs sync-trading-data | grep "execution-id-here"
```

### Performance Metrics
```sql
-- Average sync duration by time of day
SELECT 
  EXTRACT(HOUR FROM started_at) as hour,
  COUNT(*) as sync_count,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  SUM(trades_synced) as total_trades_synced
FROM sync_logs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM started_at)
ORDER BY hour;
```

## Error Handling

### Account-Level Errors
Each account sync is wrapped in try-catch. Errors are:
1. Logged to `sync_logs` table
2. Stored in `trading_accounts.last_connection_error`
3. Increment `trading_accounts.sync_failure_count`
4. Don't stop processing of other accounts

### Partial Success
If only some endpoints fail (e.g., info succeeds but positions fail):
- Status set to `'partial'`
- Successfully fetched data is still persisted
- Error message includes details of what failed

### Complete Failure
If all endpoints fail for an account:
- Status set to `'failed'`
- No data persisted for that account
- Error message logged
- Other accounts continue processing

### Function-Level Errors
Critical errors (e.g., can't connect to database, missing config):
- Return 500 error
- Log error with execution ID
- Don't write any sync logs

## Performance Optimization

### Batch Size Selection
- **10 accounts:** Balances parallelism vs memory usage
- **100ms delay:** Prevents service overload between batches
- **Promise.allSettled:** All accounts in batch processed even if some fail

### Timeout Strategy
- **30 seconds:** Per MT5 service request
- **5 minutes:** Total function execution limit (Supabase)
- **Early exit:** If approaching 5-minute limit (not implemented yet)

### History Optimization
- Only fetches trades since `last_sync_at`
- Default: Last 30 days if never synced
- Reduces data transfer and processing time

## Deployment

### Deploy Function
```bash
# Deploy without JWT verification (for cron)
supabase functions deploy sync-trading-data --no-verify-jwt
```

### Set Secrets
```bash
# Production secrets
supabase secrets set MT5_SERVICE_URL=https://mt5.tnm.com
supabase secrets set MT5_SERVICE_API_KEY=production_api_key
```

### Configure Cron Schedule
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → sync-trading-data
3. Enable Cron
4. Set schedule: `0 */5 * * *` (every 5 minutes)
5. Save

### Verify Deployment
```bash
# Check function logs after a few cron runs
supabase functions logs sync-trading-data --tail

# Query sync_logs table
SELECT COUNT(*), status 
FROM sync_logs 
WHERE sync_type = 'scheduled' 
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

## Acceptance Criteria Status

✅ **AC1:** Loads active accounts with service role key; removes MetaAPI references  
✅ **AC2:** Processes in batches of 10; calls MT5 service endpoints with API key  
✅ **AC3:** Updates trading_accounts and upserts positions/history to trades  
✅ **AC4:** Account failures isolated; errors logged to sync_logs and trading_accounts  
✅ **AC5:** Respects 5-minute limit with batching and instrumentation  
✅ **AC6:** Cron scheduling documented; manual testing via supabase functions serve

## Known Limitations

1. **5-Minute Timeout:** May not complete for very large account lists (>300 accounts)
   - Mitigation: Batch processing with delays
   - Future: Implement early exit if approaching limit

2. **No Retry Logic:** Failed accounts not retried within same execution
   - Mitigation: Next cron run (5 minutes) will retry
   - Future: Could add single retry per account

3. **History Window:** Defaults to 30 days for accounts never synced
   - Impact: Large initial sync for old accounts
   - Mitigation: Consider setting shorter initial window

4. **Database Schema:** Requires Story 4-3 migrations
   - `sync_logs` table
   - `sync_failure_count`, `last_connection_error`, `last_successful_sync_at` columns

## Next Steps

- Story 4-3: Database schema migrations (if not done)
- Story 4-4: Row Level Security policies
- Monitoring: Set up alerts for high failure rates

## References

- Story 3-3: GET /api/mt5/account/{id}/info
- Story 3-4: GET /api/mt5/account/{id}/positions
- Story 3-5: GET /api/mt5/account/{id}/history
- Story 4-1: connect-mt5-account (similar patterns)
- Story 4-3: Database schema updates
- PRD: Function specifications
