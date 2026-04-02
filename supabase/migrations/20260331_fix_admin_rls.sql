-- ============================================
-- FIX: Allow CEO and MANAGER roles to update profiles
-- Problema: A política de RLS anterior exigia role = 'ADMIN'
-- e bloqueava atualizações de benefícios (e outras) por diretores (CEO).
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'CEO', 'MANAGER')
    );
$$;
