-- ============================================
-- FIX COMPLETO: RLS para Sistema de Chat
-- ============================================
-- Execute este script INTEIRO no Supabase SQL Editor
-- ============================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE para limpar
ALTER TABLE IF EXISTS conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES EXISTENTES

-- conversation_participants
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', pol.policyname);
    END LOOP;
END $$;

-- conversations
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname);
    END LOOP;
END $$;

-- messages
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
    END LOOP;
END $$;

-- 3. CRIAR FUNÇÃO HELPER (SECURITY DEFINER evita recursão)
DROP FUNCTION IF EXISTS get_my_conversation_ids();

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

-- 4. REABILITAR RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR NOVAS POLICIES SIMPLES

-- ========== conversation_participants ==========
-- SELECT: Ver apenas suas participações
CREATE POLICY "cp_select" ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

-- INSERT: Pode inserir se for você ou se já participa da conversa
CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    OR conversation_id IN (SELECT get_my_conversation_ids())
);

-- DELETE: Só pode remover sua própria participação
CREATE POLICY "cp_delete" ON conversation_participants
FOR DELETE USING (user_id = auth.uid());

-- ========== conversations ==========
-- SELECT: Ver conversas onde você participa
CREATE POLICY "conv_select" ON conversations
FOR SELECT USING (id IN (SELECT get_my_conversation_ids()));

-- INSERT: Qualquer usuário autenticado pode criar
CREATE POLICY "conv_insert" ON conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Pode atualizar conversas onde participa
CREATE POLICY "conv_update" ON conversations
FOR UPDATE USING (id IN (SELECT get_my_conversation_ids()));

-- ========== messages ==========
-- SELECT: Ver mensagens de conversas onde participa
CREATE POLICY "msg_select" ON messages
FOR SELECT USING (conversation_id IN (SELECT get_my_conversation_ids()));

-- INSERT: Pode enviar se participa E é o sender
CREATE POLICY "msg_insert" ON messages
FOR INSERT WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    AND sender_id = auth.uid()
);

-- UPDATE: Pode atualizar (marcar lida) em suas conversas
CREATE POLICY "msg_update" ON messages
FOR UPDATE USING (conversation_id IN (SELECT get_my_conversation_ids()));

-- ============================================
-- GRANT EXECUTE na função para authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION get_my_conversation_ids() TO authenticated;

-- ============================================
-- VERIFICAÇÃO: Execute após para testar
-- ============================================
-- SELECT get_my_conversation_ids();
-- SELECT * FROM conversations LIMIT 5;
-- SELECT * FROM conversation_participants LIMIT 5;
