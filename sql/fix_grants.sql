-- ============================================
-- FIX: GRANT permissions para role authenticated
-- ============================================
-- O problema pode ser que a role 'authenticated' não tem
-- permissão de INSERT nas tabelas
-- ============================================

-- 1. GRANT ALL para authenticated em TODAS as tabelas do chat
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

-- 2. GRANT USAGE e SELECT em sequences (para auto-increment se houver)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Confirmar RLS está habilitado
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Verificar policies existentes
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename IN ('conversations', 'conversation_participants', 'messages');

-- 5. Verificar grants
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'conversations'
AND grantee = 'authenticated';

SELECT '✅ GRANTs aplicados!' as status;
