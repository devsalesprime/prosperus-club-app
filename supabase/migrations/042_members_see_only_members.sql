-- ============================================
-- Migration 042: RLS Policy — members_see_only_members
-- ============================================
-- Ensures MEMBER users can only see other MEMBER profiles.
-- ADMIN/TEAM users can see all profiles.
--
-- IMPORTANT: Uses a SECURITY DEFINER function to avoid
-- RLS recursion (a subquery on profiles inside a profiles
-- policy triggers infinite recursion).
--
-- Applied: 25/02/2026
-- ============================================

-- Step 1: Create helper function (bypasses RLS to read own role)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove overly permissive or broken policies
DROP POLICY IF EXISTS "members_see_only_members" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- Step 4: Create the role-aware SELECT policy (NO recursion)
CREATE POLICY "members_see_only_members"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Admin/Team see ALL profiles (via safe function call)
  get_my_role() IN ('ADMIN', 'TEAM')

  OR

  -- Members see only other Members
  role = 'MEMBER'
);

-- Step 5: Ensure UPDATE policy (users edit only their own profile)
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 6: Ensure INSERT policy (users create only their own profile)
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;

CREATE POLICY "users_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());
