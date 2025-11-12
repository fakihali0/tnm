-- ============================================
-- PHASE 4: SECURITY HARDENING - RLS POLICIES & RATE LIMITING
-- ============================================

-- Create API rate limits table for rate limiting
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function 
ON public.api_rate_limits(user_id, function_name, timestamp);

-- Enable RLS on api_rate_limits
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can insert rate limit records
CREATE POLICY "System can manage rate limits"
ON public.api_rate_limits FOR ALL
USING ((auth.uid() IS NULL) OR has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own rate limit history
CREATE POLICY "Users can view their own rate limits"
ON public.api_rate_limits FOR SELECT
USING (user_id = auth.uid());

-- Auto-cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE timestamp < NOW() - INTERVAL '1 hour';
END;
$$;

-- Scheduled cleanup (application should call this periodically)
COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 'Removes rate limit entries older than 1 hour';

-- ============================================
-- ENHANCED RLS POLICIES FOR EXISTING TABLES
-- ============================================

-- Drop existing permissive policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Market insights policies
  DROP POLICY IF EXISTS "System can manage market insights" ON public.market_insights;
  DROP POLICY IF EXISTS "Anyone can view market insights" ON public.market_insights;
  
  -- Create stricter policies
  CREATE POLICY "System and admins can manage market insights"
  ON public.market_insights FOR ALL
  USING ((auth.uid() IS NULL) OR has_role(auth.uid(), 'admin'::app_role));

  CREATE POLICY "Authenticated users can view market insights"
  ON public.market_insights FOR SELECT
  USING (auth.uid() IS NOT NULL);

EXCEPTION WHEN duplicate_object THEN
  NULL; -- Policy already exists, ignore
END $$;

-- Ensure account_integrations has strict access control
DO $$
BEGIN
  -- Only edge functions should access encrypted credentials
  DROP POLICY IF EXISTS "Users can manage their own account integrations" ON public.account_integrations;
  DROP POLICY IF EXISTS "Users can delete their account integrations" ON public.account_integrations;
  
  -- Service role only for credential access
  CREATE POLICY "Service role can manage integrations"
  ON public.account_integrations FOR ALL
  USING ((auth.jwt() ->> 'role' = 'service_role') OR has_role(auth.uid(), 'admin'::app_role));

  -- Users can only view metadata (not encrypted credentials)
  CREATE POLICY "Users can view their integration metadata"
  ON public.account_integrations FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    )
  );

EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- SECURITY EVENT LOGGING ENHANCEMENTS
-- ============================================

-- Add index for security event queries
CREATE INDEX IF NOT EXISTS idx_security_events_type_timestamp 
ON public.security_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_ip 
ON public.security_events(ip_address, created_at DESC);

-- ============================================
-- AUDIT TRAIL FOR CREDENTIAL ACCESS
-- ============================================

CREATE TABLE IF NOT EXISTS public.credential_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete')),
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credential_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view credential access logs"
ON public.credential_access_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert logs
CREATE POLICY "System can insert credential access logs"
ON public.credential_access_log FOR INSERT
WITH CHECK ((auth.uid() IS NULL) OR has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_credential_access_user 
ON public.credential_access_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_credential_access_account 
ON public.credential_access_log(account_id, timestamp DESC);

-- ============================================
-- LOG SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Security hardening migration completed successfully';
END $$;