-- ============================================
-- FIX DEFINITIVO: Todas as RLS Policies
-- ============================================
-- Execute ESTE SCRIPT COMPLETO no Supabase SQL Editor
-- ============================================

-- 1. DROPAR TODAS AS POLICIES ANTIGAS (limpar conflitos)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on conversations
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON conversations';
    END LOOP;
    
    -- Drop all policies on conversation_participants
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON conversation_participants';
    END LOOP;
    
    -- Drop all policies on messages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON messages';
    END LOOP;
END $$;

-- 2. RECRIAR FUNÇÃO HELPER (get_my_conversation_ids)
CREATE OR REPLACE FUNCTION get_my_conversation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid();
$$;

-- 3. RECRIAR FUNÇÃO is_admin_or_team
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

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- SELECT: Usuário vê suas conversas OU admin vê todas
CREATE POLICY "conversations_select" ON conversations
FOR SELECT USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- INSERT: Qualquer autenticado pode criar (verificar se não está bloqueado)
CREATE POLICY "conversations_insert" ON conversations
FOR INSERT TO authenticated
WITH CHECK (
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- UPDATE: Participantes ou admins
CREATE POLICY "conversations_update" ON conversations
FOR UPDATE USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- DELETE: Apenas admins
CREATE POLICY "conversations_delete" ON conversations
FOR DELETE USING (
    is_admin_or_team()
);

-- ============================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- ============================================

-- SELECT: Apenas participantes da mesma conversa ou admins
CREATE POLICY "cp_select" ON conversation_participants
FOR SELECT USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- INSERT: Qualquer autenticado pode adicionar (verificar se não está bloqueado)
CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- DELETE: Participantes ou admins
CREATE POLICY "cp_delete" ON conversation_participants
FOR DELETE USING (
    user_id = auth.uid()
    OR is_admin_or_team()
);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- SELECT: Participantes da conversa ou admins
CREATE POLICY "messages_select" ON messages
FOR SELECT USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- INSERT: Apenas participantes, sender deve ser o usuário atual, não bloqueado
CREATE POLICY "messages_insert" ON messages
FOR INSERT WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    AND sender_id = auth.uid()
    AND COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- UPDATE: Apenas admins (para soft delete)
CREATE POLICY "messages_update" ON messages
FOR UPDATE USING (
    is_admin_or_team()
);

-- DELETE: Apenas admins
CREATE POLICY "messages_delete" ON messages
FOR DELETE USING (
    is_admin_or_team()
);

-- ============================================
-- GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION get_my_conversation_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_team() TO authenticated;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Mostrar todas as policies criadas
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, cmd;

SELECT '✅ RLS Policies recriadas com sucesso!' as status;
