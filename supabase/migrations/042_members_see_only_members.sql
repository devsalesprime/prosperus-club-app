-- ============================================
-- Migration 042: RLS Policy — members_see_only_members
-- ============================================
-- Ensures MEMBER users can only see other MEMBER profiles.
-- ADMIN/TEAM users can see all profiles.
-- Applied: 25/02/2026
-- ============================================

-- Step 1: Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Remove any overly permissive SELECT policies
-- (a "USING (true)" policy would bypass our new filter)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Step 3: Create the role-aware SELECT policy
DROP POLICY IF EXISTS "members_see_only_members" ON profiles;

CREATE POLICY "members_see_only_members"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Admin/Team can see ALL profiles
  (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  ) IN ('ADMIN', 'TEAM')

  OR

  -- Members can only see other Members
  role = 'MEMBER'
);

-- Step 4: Ensure UPDATE policy exists (users edit only their own profile)
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 5: Ensure INSERT policy exists (users create only their own profile)
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;

CREATE POLICY "users_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================
-- VERIFICATION QUERIES (run manually after applying):
-- ============================================
--
-- 1. Check policies exist:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
--
-- 2. Check RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';
--
-- 3. As MEMBER: should NOT see ADMIN/TEAM:
-- SET request.jwt.claims = '{"sub": "<MEMBER_UUID>", "role": "authenticated"}';
-- SELECT id, name, role FROM profiles WHERE role IN ('ADMIN', 'TEAM');
-- Expected: 0 rows
--
-- 4. As ADMIN: should see ALL:
-- SET request.jwt.claims = '{"sub": "<ADMIN_UUID>", "role": "authenticated"}';
-- SELECT id, name, role FROM profiles;
-- Expected: all rows
