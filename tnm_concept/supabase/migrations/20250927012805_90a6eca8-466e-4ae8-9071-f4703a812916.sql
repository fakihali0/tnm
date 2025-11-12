-- Add missing RLS policy for notifications table INSERT operations
-- Only allow system/admin users to create notifications
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- Allow system operations (when no user is authenticated) 
  -- or when user has admin role
  auth.uid() IS NULL OR has_role(auth.uid(), 'admin'::app_role)
);