-- Fix security_events RLS policy to prevent unauthorized access
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

-- Create more secure policy that only allows system-level insertions
-- Either when called from edge functions (no auth.uid()) or by admin users
CREATE POLICY "Secure system security event insertion" 
ON public.security_events 
FOR INSERT 
WITH CHECK (
  -- Allow when no user context (edge functions/system calls)
  auth.uid() IS NULL 
  OR 
  -- Allow admin users to insert events manually if needed
  has_role(auth.uid(), 'admin'::app_role)
);