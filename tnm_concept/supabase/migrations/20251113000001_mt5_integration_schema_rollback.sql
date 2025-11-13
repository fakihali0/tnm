-- Rollback Migration: MT5 Integration Schema Updates
-- Story: 4-3 Database Schema Updates for MT5 Integration
-- Date: 2025-11-13
-- Description: Rolls back MT5-specific schema changes (drops columns, tables, views, indexes)
-- WARNING: This will delete sync_logs data. trading_accounts data is preserved.

-- =============================================================================
-- PART 1: Drop helper views
-- =============================================================================

DROP VIEW IF EXISTS public.account_sync_health;
DROP VIEW IF EXISTS public.recent_sync_failures;

-- =============================================================================
-- PART 2: Drop sync_logs table
-- =============================================================================

DROP TABLE IF EXISTS public.sync_logs CASCADE;

-- =============================================================================
-- PART 3: Remove trading_accounts extensions
-- =============================================================================

-- Drop index
DROP INDEX IF EXISTS public.idx_trading_accounts_sync_status;

-- Drop new columns (preserves existing data in other columns)
ALTER TABLE public.trading_accounts 
DROP COLUMN IF EXISTS broker_server_time_offset;

ALTER TABLE public.trading_accounts 
DROP COLUMN IF EXISTS sync_failure_count;

ALTER TABLE public.trading_accounts 
DROP COLUMN IF EXISTS last_successful_sync_at;

ALTER TABLE public.trading_accounts 
DROP COLUMN IF EXISTS last_connection_error;

ALTER TABLE public.trading_accounts 
DROP COLUMN IF EXISTS mt5_service_account_id;

-- Restore original connection_status constraint
ALTER TABLE public.trading_accounts 
DROP CONSTRAINT IF EXISTS trading_accounts_connection_status_check;

ALTER TABLE public.trading_accounts 
ADD CONSTRAINT trading_accounts_connection_status_check 
CHECK (connection_status IN ('connected', 'disconnected', 'error'));

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================
-- NOTE: All sync_logs data has been deleted.
-- NOTE: trading_accounts data in other columns is preserved.
