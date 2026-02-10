-- ============================================
-- FIX URGENTE: Policy INSERT para Conversations
-- ============================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR SE COLUNAS EXISTEM (debug)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_blocked', 'blocked_at');

-- 2. GARANTIR QUE TODOS OS PROFILES TÊM is_blocked = FALSE por padrão
UPDATE profiles SET is_blocked = FALSE WHERE is_blocked IS NULL;

-- 3. RECRIAR FUNÇÃO am_i_blocked MAIS ROBUSTA
CREATE OR REPLACE FUNCTION am_i_blocked()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = auth.uid()),
        FALSE  -- Se não encontrar o perfil, retorna FALSE (não bloqueado)
    );
$$;

-- 4. DROPAR E RECRIAR POLICIES DE INSERT

-- conversations
DROP POLICY IF EXISTS "conv_insert" ON conversations;
DROP POLICY IF EXISTS "allow_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;

-- Policy SIMPLES - apenas usuário autenticado pode criar
CREATE POLICY "conv_insert_simple" ON conversations
FOR INSERT TO authenticated
WITH CHECK (
    -- Verificação robusta: COALESCE garante que NULL vira FALSE
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- conversation_participants
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;
DROP POLICY IF EXISTS "allow_insert_cp" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;

CREATE POLICY "cp_insert_simple" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
    COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- messages
DROP POLICY IF EXISTS "msg_insert" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

CREATE POLICY "msg_insert_simple" ON messages
FOR INSERT WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    AND sender_id = auth.uid()
    AND COALESCE((SELECT is_blocked FROM profiles WHERE id = auth.uid()), FALSE) = FALSE
);

-- 5. VERIFICAR POLICIES CRIADAS
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
AND cmd = 'INSERT';

-- 6. VERIFICAR SE SEU USUÁRIO ESTÁ BLOQUEADO (debug)
-- Execute separadamente após tudo para verificar:
-- SELECT id, name, email, is_blocked FROM profiles WHERE id = auth.uid();

SELECT 'Policies de INSERT corrigidas!' as status;
