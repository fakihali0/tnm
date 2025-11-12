-- Add indexes for better security monitoring performance
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);

-- Add indexes for contact submissions for admin access
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

-- Create a function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create admin access logging function
CREATE OR REPLACE FUNCTION public.log_admin_access(_user_id uuid, _resource text, _action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (event_type, details, timestamp, ip_address)
  VALUES (
    'admin_access',
    jsonb_build_object(
      'user_id', _user_id,
      'resource', _resource,
      'action', _action,
      'timestamp', now()
    ),
    now()::text,
    'server-side'
  );
END;
$$;