# MT5 Integration Schema Updates

**Story:** 4-3: Database Schema Updates for MT5 Integration  
**Migration Files:**
- `20251113000000_mt5_integration_schema_updates.sql` (up migration)
- `20251113000001_mt5_integration_schema_rollback.sql` (down migration)

## Overview

This migration adds MT5-specific database schema changes required by Stories 4-1 (connect-mt5-account) and 4-2 (sync-trading-data) edge functions.

## Changes Summary

### trading_accounts Table Extensions

**New Columns:**
1. `mt5_service_account_id` VARCHAR(255) - Account ID from Python MT5 service
2. `last_connection_error` TEXT - Last error message from connection/sync
3. `last_successful_sync_at` TIMESTAMP - Last successful sync timestamp
4. `sync_failure_count` INTEGER - Counter for consecutive failures
5. `broker_server_time_offset` INTEGER - Time offset for broker server

**Updated Constraints:**
- `connection_status` CHECK constraint now includes 'active' status

**New Index:**
- `idx_trading_accounts_sync_status` - Optimizes sync queries on (is_active, connection_status, last_sync_at)

### sync_logs Table (New)

Tracks all MT5 account sync attempts with results.

**Schema:**
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  account_id UUID FK -> trading_accounts,
  sync_type VARCHAR(50) CHECK IN ('scheduled', 'manual', 'realtime'),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(50) CHECK IN ('success', 'failed', 'partial'),
  trades_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP NOT NULL
);
```

**Indexes:**
- `idx_sync_logs_account` - On (account_id, started_at DESC)
- `idx_sync_logs_started_at` - On (started_at DESC)

**RLS Policies:**
- Users can SELECT their own account sync logs
- Service role can INSERT (for edge functions)

### Helper Views

**1. recent_sync_failures**
- Shows failed/partial syncs in last 24 hours
- Used for monitoring and alerting

**2. account_sync_health**
- Summary of each account's sync health
- Includes success rate, avg duration, failure count
- Used for monitoring dashboards

## Running the Migration

### Local Development

```bash
# Navigate to project
cd d:/tnm/tnm_concept

# Run migration (applies all pending migrations)
supabase db push

# Or reset database (WARNING: deletes all data)
supabase db reset
```

### Manual Application

```bash
# Apply specific migration
psql -h localhost -U postgres -d postgres -f supabase/migrations/20251113000000_mt5_integration_schema_updates.sql

# Verify changes
psql -h localhost -U postgres -d postgres -c "\d+ trading_accounts"
psql -h localhost -U postgres -d postgres -c "\d+ sync_logs"
```

### Staging/Production

```bash
# Push to remote database
supabase db push --db-url "postgresql://..."

# Or link project and push
supabase link --project-ref your-project-ref
supabase db push
```

## Verification

### Check Columns Added
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'trading_accounts'
  AND column_name IN (
    'mt5_service_account_id',
    'last_connection_error',
    'last_successful_sync_at',
    'sync_failure_count',
    'broker_server_time_offset'
  );
```

### Check sync_logs Table
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'sync_logs';

\d+ sync_logs
```

### Check Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('trading_accounts', 'sync_logs')
  AND indexname LIKE '%sync%';
```

### Check Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN ('recent_sync_failures', 'account_sync_health');
```

### Test RLS Policies
```sql
-- Check sync_logs policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'sync_logs';
```

## Rollback

If you need to undo this migration:

```bash
# Apply rollback migration
psql -h localhost -U postgres -d postgres -f supabase/migrations/20251113000001_mt5_integration_schema_rollback.sql
```

**⚠️ WARNING:** Rollback will:
- Delete ALL data in `sync_logs` table
- Remove MT5-specific columns from `trading_accounts`
- Preserve existing `trading_accounts` data in other columns

## Usage Examples

### Query Sync History for Account
```sql
SELECT * FROM sync_logs
WHERE account_id = 'uuid-here'
ORDER BY started_at DESC
LIMIT 20;
```

### Find Accounts with Sync Issues
```sql
SELECT * FROM trading_accounts
WHERE sync_failure_count > 3
  AND is_active = true
ORDER BY sync_failure_count DESC;
```

### Check Recent Failures
```sql
SELECT * FROM recent_sync_failures
LIMIT 50;
```

### Account Health Dashboard
```sql
SELECT * FROM account_sync_health
WHERE sync_failure_count > 0
ORDER BY failed_syncs_24h DESC;
```

### Sync Success Rate (Last 24h)
```sql
SELECT 
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successes,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failures,
  COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / COUNT(*) * 100,
    2
  ) as success_rate_pct
FROM sync_logs
WHERE started_at > NOW() - INTERVAL '24 hours';
```

## Dependencies

**Required By:**
- Story 4-1: connect-mt5-account edge function
  - Uses `mt5_service_account_id` to track service accounts
  - Updates `last_connection_error` on failures

- Story 4-2: sync-trading-data edge function
  - Queries accounts via `idx_trading_accounts_sync_status` index
  - Writes sync results to `sync_logs` table
  - Updates `last_successful_sync_at`, `sync_failure_count`

## Data Safety Notes

1. **No Data Loss:** All new columns use `ADD COLUMN IF NOT EXISTS` and have safe defaults
2. **Existing Data Preserved:** Rollback only removes new columns/tables
3. **No Locks:** Columns added with defaults don't require table rewrites in PostgreSQL 11+
4. **Index Concurrency:** Indexes created with `IF NOT EXISTS` (safe for re-running)

## Testing Checklist

- [ ] Migration runs successfully: `supabase db push`
- [ ] All columns exist: Check `information_schema.columns`
- [ ] `sync_logs` table created: Check `information_schema.tables`
- [ ] Indexes created: Check `pg_indexes`
- [ ] Views created: Check `information_schema.views`
- [ ] RLS policies active: Check `pg_policies`
- [ ] Rollback works: Test rollback migration
- [ ] Edge functions work: Test Stories 4-1 and 4-2
- [ ] No data loss: Verify existing `trading_accounts` data

## Troubleshooting

### Migration Fails: Column Already Exists
```
ERROR: column "mt5_service_account_id" already exists
```
**Solution:** Migration uses `IF NOT EXISTS`, safe to re-run. If still fails, column may have been manually added.

### Migration Fails: Table Already Exists
```
ERROR: relation "sync_logs" already exists
```
**Solution:** Migration uses `IF NOT EXISTS`, safe to re-run.

### Permission Denied
```
ERROR: permission denied for schema public
```
**Solution:** Ensure you're using a user with CREATE privileges. Use `postgres` superuser or service role.

### RLS Policy Conflicts
```
ERROR: policy "Users can view sync logs for their accounts" already exists
```
**Solution:** Drop existing policy first or modify migration to `CREATE OR REPLACE POLICY`.

## Monitoring Setup

After applying migration, set up monitoring:

1. **Alert on High Failure Rate**
```sql
-- Alert if success rate < 80% in last hour
SELECT 
  CASE 
    WHEN success_rate < 80 THEN 'ALERT'
    ELSE 'OK'
  END as status
FROM (
  SELECT 
    ROUND(
      COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / COUNT(*) * 100,
      2
    ) as success_rate
  FROM sync_logs
  WHERE started_at > NOW() - INTERVAL '1 hour'
) AS rates;
```

2. **Alert on Stale Syncs**
```sql
-- Alert on accounts not synced in 15 minutes
SELECT * FROM trading_accounts
WHERE is_active = true
  AND (last_sync_at < NOW() - INTERVAL '15 minutes' OR last_sync_at IS NULL);
```

3. **Alert on High Failure Count**
```sql
-- Alert on accounts with 5+ consecutive failures
SELECT * FROM trading_accounts
WHERE sync_failure_count >= 5
  AND is_active = true;
```

## Related Stories

- **Story 4-1:** connect-mt5-account edge function (uses `mt5_service_account_id`)
- **Story 4-2:** sync-trading-data edge function (uses all new columns and tables)
- **Story 4-4:** Row Level Security policies (builds on sync_logs RLS)

## References

- PRD Section 6.2: Database Schema Updates
- Epic 4: Supabase Integration
- PostgreSQL Documentation: ALTER TABLE, CREATE TABLE, CREATE INDEX
