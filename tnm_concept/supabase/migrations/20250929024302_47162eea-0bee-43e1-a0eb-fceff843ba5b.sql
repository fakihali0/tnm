-- Fix contact form security and functionality issues

-- 1. Drop the existing overly restrictive INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contact_submissions;

-- 2. Create a new policy that allows anonymous contact form submissions
-- This is standard practice for contact forms on websites
CREATE POLICY "Allow anonymous contact form submissions" 
ON contact_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Validate email format (basic validation)
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND 
  -- Ensure required fields are not empty
  length(trim(first_name)) > 0
  AND 
  length(trim(last_name)) > 0
  AND 
  length(trim(subject)) > 0
  AND 
  length(trim(message)) >= 10  -- Minimum message length to prevent spam
  AND 
  length(message) <= 5000      -- Maximum message length
  AND
  -- Phone validation (if provided)
  (phone IS NULL OR length(trim(phone)) >= 10)
);

-- 3. Add additional security: Create a function to log contact form security events
CREATE OR REPLACE FUNCTION log_contact_submission_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log security events for contact form submissions
  INSERT INTO security_events (event_type, details, ip_address, user_agent)
  VALUES (
    'contact_form_submission',
    jsonb_build_object(
      'submission_id', NEW.id,
      'email_domain', split_part(NEW.email, '@', 2),
      'has_phone', (NEW.phone IS NOT NULL),
      'message_length', length(NEW.message),
      'timestamp', now()
    ),
    COALESCE(NEW.ip_address, 'unknown'),
    COALESCE(NEW.user_agent, 'unknown')
  );
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger to automatically log contact submissions for security monitoring
DROP TRIGGER IF EXISTS contact_submission_security_log ON contact_submissions;
CREATE TRIGGER contact_submission_security_log
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_contact_submission_security_event();

-- 5. Ensure the admin view policy is bulletproof
DROP POLICY IF EXISTS "Only admins can view contact submissions" ON contact_submissions;
CREATE POLICY "Admins can view contact submissions" 
ON contact_submissions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add policy to allow admins to update submissions (e.g., mark as resolved)
CREATE POLICY "Admins can update contact submissions" 
ON contact_submissions 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Add policy to allow admins to delete spam/inappropriate submissions
CREATE POLICY "Admins can delete contact submissions" 
ON contact_submissions 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));