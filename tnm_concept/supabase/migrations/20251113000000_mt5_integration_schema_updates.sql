-- Migration: MT5 Integration Schema Updates
-- Story: 4-3 Database Schema Updates for MT5 Integration
-- Date: 2025-11-13
-- Description: Adds MT5-specific columns to trading_accounts and creates sync_logs table
-- Dependencies: Stories 4-1 (connect-mt5-account) and 4-2 (sync-trading-data) edge functions

-- =============================================================================
-- PART 1: Extend trading_accounts table for MT5 integration
-- =============================================================================

-- Add MT5 service integration column
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS mt5_service_account_id VARCHAR(255);

COMMENT ON COLUMN public.trading_accounts.mt5_service_account_id 
IS 'Account ID from Python MT5 Integration Service. Used by Stories 4-1 and 4-2 to identify accounts in the service.';

-- Update connection_status constraint to include new 'active' status
ALTER TABLE public.trading_accounts 
DROP CONSTRAINT IF EXISTS trading_accounts_connection_status_check;

ALTER TABLE public.trading_accounts 
ADD CONSTRAINT trading_accounts_connection_status_check 
CHECK (connection_status IN ('connected', 'disconnected', 'error', 'active'));

-- Add error tracking column
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS last_connection_error TEXT;

COMMENT ON COLUMN public.trading_accounts.last_connection_error 
IS 'Last error message from MT5 connection or sync attempts. Updated by Story 4-2 sync function.';

-- Add successful sync tracking
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.trading_accounts.last_successful_sync_at 
IS 'Timestamp of last successful sync with MT5 service. Updated by Story 4-2 sync function.';

-- Add sync failure counter
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS sync_failure_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.trading_accounts.sync_failure_count 
IS 'Counter for consecutive sync failures. Reset to 0 on successful sync. Used for alerting.';

-- Add broker server time offset
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS broker_server_time_offset INTEGER DEFAULT 0;

COMMENT ON COLUMN public.trading_accounts.broker_server_time_offset 
IS 'Time offset in seconds between broker server and UTC. Used for timestamp alignment.';

-- Create index for sync operations (used by Story 4-2)
CREATE INDEX IF NOT EXISTS idx_trading_accounts_sync_status 
ON public.trading_accounts(is_active, connection_status, last_sync_at)
WHERE is_active = true;

COMMENT ON INDEX idx_trading_accounts_sync_status 
IS 'Optimizes sync-trading-data edge function query for active accounts that need syncing.';

-- =============================================================================
-- PART 2: Create sync_logs table for sync telemetry
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('scheduled', 'manual', 'realtime')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  trades_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sync_logs 
IS 'Tracks MT5 account sync attempts and results. Written by Story 4-2 sync-trading-data edge function.';

COMMENT ON COLUMN public.sync_logs.sync_type 
IS 'Type of sync: scheduled (cron), manual (user-triggered), realtime (websocket)';

COMMENT ON COLUMN public.sync_logs.status 
IS 'Sync result: success (all data synced), failed (complete failure), partial (some endpoints succeeded)';

COMMENT ON COLUMN public.sync_logs.trades_synced 
IS 'Number of trades (positions + history) successfully synced';

COMMENT ON COLUMN public.sync_logs.duration_ms 
IS 'Sync duration in milliseconds. Used for performance monitoring';

-- Create index for chronological lookups by account
CREATE INDEX IF NOT EXISTS idx_sync_logs_account 
ON public.sync_logs(account_id, started_at DESC);

COMMENT ON INDEX idx_sync_logs_account 
IS 'Optimizes queries for account sync history. Used by monitoring dashboards.';

-- Create index for querying recent syncs across all accounts
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at 
ON public.sync_logs(started_at DESC);

COMMENT ON INDEX idx_sync_logs_started_at 
IS 'Optimizes queries for recent sync activity across all accounts.';

-- =============================================================================
-- PART 3: Enable RLS on sync_logs
-- =============================================================================

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can view sync logs for their own accounts
CREATE POLICY "Users can view sync logs for their accounts"
ON public.sync_logs FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = auth.uid()
  )
);

-- Service role can insert sync logs (edge functions use service role)
CREATE POLICY "Service role can insert sync logs"
ON public.sync_logs FOR INSERT
WITH CHECK (true);

COMMENT ON POLICY "Service role can insert sync logs" ON public.sync_logs 
IS 'Allows sync-trading-data edge function (using service role) to write sync results.';

-- =============================================================================
-- PART 4: Create helper views for monitoring
-- =============================================================================

-- View: Recent sync failures across all accounts
CREATE OR REPLACE VIEW public.recent_sync_failures AS
SELECT 
  sl.id as sync_log_id,
  ta.id as account_id,
  ta.user_id,
  ta.login_number,
  ta.broker_name,
  ta.server,
  sl.sync_type,
  sl.status,
  sl.error_message,
  sl.started_at,
  sl.completed_at,
  sl.duration_ms
FROM public.sync_logs sl
JOIN public.trading_accounts ta ON ta.id = sl.account_id
WHERE sl.status IN ('failed', 'partial')
  AND sl.started_at > NOW() - INTERVAL '24 hours'
ORDER BY sl.started_at DESC;

COMMENT ON VIEW public.recent_sync_failures 
IS 'Shows sync failures in the last 24 hours. Used for monitoring and alerting.';

-- View: Account sync health summary
CREATE OR REPLACE VIEW public.account_sync_health AS
SELECT 
  ta.id as account_id,
  ta.user_id,
  ta.login_number,
  ta.broker_name,
  ta.is_active,
  ta.connection_status,
  ta.last_sync_at,
  ta.last_successful_sync_at,
  ta.sync_failure_count,
  ta.last_connection_error,
  COUNT(sl.id) as total_syncs_24h,
  COUNT(CASE WHEN sl.status = 'success' THEN 1 END) as successful_syncs_24h,
  COUNT(CASE WHEN sl.status = 'failed' THEN 1 END) as failed_syncs_24h,
  COUNT(CASE WHEN sl.status = 'partial' THEN 1 END) as partial_syncs_24h,
  AVG(sl.duration_ms) as avg_sync_duration_ms
FROM public.trading_accounts ta
LEFT JOIN public.sync_logs sl ON sl.account_id = ta.id 
  AND sl.started_at > NOW() - INTERVAL '24 hours'
WHERE ta.is_active = true
GROUP BY ta.id, ta.user_id, ta.login_number, ta.broker_name, ta.is_active, 
         ta.connection_status, ta.last_sync_at, ta.last_successful_sync_at, 
         ta.sync_failure_count, ta.last_connection_error;

COMMENT ON VIEW public.account_sync_health 
IS 'Summary of each account sync health over last 24 hours. Used for monitoring dashboards.';

-- Grant SELECT on views to authenticated users (for their own data via RLS)
GRANT SELECT ON public.recent_sync_failures TO authenticated;
GRANT SELECT ON public.account_sync_health TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
