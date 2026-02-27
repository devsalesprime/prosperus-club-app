-- Migration 046: User Block System
-- Origem: sql/add_user_block_columns.sql
-- Data: 27/02/2026
-- Adds block columns to profiles + helper functions + block-aware chat policies

-- 1. Add block columns to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_at') THEN
        ALTER TABLE profiles ADD COLUMN blocked_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_reason') THEN
        ALTER TABLE profiles ADD COLUMN blocked_reason TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'blocked_by') THEN
        ALTER TABLE profiles ADD COLUMN blocked_by UUID DEFAULT NULL REFERENCES profiles(id);
    END IF;
END $$;

-- 2. Helper function: check if a specific user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = user_id),
        FALSE
    );
$$;

-- 3. Helper function: check if CURRENT user is blocked
CREATE OR REPLACE FUNCTION am_i_blocked()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM profiles WHERE id = auth.uid()),
        FALSE
    );
$$;

-- 4. Grants
GRANT EXECUTE ON FUNCTION is_user_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION am_i_blocked() TO authenticated;

-- 5. Performance index
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked) WHERE is_blocked = TRUE;
