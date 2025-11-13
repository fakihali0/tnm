# MANUAL MIGRATION APPLICATION GUIDE

## Quick Start (Recommended - 2 minutes)

Since you don't have the service role key or Supabase CLI set up, the **fastest** way to apply the migration is manually through the Supabase Dashboard:

### Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/editor
   - Click "SQL Editor" in the left sidebar

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/20251113000000_mt5_integration_schema_updates.sql`
   - Copy ALL contents (220 lines)

3. **Run Migration**
   - Paste into SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message

4. **Verify Changes**
   - Go to: Table Editor > trading_accounts
   - Confirm new columns exist:
     - `mt5_service_account_id`
     - `last_connection_error`
     - `last_successful_sync_at`
     - `sync_failure_count`
     - `broker_server_time_offset`
   - Confirm new table: `sync_logs`
   - Confirm new views: `recent_sync_failures`, `account_sync_health`

---

## Alternative Methods

### Option A: Using Service Role Key (If Available)

If you have the service role key:

```powershell
# Set environment variable
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"

# Run migration script
.\supabase\apply-migration.ps1
```

**Find Service Role Key:**
- Dashboard: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/settings/api
- Look for: `service_role` key (starts with `eyJhbG...`)

### Option B: Using PostgreSQL Client (psql)

If you have psql installed:

```powershell
# Get database password from Supabase Dashboard:
# Settings > Database > Connection String

psql -h db.edzkorfdixvvvrkfzqzg.supabase.co `
     -p 5432 `
     -U postgres `
     -d postgres `
     -f supabase\migrations\20251113000000_mt5_integration_schema_updates.sql
```

### Option C: Install Supabase CLI

```powershell
# Install Node.js if not already installed
winget install OpenJS.NodeJS

# Install Supabase CLI
npm install -g supabase

# Link project (you'll need to log in)
supabase link --project-ref edzkorfdixvvvrkfzqzg

# Apply migrations
supabase db push
```

---

## Verification Queries

After applying the migration, run these queries in SQL Editor to verify:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trading_accounts' 
  AND column_name IN (
    'mt5_service_account_id',
    'last_connection_error',
    'last_successful_sync_at',
    'sync_failure_count',
    'broker_server_time_offset'
  )
ORDER BY column_name;

-- Check sync_logs table exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'sync_logs'
) as sync_logs_exists;

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN ('recent_sync_failures', 'account_sync_health');
```

Expected results:
- 5 columns found in trading_accounts
- sync_logs_exists = true
- 2 views found

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

1. Open SQL Editor
2. Copy contents of: `supabase/migrations/20251113000001_mt5_integration_schema_rollback.sql`
3. Run in SQL Editor

---

## Why Manual Application?

You currently have:
- ✓ Supabase anon keys (in .env) - for frontend authentication
- ✗ Supabase service role key - for admin operations
- ✗ Supabase CLI installed
- ✗ PostgreSQL client (psql) installed

The migration requires ALTER TABLE and CREATE TABLE permissions, which only the service role key or database password can provide.

Manual application via SQL Editor is the fastest method without installing additional tools.

---

## Impact on Edge Functions

**IMPORTANT:** Stories 4-1 and 4-2 edge functions REQUIRE these schema changes:

- `connect-mt5-account` function needs: `mt5_service_account_id` column
- `sync-trading-data` function needs: ALL new columns + `sync_logs` table

These functions will fail with database errors until the migration is applied.

---

## Next Steps After Migration

1. ✓ Migration applied
2. Test edge functions:
   ```bash
   # Test connect-mt5-account locally
   supabase functions serve connect-mt5-account
   
   # Test sync-trading-data locally
   supabase functions serve sync-trading-data
   ```
3. Deploy to production:
   ```bash
   supabase functions deploy connect-mt5-account
   supabase functions deploy sync-trading-data
   ```
4. Update sprint status (mark Story 4-3 as complete)

---

## Need Help?

If you encounter errors:
1. Check the migration file: `supabase/migrations/README_MT5_SCHEMA.md`
2. Review troubleshooting section in README
3. Verify your Supabase project is on Postgres 15+
4. Check RLS policies are enabled

---

## Summary

**Recommended Action:** Manual application via SQL Editor (2 minutes)

1. Go to SQL Editor: https://supabase.com/dashboard/project/edzkorfdixvvvrkfzqzg/editor
2. Copy & paste migration SQL
3. Click Run
4. Verify with verification queries above

This will unblock Stories 4-1 and 4-2 edge functions immediately.
