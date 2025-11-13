-- Migration: RLS Policies Update for MT5 Integration
-- Story: 4-4 Row Level Security (RLS) Policies Update
-- Date: 2025-11-13
-- Description: Reviews and updates RLS policies for trading_accounts, trades, and sync_logs
-- Dependencies: Story 4-3 (database schema updates)

-- =============================================================================
-- PART 1: Review and optimize trading_accounts RLS policies
-- =============================================================================

-- Drop existing policies that have suboptimal queries
DROP POLICY IF EXISTS "Users can view their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON public.trading_accounts;

-- Recreate with optimized queries (direct auth.uid() comparison)
-- Story 4-4, AC:1 - Users only access their own trading data

CREATE POLICY "Users can view their own trading accounts"
ON public.trading_accounts FOR SELECT
USING (user_id = auth.uid());

COMMENT ON POLICY "Users can view their own trading accounts" ON public.trading_accounts
IS 'Story 4-4: Users can only view trading accounts they own. Service role bypasses this for Stories 4-1, 4-2.';

CREATE POLICY "Users can insert their own trading accounts"
ON public.trading_accounts FOR INSERT
WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Users can insert their own trading accounts" ON public.trading_accounts
IS 'Story 4-4: Users can only create trading accounts for themselves. Story 4-1 uses service role to bypass.';

CREATE POLICY "Users can update their own trading accounts"
ON public.trading_accounts FOR UPDATE
USING (user_id = auth.uid());

COMMENT ON POLICY "Users can update their own trading accounts" ON public.trading_accounts
IS 'Story 4-4: Users can only update their own accounts. Stories 4-1, 4-2 use service role for sync updates.';

CREATE POLICY "Users can delete their own trading accounts"
ON public.trading_accounts FOR DELETE
USING (user_id = auth.uid());

COMMENT ON POLICY "Users can delete their own trading accounts" ON public.trading_accounts
IS 'Story 4-4: Users can only delete their own accounts. Cascade deletes handled by FK constraints.';

-- =============================================================================
-- PART 2: Review and optimize trades RLS policies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view trades from their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can insert trades to their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can update trades in their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can delete trades from their accounts" ON public.trades;

-- Recreate with optimized queries
-- Story 4-4, AC:2 - Trades are filtered by account ownership

CREATE POLICY "Users can view trades from their accounts"
ON public.trades FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can view trades from their accounts" ON public.trades
IS 'Story 4-4: Users can only view trades from accounts they own. Story 4-2 sync uses service role to insert.';

CREATE POLICY "Users can insert trades to their accounts"
ON public.trades FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can insert trades to their accounts" ON public.trades
IS 'Story 4-4: Users can only insert trades to their own accounts. Story 4-2 sync bypasses via service role.';

CREATE POLICY "Users can update trades in their accounts"
ON public.trades FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can update trades in their accounts" ON public.trades
IS 'Story 4-4: Users can only update trades from their accounts. Story 4-2 sync uses service role.';

CREATE POLICY "Users can delete trades from their accounts"
ON public.trades FOR DELETE
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can delete trades from their accounts" ON public.trades
IS 'Story 4-4: Users can only delete their own trades. Prevents cross-user data manipulation.';

-- =============================================================================
-- PART 3: Verify sync_logs RLS policies (created in Story 4-3)
-- =============================================================================

-- Note: sync_logs policies were created in Story 4-3 migration:
-- - "Users can view sync logs for their accounts" (SELECT)
-- - "Service role can insert sync logs" (INSERT)
--
-- These are already optimal:
-- - Users can only view sync logs for their accounts
-- - Only service role (edge functions) can insert logs
-- - No UPDATE/DELETE policies = users cannot modify logs
--
-- Story 4-4, AC:3 - sync_logs has owner-only SELECT, admin-only INSERT

-- Add comment to existing SELECT policy for Story 4-4 reference
COMMENT ON POLICY "Users can view sync logs for their accounts" ON public.sync_logs
IS 'Story 4-4: Users can view sync logs only for accounts they own. Prevents cross-user telemetry exposure.';

-- Verify INSERT policy comment references both stories
COMMENT ON POLICY "Service role can insert sync logs" ON public.sync_logs
IS 'Stories 4-3, 4-4: Service role (edge functions from Stories 4-1, 4-2) can insert sync logs. Users cannot insert/modify logs.';

-- =============================================================================
-- PART 4: Service role documentation
-- =============================================================================

-- Story 4-4, AC:4 - Document service role bypass behavior
--
-- IMPORTANT: How RLS works with Supabase service roles
-- ======================================================
--
-- 1. Service Role Key: Bypasses ALL RLS policies
--    - Used by: Edge functions (Stories 4-1, 4-2)
--    - Used by: Python MT5 service (via edge functions)
--    - Purpose: Allows background sync operations without user context
--
-- 2. Anon/Auth Keys: Obey RLS policies
--    - Used by: Frontend application (React)
--    - Used by: Direct user API calls
--    - Purpose: Enforces user-level data isolation
--
-- 3. Edge Function Flow:
--    - Frontend calls edge function with auth token
--    - Edge function validates user token
--    - Edge function uses service role to:
--      a. Read/write trading_accounts for any user (Story 4-1)
--      b. Insert trades from MT5 sync (Story 4-2)
--      c. Insert sync_logs telemetry (Story 4-2)
--    - This is SECURE because:
--      - Edge function validates user ownership before operations
--      - Service role access is contained to edge function code
--      - Users cannot directly access service role key
--
-- 4. Testing Considerations:
--    - Test with anon/auth keys to verify RLS enforcement
--    - Test with service role to verify edge function operations
--    - See Story 4-4 verification script for test procedures

-- =============================================================================
-- PART 5: Additional security enhancements
-- =============================================================================

-- Add policy to prevent users from viewing other users' account credentials
-- (encryption_key_id, connection_status errors, etc.)

-- Create security function to check if user can access account details
CREATE OR REPLACE FUNCTION public.can_access_account_details(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trading_accounts
    WHERE id = account_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_access_account_details
IS 'Story 4-4: Helper function for RLS policies to check account ownership efficiently.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verification queries to run after migration:
--
-- 1. Check trading_accounts policies:
--    SELECT policyname, cmd, qual, with_check
--    FROM pg_policies
--    WHERE tablename = 'trading_accounts';
--
-- 2. Check trades policies:
--    SELECT policyname, cmd, qual, with_check
--    FROM pg_policies
--    WHERE tablename = 'trades';
--
-- 3. Check sync_logs policies:
--    SELECT policyname, cmd, qual, with_check
--    FROM pg_policies
--    WHERE tablename = 'sync_logs';
--
-- 4. Test with anon key (should fail):
--    curl -H "apikey: <anon_key>" -H "Authorization: Bearer <anon_key>"
--         https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/trading_accounts
--
-- 5. Test with user JWT (should return only user's data):
--    curl -H "apikey: <anon_key>" -H "Authorization: Bearer <user_jwt>"
--         https://edzkorfdixvvvrkfzqzg.supabase.co/rest/v1/trading_accounts
