-- Add data retention policy for contact submissions
CREATE OR REPLACE FUNCTION public.cleanup_old_contact_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete contact submissions older than 2 years (GDPR compliance)
  DELETE FROM public.contact_submissions 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Log cleanup activity
  INSERT INTO public.security_events (event_type, details, ip_address)
  VALUES (
    'contact_data_cleanup',
    jsonb_build_object(
      'cleanup_date', NOW(),
      'retention_period', '2 years'
    ),
    'system'
  );
END;
$$;

-- Add admin access logging trigger (only for UPDATE/DELETE)
CREATE OR REPLACE FUNCTION public.log_admin_contact_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log admin access to contact submissions
  IF public.has_role(auth.uid(), 'admin') THEN
    PERFORM public.log_admin_access(
      auth.uid(),
      'contact_submissions',
      TG_OP
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for admin access logging (UPDATE/DELETE only)
DROP TRIGGER IF EXISTS contact_submissions_admin_access ON public.contact_submissions;
CREATE TRIGGER contact_submissions_admin_access
AFTER UPDATE OR DELETE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_contact_access();