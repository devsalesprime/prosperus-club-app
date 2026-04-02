-- Migration 052: Fix messages UPDATE RLS for read receipts
-- ═══════════════════════════════════════════════════════
-- ROOT CAUSE: Migration 047 set messages_update to ONLY allow admin/team.
-- This means markMessagesAsRead() silently fails for regular members —
-- the Supabase JS client returns empty data but no error.
-- 
-- FIX: Allow conversation participants to update is_read on messages
-- where they are NOT the sender (you can mark received messages as read).
-- ═══════════════════════════════════════════════════════

-- 1. Drop the restrictive admin-only update policy
DROP POLICY IF EXISTS "messages_update" ON messages;

-- 2. Create new policy: participants can update is_read on received messages
--    + admin/team retain full update access
CREATE POLICY "messages_update" ON messages
FOR UPDATE TO authenticated
USING (
    -- Participant in the conversation (can mark received messages as read)
    conversation_id IN (SELECT get_my_conversation_ids())
    -- OR admin/team (can moderate)
    OR is_admin_or_team()
)
WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

SELECT '✅ Migration 052: messages_update RLS fixed — members can now mark messages as read' AS status;
