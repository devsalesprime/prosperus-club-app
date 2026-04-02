-- ============================================
-- ADMIN CHAT PERMISSIONS
-- Objetivo: Dar acesso total aos admins para auditoria, suporte e moderação
-- ============================================

-- 0. Adicionar colunas para soft delete (se não existirem)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);

-- 1. Criar função helper para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.user_has_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'ADMIN' OR role = 'TEAM')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Adicionar políticas RLS para ADMIN em CONVERSATIONS
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_select_all_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_delete_conversations" ON conversations;

-- Admin pode ver todas as conversas
CREATE POLICY "admin_select_all_conversations"
ON conversations FOR SELECT
TO authenticated
USING (user_has_admin_role());

-- Admin pode deletar qualquer conversa
CREATE POLICY "admin_delete_conversations"
ON conversations FOR DELETE
TO authenticated
USING (user_has_admin_role());

-- 3. Adicionar políticas RLS para ADMIN em MESSAGES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_select_all_messages" ON messages;
DROP POLICY IF EXISTS "admin_insert_messages" ON messages;
DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
DROP POLICY IF EXISTS "admin_update_messages" ON messages;

-- Admin pode ver todas as mensagens
CREATE POLICY "admin_select_all_messages"
ON messages FOR SELECT
TO authenticated
USING (user_has_admin_role());

-- Admin pode enviar mensagens em qualquer conversa (suporte)
CREATE POLICY "admin_insert_messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (user_has_admin_role());

-- Admin pode deletar qualquer mensagem (moderação)
CREATE POLICY "admin_delete_messages"
ON messages FOR DELETE
TO authenticated
USING (user_has_admin_role());

-- Admin pode atualizar mensagens (editar/moderar)
CREATE POLICY "admin_update_messages"
ON messages FOR UPDATE
TO authenticated
USING (user_has_admin_role())
WITH CHECK (user_has_admin_role());

-- 4. Criar RPC para listar todas as conversas (apenas admin)
CREATE OR REPLACE FUNCTION public.admin_get_all_conversations()
RETURNS TABLE (
    conversation_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    participant_1_id UUID,
    participant_1_name TEXT,
    participant_1_email TEXT,
    participant_1_image TEXT,
    participant_2_id UUID,
    participant_2_name TEXT,
    participant_2_email TEXT,
    participant_2_image TEXT,
    last_message_content TEXT,
    last_message_timestamp TIMESTAMPTZ,
    last_message_sender_id UUID,
    total_messages BIGINT,
    unread_messages BIGINT
) AS $$
BEGIN
    -- Verificar se usuário é admin
    IF NOT user_has_admin_role() THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    WITH conversation_participants_agg AS (
        SELECT 
            cp.conversation_id,
            array_agg(cp.user_id ORDER BY cp.joined_at) as participant_ids,
            array_agg(p.name ORDER BY cp.joined_at) as participant_names,
            array_agg(p.email ORDER BY cp.joined_at) as participant_emails,
            array_agg(p.image_url ORDER BY cp.joined_at) as participant_images
        FROM conversation_participants cp
        JOIN profiles p ON p.id = cp.user_id
        GROUP BY cp.conversation_id
    ),
    last_messages AS (
        SELECT DISTINCT ON (m.conversation_id)
            m.conversation_id,
            m.content as last_content,
            m.created_at as last_timestamp,
            m.sender_id as last_sender_id
        FROM messages m
        ORDER BY m.conversation_id, m.created_at DESC
    ),
    message_counts AS (
        SELECT 
            conversation_id,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_read = false) as unread
        FROM messages
        GROUP BY conversation_id
    )
    SELECT 
        c.id as conversation_id,
        c.created_at,
        c.updated_at,
        cpa.participant_ids[1] as participant_1_id,
        cpa.participant_names[1] as participant_1_name,
        cpa.participant_emails[1] as participant_1_email,
        cpa.participant_images[1] as participant_1_image,
        cpa.participant_ids[2] as participant_2_id,
        cpa.participant_names[2] as participant_2_name,
        cpa.participant_emails[2] as participant_2_email,
        cpa.participant_images[2] as participant_2_image,
        lm.last_content as last_message_content,
        lm.last_timestamp as last_message_timestamp,
        lm.last_sender_id as last_message_sender_id,
        COALESCE(mc.total, 0) as total_messages,
        COALESCE(mc.unread, 0) as unread_messages
    FROM conversations c
    LEFT JOIN conversation_participants_agg cpa ON cpa.conversation_id = c.id
    LEFT JOIN last_messages lm ON lm.conversation_id = c.id
    LEFT JOIN message_counts mc ON mc.conversation_id = c.id
    ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar resultado
SELECT 
    '✅ Admin permissions created' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
AND policyname LIKE 'admin_%';

-- 6. Testar função helper (deve retornar true para admin, false para outros)
SELECT 
    '✅ Testing admin role function' as status,
    user_has_admin_role() as is_admin;
