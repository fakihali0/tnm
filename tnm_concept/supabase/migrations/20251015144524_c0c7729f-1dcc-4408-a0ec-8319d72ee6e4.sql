-- Security Fix: Replace anonymous security_events inserts with security definer function
-- This prevents log injection attacks while allowing edge functions to log events

-- Drop existing function and policy
DROP FUNCTION IF EXISTS public.log_security_event(text, jsonb, uuid);
DROP FUNCTION IF EXISTS public.log_security_event(text, jsonb);
DROP POLICY IF EXISTS "Secure system security event insertion" ON public.security_events;

-- Create a security definer function for controlled logging
-- Edge functions will call this instead of inserting directly
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _details jsonb DEFAULT '{}'::jsonb,
  _ip text DEFAULT 'system',
  _user_agent text DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input to prevent abuse
  IF length(_event_type) > 200 THEN
    RAISE EXCEPTION 'Event type too long';
  END IF;
  
  IF pg_column_size(_details) > 10000 THEN
    RAISE EXCEPTION 'Details payload too large';
  END IF;

  INSERT INTO public.security_events (event_type, details, ip_address, user_agent)
  VALUES (_event_type, _details, _ip, _user_agent);
END;
$$;

-- Only authenticated admins can insert security events directly
CREATE POLICY "Only admins can insert security events directly"
ON public.security_events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix: Verify DELETE policy on account_integrations
-- Add explicit DELETE policy to ensure users can remove compromised credentials
DROP POLICY IF EXISTS "Users can delete their account integrations" ON public.account_integrations;

CREATE POLICY "Users can delete their account integrations"
ON public.account_integrations FOR DELETE
USING (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id IN (
    SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Add comment for documentation
COMMENT ON FUNCTION public.log_security_event IS 'Security definer function for logging security events from edge functions. Prevents direct anonymous inserts to security_events table.';