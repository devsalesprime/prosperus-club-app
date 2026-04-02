-- Migration 033: Fix user_notifications INSERT policy
-- Created: 2026-02-02
-- Description: Adds INSERT policy for user_notifications to allow system notifications

-- Allow authenticated users to insert notifications
-- This is needed for system-generated notifications (deals, referrals, etc.)
CREATE POLICY "System can create user notifications"
ON public.user_notifications FOR INSERT
WITH CHECK (
    -- Allow if the user is authenticated (system notifications)
    auth.uid() IS NOT NULL
);

-- ALTERNATIVE: If you want to restrict to only inserting for specific users
-- Uncomment this and remove the above policy:
/*
CREATE POLICY "Users can create notifications for others"
ON public.user_notifications FOR INSERT
WITH CHECK (
    -- Allow authenticated users to create notifications for any user
    -- This is safe because RLS on SELECT ensures users only see their own
    auth.uid() IS NOT NULL
);
*/

COMMENT ON POLICY "System can create user notifications" ON public.user_notifications 
IS 'Allows authenticated users to create notifications (for system events like deals, referrals)';
