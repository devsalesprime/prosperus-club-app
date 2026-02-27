-- Migration 048: Gallery RLS Fix
-- Origem: sql/fix_gallery_rls.sql
-- Data: 27/02/2026
-- Uses SECURITY DEFINER function to avoid RLS recursion on admin check

-- 1. Helper function for admin role check (avoids RLS recursion)
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

-- 2. Drop old policies
DROP POLICY IF EXISTS "Allow admins to insert gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to update gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to delete gallery albums" ON public.gallery_albums;

-- 3. Recreate using helper function
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
