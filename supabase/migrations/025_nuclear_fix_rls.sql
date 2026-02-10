-- ============================================
-- SOLUÇÃO DEFINITIVA: Remover TODAS as policies e recriar do zero
-- Execute este script para resolver o erro 406 de uma vez por todas
-- ============================================

-- 1. DESABILITAR RLS temporariamente (apenas para limpeza)
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLICIES EXISTENTES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'conversation_participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 3. REABILITAR RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR APENAS AS POLICIES NECESSÁRIAS

-- Policy 1: Leitura permissiva para usuários autenticados
CREATE POLICY "allow_authenticated_read"
ON conversation_participants FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Inserção - usuário pode adicionar a si mesmo
CREATE POLICY "allow_self_insert"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins podem ver tudo
CREATE POLICY "allow_admin_all"
ON conversation_participants FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- 5. HABILITAR REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
    RAISE NOTICE '✅ Realtime habilitado para conversation_participants';
  ELSE
    RAISE NOTICE '✅ Realtime já estava habilitado';
  END IF;
END $$;

-- 6. VERIFICAR RESULTADO
SELECT 
    'Policies criadas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'conversation_participants';

-- 7. LISTAR POLICIES ATIVAS
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING clause present'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK clause present'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'conversation_participants'
ORDER BY policyname;
