-- ============================================
-- FIX DEFINITIVO: Remover recursão nas policies de profiles
-- Problema: Policy de admin causa recursão ao consultar profiles
-- ============================================

-- 1. DESABILITAR RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 3. REABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR APENAS POLICIES ESSENCIAIS SEM RECURSÃO

-- Policy 1: Usuários podem ler seus próprios perfis
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Usuários podem atualizar seus próprios perfis
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Usuários podem inserir seus próprios perfis (primeiro login)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Permitir leitura pública de perfis (para Member Book)
-- Todos os usuários autenticados podem ver todos os perfis
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 5. Verificar resultado
SELECT 
    '✅ Policies criadas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Listar policies
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. Testar leitura
SELECT 
    '✅ Teste:' as status,
    id, name, email, role
FROM profiles 
WHERE id = auth.uid();
