-- Drop existing policies
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create simplified and complete policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System and admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NULL) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (user_id = auth.uid())
);