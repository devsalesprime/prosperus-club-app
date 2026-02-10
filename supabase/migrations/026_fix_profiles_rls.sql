-- ============================================
-- FIX: Profiles RLS Blocking Reads
-- Problema: fetchProfile() trava porque RLS bloqueia leitura
-- Solução: Garantir que usuários possam ler seus próprios perfis
-- ============================================

-- 1. Listar policies atuais (para debug)
SELECT 
    policyname,
    cmd as operation,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Remover policies problemáticas
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;

-- 3. Criar policy SIMPLES e FUNCIONAL
CREATE POLICY "allow_own_profile_read"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Garantir que usuários possam atualizar seus próprios perfis
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

CREATE POLICY "allow_own_profile_update"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Permitir que admins vejam todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "allow_admin_all_profiles"
ON profiles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- 6. Verificar resultado
SELECT 
    '✅ Policies criadas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. Testar leitura do próprio perfil
SELECT 
    '✅ Teste de leitura:' as status,
    id, name, email, role
FROM profiles 
WHERE id = auth.uid();
