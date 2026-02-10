-- ============================================
-- DIAGNÓSTICO SIMPLIFICADO
-- ============================================
-- Execute TUDO de uma vez
-- ============================================

-- 1. RLS habilitado?
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages');

-- 2. Policies existentes
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, cmd;

-- 3. GRANTs
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'conversations';

-- 4. Usuário atual
SELECT auth.uid() as user_id, auth.role() as user_role;

-- 5. Profile do usuário
SELECT id, name, role, is_blocked FROM profiles WHERE id = auth.uid();
