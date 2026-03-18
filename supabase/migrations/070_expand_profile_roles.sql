-- ============================================
-- Migration 070: Expand Profile Roles (ENUM)
-- ============================================
-- The 'role' column uses a PostgreSQL ENUM type 'user_role'.
-- ALTER TYPE ... ADD VALUE is used to add new enum values.
-- Note: ADD VALUE IF NOT EXISTS prevents errors on re-run (PG 9.3+).

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CEO';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ACCOUNT_MANAGER';

-- Documentation
COMMENT ON COLUMN profiles.role IS 'User role enum: ADMIN, CEO, MANAGER, ACCOUNT_MANAGER, TEAM, MEMBER';
