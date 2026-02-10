-- ============================================
-- RLS COMPLETO: Admin Bypass + Fix INSERT para Chat
-- ============================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- 1. ADICIONAR COLUNAS DE SOFT DELETE NA TABELA MESSAGES
-- (Só adiciona se não existirem)
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

-- 2. CRIAR FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN/TEAM
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

-- 3. CRIAR/ATUALIZAR FUNÇÃO PARA OBTER IDs DE CONVERSAS DO USUÁRIO
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

-- 4. LIMPAR POLICIES ANTIGAS
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

-- 5. GARANTIR RLS ATIVO
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES PARA conversations
-- ============================================

-- SELECT: Usuário vê suas conversas OU admin vê todas
CREATE POLICY "conv_select" ON conversations
FOR SELECT USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- INSERT: Qualquer usuário autenticado pode criar
CREATE POLICY "conv_insert" ON conversations
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: Participante ou admin pode atualizar
CREATE POLICY "conv_update" ON conversations
FOR UPDATE USING (
    id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- DELETE: Apenas admin pode deletar conversas
CREATE POLICY "conv_delete" ON conversations
FOR DELETE USING (is_admin_or_team());

-- ============================================
-- POLICIES PARA conversation_participants
-- ============================================

-- SELECT: Usuário vê suas participações OU admin vê todas
CREATE POLICY "cp_select" ON conversation_participants
FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin_or_team()
);

-- INSERT: Usuário autenticado pode inserir
CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (true);

-- DELETE: Usuário pode sair da conversa OU admin pode remover
CREATE POLICY "cp_delete" ON conversation_participants
FOR DELETE USING (
    user_id = auth.uid()
    OR is_admin_or_team()
);

-- ============================================
-- POLICIES PARA messages
-- ============================================

-- SELECT: Participante vê mensagens OU admin vê todas
CREATE POLICY "msg_select" ON messages
FOR SELECT USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- INSERT: Participante pode enviar mensagens
CREATE POLICY "msg_insert" ON messages
FOR INSERT WITH CHECK (
    conversation_id IN (SELECT get_my_conversation_ids())
    AND sender_id = auth.uid()
);

-- UPDATE: Participante pode atualizar (marcar lida) OU admin pode moderar
CREATE POLICY "msg_update" ON messages
FOR UPDATE USING (
    conversation_id IN (SELECT get_my_conversation_ids())
    OR is_admin_or_team()
);

-- DELETE: Apenas admin pode hard delete
CREATE POLICY "msg_delete" ON messages
FOR DELETE USING (is_admin_or_team());

-- ============================================
-- GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION is_admin_or_team() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_conversation_ids() TO authenticated;

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'RLS policies criadas com sucesso!' as status;
