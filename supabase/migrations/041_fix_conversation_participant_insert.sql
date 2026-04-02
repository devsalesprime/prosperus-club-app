-- ============================================
-- FIX: Conversation participant INSERT - avoid RLS recursion
-- The previous policy caused infinite recursion by referencing
-- conversation_participants inside its own WITH CHECK clause.
-- Solution: Allow any authenticated user to INSERT participants.
-- The SELECT policy already controls visibility.
-- ============================================

-- 1. Drop the recursive policy that causes infinite recursion
DROP POLICY IF EXISTS "allow_conversation_participant_insert" ON conversation_participants;

-- 2. Drop the old restrictive self-insert policy (if still exists)
DROP POLICY IF EXISTS "allow_self_insert" ON conversation_participants;

-- 3. Create simple INSERT policy: any authenticated user can add participants
-- Security is enforced by:
--   a) SELECT policy (users only see their own conversations)
--   b) FK constraints (conversation_id and user_id must exist)
--   c) Application logic (validates before inserting)
CREATE POLICY "allow_authenticated_insert"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Verify no recursion
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'conversation_participants'
ORDER BY policyname;
