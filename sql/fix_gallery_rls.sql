-- Fix RLS for gallery_albums
-- Problema: Policy de INSERT usa subquery em profiles que pode causar recursão RLS

-- 1. Criar função auxiliar SECURITY DEFINER para verificar role
CREATE OR REPLACE FUNCTION public.user_has_admin_role(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role IN ('ADMIN', 'TEAM')
    );
$$;

-- 2. Drop policies antigas
DROP POLICY IF EXISTS "Allow admins to insert gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to update gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to delete gallery albums" ON public.gallery_albums;

-- 3. Recriar policies usando a função helper
CREATE POLICY "Allow admins to insert gallery albums"
ON public.gallery_albums
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_admin_role(auth.uid()));

CREATE POLICY "Allow admins to update gallery albums"
ON public.gallery_albums
FOR UPDATE
TO authenticated
USING (public.user_has_admin_role(auth.uid()));

CREATE POLICY "Allow admins to delete gallery albums"
ON public.gallery_albums
FOR DELETE
TO authenticated
USING (public.user_has_admin_role(auth.uid()));

-- 4. Verificar policies criadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'gallery_albums';
