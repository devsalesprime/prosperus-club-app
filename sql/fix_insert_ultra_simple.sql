-- ============================================
-- FIX ULTRA-SIMPLES: INSERT sem subconsultas
-- ============================================
-- O problema pode ser que as subconsultas estão causando problemas
-- Vamos criar policies de INSERT puramente simples
-- ============================================

-- 1. DROPAR policies de INSERT atuais
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;
DROP POLICY IF EXISTS "messages_insert" ON messages;

-- 2. RECRIAR com CHECK ultra-simples (apenas TRUE)
-- Isso DEVE funcionar - qualquer autenticado pode inserir

CREATE POLICY "conversations_insert" ON conversations
FOR INSERT TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "cp_insert" ON conversation_participants
FOR INSERT TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "messages_insert" ON messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
);

-- 3. VERIFICAR
SELECT tablename, policyname, cmd, with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
AND cmd = 'INSERT';

SELECT '✅ Policies INSERT ultra-simples criadas!' as status;
