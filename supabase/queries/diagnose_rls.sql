-- ============================================
-- DIAGNÓSTICO: Verificar todas as políticas RLS
-- Execute este script para ver TODAS as policies ativas
-- ============================================

-- 1. Listar TODAS as policies em conversation_participants
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

-- 2. Verificar se Realtime está habilitado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('conversations', 'conversation_participants', 'messages');

-- 3. Testar query problemática diretamente
-- Substitua os UUIDs pelos valores reais
SELECT user_id 
FROM conversation_participants 
WHERE conversation_id = 'c2fa0bd5-4399-46cc-a0e1-132999d62316'
AND user_id = 'c2f705e9-2f12-4cfd-9201-7420013f36d9';

-- 4. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'conversation_participants';
