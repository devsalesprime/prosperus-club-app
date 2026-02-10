-- ============================================
-- FIX: Policies para tabela PROFILES
-- ============================================
-- Admins precisam poder atualizar profiles para bloquear usuários
-- ============================================

-- 1. Verificar policies existentes em profiles
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Dropar policies existentes de UPDATE em profiles
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_all" ON profiles;

-- 3. Criar policy para SELECT - todos autenticados podem ver profiles
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (true);

-- 4. Criar policy para UPDATE - usuário pode editar próprio OU admin pode editar qualquer um
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (
    id = auth.uid()  -- próprio perfil
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- 5. Criar policy para INSERT
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT WITH CHECK (true);

-- 6. Verificar
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT '✅ Policies de profiles atualizadas - admins podem editar!' as status;
