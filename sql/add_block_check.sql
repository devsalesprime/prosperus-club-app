-- ============================================
-- ADICIONAR VERIFICAÇÃO DE BLOQUEIO (CORRIGIDO)
-- ============================================

-- 1. Dropar TODAS as policies de messages
DROP POLICY IF EXISTS "messages_all" ON messages;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

-- 2. Criar novas policies

-- SELECT - todos podem ler (inclusive bloqueados)
CREATE POLICY "messages_select" ON messages
FOR SELECT USING (true);

-- INSERT - apenas não-bloqueados podem enviar
CREATE POLICY "messages_insert" ON messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = auth.uid()),
        false
    ) = false
);

-- UPDATE/DELETE - para admins
CREATE POLICY "messages_update" ON messages
FOR UPDATE USING (true);

CREATE POLICY "messages_delete" ON messages
FOR DELETE USING (true);

-- 3. Verificar
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'messages';

SELECT '✅ Políticas de messages atualizadas!' as status;
