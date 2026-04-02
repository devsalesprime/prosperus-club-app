-- ============================================
-- FIX: Allow ADMIN role to update any profile
-- Problema: Admin cannot update pitch_video_url on other users' profiles
-- because profiles_update_own policy only allows auth.uid() = id
-- ============================================

-- Add policy for ADMIN users to update any profile
-- Uses raw_user_meta_data or profiles.role to check admin status
-- To avoid recursion (profiles querying profiles), we use a security definer function

-- Step 1: Create a helper function to check admin role without recursion
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
        AND role = 'ADMIN'
    );
$$;

-- Step 2: Drop existing admin update policy if any
DROP POLICY IF EXISTS "profiles_admin_update_all" ON profiles;

-- Step 3: Create admin update policy
CREATE POLICY "profiles_admin_update_all"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Verification
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'UPDATE'
ORDER BY policyname;
