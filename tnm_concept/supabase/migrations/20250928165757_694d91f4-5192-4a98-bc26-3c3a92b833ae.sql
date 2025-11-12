-- Fix journal_summaries security vulnerability
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can manage journal summaries" ON public.journal_summaries;
DROP POLICY IF EXISTS "System can update journal summaries" ON public.journal_summaries;

-- Create secure policies that restrict INSERT/UPDATE to account owners only
CREATE POLICY "Users can insert summaries for their own accounts" 
ON public.journal_summaries 
FOR INSERT 
WITH CHECK (
  account_id IN (
    SELECT trading_accounts.id
    FROM trading_accounts
    WHERE trading_accounts.user_id = (
      SELECT profiles.user_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update summaries for their own accounts" 
ON public.journal_summaries 
FOR UPDATE 
USING (
  account_id IN (
    SELECT trading_accounts.id
    FROM trading_accounts
    WHERE trading_accounts.user_id = (
      SELECT profiles.user_id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);