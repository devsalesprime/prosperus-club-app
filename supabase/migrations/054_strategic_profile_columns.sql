-- Migration 054: Strategic Profile Columns
-- Documents columns added to profiles for the PRD v2.1 strategic matching system
-- These columns may already exist in production (added via SQL Editor)
-- Using IF NOT EXISTS to be safe

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS what_i_sell           text,
  ADD COLUMN IF NOT EXISTS what_i_need           text,
  ADD COLUMN IF NOT EXISTS partnership_interests  text[] DEFAULT '{}';
