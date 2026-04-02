-- =============================================
-- Migration 071: Cleanup chat notifications from bell
-- =============================================
-- Chat messages were incorrectly inserted into user_notifications
-- (the sininho/bell icon). The chat system uses the 'messages' table
-- for unread counts. This cleanup removes all stale chat entries.

DELETE FROM user_notifications WHERE type = 'message';
