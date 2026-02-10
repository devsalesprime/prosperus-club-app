-- ============================================
-- FIX: Enable Realtime on Messages Table
-- Problema: Channel error ao subscrever conversas
-- Solução: Habilitar Realtime e corrigir RLS
-- ============================================

-- 1. Verificar se Realtime está habilitado
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename = ANY(
            SELECT tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN 'Enabled'
        ELSE 'Disabled'
    END as realtime_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'conversation_participants')
ORDER BY tablename;

-- 2. Habilitar Realtime nas tabelas de chat
-- Simplesmente adicionar as tabelas à publicação (ignora se já existem)
DO $$
BEGIN
    -- Tentar adicionar cada tabela, ignorando erros se já existir
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'messages already in publication';
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'conversations already in publication';
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'conversation_participants already in publication';
    END;
    
    RAISE NOTICE '✅ Realtime enabled on chat tables';
END $$;

-- 3. Verificar e corrigir políticas RLS em messages
-- Listar policies atuais
SELECT 
    policyname,
    cmd as operation,
    permissive
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- 4. Remover policies problemáticas e criar novas
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable read access for conversation participants" ON messages;

-- 5. Criar policies simples e funcionais
-- Policy 1: Usuários podem ler mensagens de conversas que participam
CREATE POLICY "messages_select_own_conversations"
ON messages FOR SELECT
TO authenticated
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- Policy 2: Usuários podem inserir mensagens em conversas que participam
CREATE POLICY "messages_insert_own_conversations"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- Policy 3: Usuários podem atualizar (marcar como lida) mensagens recebidas
CREATE POLICY "messages_update_received"
ON messages FOR UPDATE
TO authenticated
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(conversation_id, is_read) 
WHERE is_read = false;

-- 7. Verificar resultado
SELECT 
    '✅ Policies criadas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'messages';

-- 8. Verificar Realtime
SELECT 
    '✅ Realtime status:' as status,
    tablename,
    CASE 
        WHEN tablename = ANY(
            SELECT tablename 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime'
        ) THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as realtime
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'conversation_participants')
ORDER BY tablename;
