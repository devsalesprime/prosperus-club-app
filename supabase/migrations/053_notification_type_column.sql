-- Migration 053: Add type column to user_notifications
-- Purpose: Support notification type icons in the Notification Center
-- Types: message, event, video, gallery, referral, deal, report, notification

ALTER TABLE public.user_notifications
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notification';

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_user_notifications_type
ON public.user_notifications(type);

COMMENT ON COLUMN public.user_notifications.type IS 'Notification type: message, event, video, gallery, referral, deal, report, notification';
