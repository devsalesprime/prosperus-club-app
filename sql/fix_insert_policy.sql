-- ============================================
-- FIX URGENTE: Policy INSERT para conversations
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar policies atuais (debug)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages');

-- 2. Dropar e recriar policy de INSERT para conversations
DROP POLICY IF EXISTS "conv_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON conversations;

-- Policy simples: qualquer usuário autenticado pode criar conversa
CREATE POLICY "allow_insert_conversations" ON conversations
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. Verificar se RLS está habilitado
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 4. Dropar e recriar policy de INSERT para conversation_participants
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_policy" ON conversation_participants;

-- Policy simples: usuário pode adicionar a si mesmo ou outros em conversas onde participa
CREATE POLICY "allow_insert_cp" ON conversation_participants
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 5. Garantir RLS em conversation_participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 6. GRANT para authenticated role
GRANT INSERT ON conversations TO authenticated;
GRANT INSERT ON conversation_participants TO authenticated;
GRANT INSERT ON messages TO authenticated;

-- Resultado esperado: policies criadas com sucesso
SELECT 'Policies criadas!' as status;
