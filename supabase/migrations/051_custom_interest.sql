-- Migration: Add custom_interest column to profiles
-- Required for the "Outros" interest option where users
-- can specify a custom area of interest.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_interest text;
