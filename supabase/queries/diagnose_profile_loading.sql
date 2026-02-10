-- ============================================
-- DIAGNÓSTICO: Verificar se perfil pode ser lido
-- Execute este script para testar se o usuário consegue ler seu próprio perfil
-- ============================================

-- 1. Verificar se você está autenticado
SELECT 
    'Authenticated as:' as status,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Verificar se seu perfil existe
SELECT 
    'Profile exists:' as status,
    id, name, email, role
FROM profiles 
WHERE id = auth.uid();

-- 3. Listar TODAS as policies em profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
