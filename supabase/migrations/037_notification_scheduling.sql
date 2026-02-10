-- ============================================
-- MIGRATION 037: Notification Scheduling
-- ============================================
-- Add scheduled_for column to notifications table
-- Allows admin to schedule notifications for future delivery

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Index for finding pending scheduled notifications
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled
    ON notifications(scheduled_for)
    WHERE status = 'SCHEDULED';

-- Note: Processing scheduled notifications can be done via:
-- 1. Supabase pg_cron (recommended for production)
-- 2. Admin panel manual trigger
-- 3. Edge Function with periodic invocation
--
-- Example pg_cron job (run in SQL Editor):
-- SELECT cron.schedule('process-scheduled-notifications', '*/5 * * * *',
--   $$
--   UPDATE notifications SET status = 'SENT'
--   WHERE status = 'SCHEDULED' AND scheduled_for <= now();
--   -- Then trigger user_notifications creation via RPC
--   $$
-- );
