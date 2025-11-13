-- Rollback Migration: RLS Policies Update for MT5 Integration
-- Story: 4-4 Row Level Security (RLS) Policies Update
-- Date: 2025-11-13
-- Description: Reverts RLS policy changes to pre-Story 4-4 state

-- =============================================================================
-- PART 1: Revert trading_accounts policies to original format
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can insert their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can update their own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Users can delete their own trading accounts" ON public.trading_accounts;

-- Restore original policies with profiles subquery
CREATE POLICY "Users can view their own trading accounts"
ON public.trading_accounts FOR SELECT
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own trading accounts"
ON public.trading_accounts FOR INSERT
WITH CHECK (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own trading accounts"
ON public.trading_accounts FOR UPDATE
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own trading accounts"
ON public.trading_accounts FOR DELETE
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- PART 2: Revert trades policies to original format
-- =============================================================================

DROP POLICY IF EXISTS "Users can view trades from their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can insert trades to their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can update trades in their accounts" ON public.trades;
DROP POLICY IF EXISTS "Users can delete trades from their accounts" ON public.trades;

-- Restore original policies with profiles subquery
CREATE POLICY "Users can view trades from their accounts"
ON public.trades FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert trades to their accounts"
ON public.trades FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update trades in their accounts"
ON public.trades FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete trades from their accounts"
ON public.trades FOR DELETE
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- =============================================================================
-- PART 3: Remove helper function
-- =============================================================================

DROP FUNCTION IF EXISTS public.can_access_account_details(UUID);

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================
