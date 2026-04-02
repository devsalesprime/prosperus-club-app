-- ============================================
-- Migration 043: Add is_active to profiles + update RLS
-- ============================================
-- Purpose: Enable member deactivation via HubSpot webhook
-- When a member is deactivated in HubSpot, is_active = false
-- RLS ensures deactivated members lose access automatically
-- ============================================

-- 1. Add is_active column (default true — all existing members stay active)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Index for fast active-member filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
ON public.profiles(is_active)
WHERE is_active = true;

-- 3. Update RLS: members_see_only_members
-- Drop and recreate to include is_active check
DROP POLICY IF EXISTS "members_see_only_members" ON public.profiles;

CREATE POLICY "members_see_only_members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Admins and Team see everyone
  get_my_role() IN ('ADMIN', 'TEAM')
  OR
  -- Members only see other ACTIVE members
  (role = 'MEMBER' AND is_active = true)
);

-- 4. Verification
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'is_active';

SELECT '✅ Migration 043 completed: is_active added to profiles, RLS updated' as status;
