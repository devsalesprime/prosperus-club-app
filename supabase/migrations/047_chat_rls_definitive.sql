-- Migration 047: Chat RLS Definitive
-- Origem: sql/fix_rls_definitive.sql (consolidates 8+ iterative fix scripts)
-- Data: 27/02/2026
-- Complete chat RLS: conversations, participants, messages
-- With admin bypass, block check, helper functions, soft-delete columns, grants

-- 1. Add soft-delete columns to messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'is_deleted') THEN
        ALTER TABLE messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'deleted_by') THEN
        ALTER TABLE messages ADD COLUMN deleted_by UUID DEFAULT NULL REFERENCES profiles(id);
    END IF;
END $$;

-- 2. Helper: check if user is admin or team
CREATE OR REPLACE FUNCTION is_admin_or_team()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'TEAM')
    );
$$;

-- 3. Helper: get conversation IDs for current user
CREATE OR REPLACE FUNCTION get_my_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid();
$$;

-- 4. Drop ALL existing chat policies (clean slate)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', pol.policyname);
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname);
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
    END LOOP;
END $$;

-- 5. Ensure RLS enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ── CONVERSATIONS ──

CREATE POLICY "conversations_select" ON conversations
FOR SELECT USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

CREATE POLICY "conversations_insert" ON conversations
FOR INSERT TO authenticated
WITH CHECK (
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

CREATE POLICY "conversations_update" ON conversations
FOR UPDATE USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

CREATE POLICY "conversations_delete" ON conversations
FOR DELETE USING (is_admin_or_team());

-- ── CONVERSATION_PARTICIPANTS ──

CREATE POLICY "cp_select" ON conversation_participants
FOR SELECT USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

CREATE POLICY "cp_delete" ON conversation_participants
FOR DELETE USING (
    user_id = auth.uid()
    OR is_admin_or_team()
);

-- ── MESSAGES ──

CREATE POLICY "messages_select" ON messages
FOR SELECT USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

CREATE POLICY "messages_insert" ON messages
FOR INSERT WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    AND sender_id = auth.uid()
    AND COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

CREATE POLICY "messages_update" ON messages
FOR UPDATE USING (is_admin_or_team());

CREATE POLICY "messages_delete" ON messages
FOR DELETE USING (is_admin_or_team());

-- ── GRANTS ──

GRANT EXECUTE ON FUNCTION is_admin_or_team() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_conversation_ids() TO authenticated;

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
