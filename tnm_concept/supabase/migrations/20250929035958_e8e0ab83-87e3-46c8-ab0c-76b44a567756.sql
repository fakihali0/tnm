-- Critical Security Fixes - Database Policies (Simplified)

-- 1. Fix Contact Submissions RLS Policies
DROP POLICY IF EXISTS "Allow anonymous contact form submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;

-- Create secure contact submissions policies with simplified validation
CREATE POLICY "Secure anonymous contact form submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  length(TRIM(first_name)) > 0 AND length(TRIM(first_name)) <= 100 AND
  length(TRIM(last_name)) > 0 AND length(TRIM(last_name)) <= 100 AND
  length(TRIM(subject)) > 0 AND length(TRIM(subject)) <= 200 AND
  length(TRIM(message)) >= 10 AND length(message) <= 5000 AND
  (phone IS NULL OR length(TRIM(phone)) >= 10)
);

CREATE POLICY "Admins only can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins only can update contact submissions" 
ON public.contact_submissions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins only can delete contact submissions" 
ON public.contact_submissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Strengthen Partner Applications Security
DROP POLICY IF EXISTS "Anyone can submit partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Only admins can view partner applications" ON public.partner_applications;

CREATE POLICY "Secure partner application submissions" 
ON public.partner_applications 
FOR INSERT 
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  length(TRIM(first_name)) > 0 AND length(TRIM(first_name)) <= 100 AND
  length(TRIM(last_name)) > 0 AND length(TRIM(last_name)) <= 100 AND
  partner_type IN ('ib', 'affiliate', 'white_label', 'regional_partner') AND
  (phone IS NULL OR length(TRIM(phone)) >= 10)
);

CREATE POLICY "Admins only can view partner applications" 
ON public.partner_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins only can update partner applications" 
ON public.partner_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins only can delete partner applications" 
ON public.partner_applications 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add columns for credential encryption (account_integrations)
ALTER TABLE public.account_integrations 
ADD COLUMN IF NOT EXISTS encrypted_credentials text,
ADD COLUMN IF NOT EXISTS encryption_key_id text,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone;

-- 4. Create security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _details jsonb DEFAULT NULL,
  _user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (event_type, details, ip_address, user_agent)
  VALUES (
    _event_type,
    COALESCE(_details, '{}'::jsonb),
    'system',
    'system'
  );
END;
$$;

-- 5. Data retention cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep security events for 90 days
  DELETE FROM public.security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep contact submissions for 2 years (compliance)
  DELETE FROM public.contact_submissions 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Log cleanup activity
  INSERT INTO public.security_events (event_type, details, ip_address)
  VALUES (
    'data_cleanup',
    jsonb_build_object(
      'cleanup_date', now(),
      'retention_policy', 'automatic'
    ),
    'system'
  );
END;
$$;