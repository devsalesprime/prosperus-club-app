-- ============================================
-- MIGRATION: Sistema de Bloqueio de Usuários
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. ADICIONAR COLUNAS DE BLOQUEIO NA TABELA PROFILES
DO $$
BEGIN
    -- is_blocked: flag principal de bloqueio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- blocked_at: timestamp de quando foi bloqueado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_at') THEN
        ALTER TABLE profiles ADD COLUMN blocked_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    
    -- blocked_reason: motivo do bloqueio (opcional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_reason') THEN
        ALTER TABLE profiles ADD COLUMN blocked_reason TEXT DEFAULT NULL;
    END IF;
    
    -- blocked_by: ID do admin que bloqueou
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_by') THEN
        ALTER TABLE profiles ADD COLUMN blocked_by UUID DEFAULT NULL REFERENCES profiles(id);
    END IF;
END $$;

-- 2. CRIAR FUNÇÃO PARA VERIFICAR SE USUÁRIO ESTÁ BLOQUEADO
-- Usada nas policies de RLS para impedir ações de usuários bloqueados
CREATE OR REPLACE FUNCTION is_user_blocked(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = user_id),
        FALSE
    );
$$;

-- Função que verifica se o usuário ATUAL está bloqueado
CREATE OR REPLACE FUNCTION am_i_blocked()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = auth.uid()),
        FALSE
    );
$$;

-- 3. ATUALIZAR POLICY DE INSERT EM MESSAGES
-- Usuários bloqueados NÃO podem enviar mensagens
DROP POLICY IF EXISTS "msg_insert" ON messages;

CREATE POLICY "msg_insert" ON messages
FOR INSERT WITH CHECK (
    -- Deve participar da conversa
    conversation_id IN (SELECT get_my_conversation_ids())
    -- Deve ser o sender
    AND sender_id = auth.uid()
    -- NÃO pode estar bloqueado
    AND NOT am_i_blocked()
);

-- 4. ATUALIZAR POLICY DE INSERT EM CONVERSATIONS
-- Usuários bloqueados NÃO podem criar novas conversas
DROP POLICY IF EXISTS "conv_insert" ON conversations;

CREATE POLICY "conv_insert" ON conversations
FOR INSERT TO authenticated
WITH CHECK (
    -- Usuário NÃO pode estar bloqueado para criar conversa
    NOT am_i_blocked()
);

-- 5. ATUALIZAR POLICY DE INSERT EM CONVERSATION_PARTICIPANTS
-- Usuários bloqueados NÃO podem ser adicionados a conversas ou adicionar outros
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;

CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (
    -- Usuário NÃO pode estar bloqueado
    NOT am_i_blocked()
);

-- 6. GRANTS
GRANT EXECUTE ON FUNCTION is_user_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION am_i_blocked() TO authenticated;

-- 7. ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked) WHERE is_blocked = TRUE;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Migration de bloqueio executada com sucesso!' as status;

-- Verificar colunas criadas:
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_blocked', 'blocked_at', 'blocked_reason', 'blocked_by');
