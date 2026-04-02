-- Migration: Add terms acceptance tracking columns to profiles
-- Required for the Onboarding Terms step (step 5 of 6)
-- The onboarding wizard saves timestamps when the user accepts
-- Terms of Use and Privacy Policy during first setup.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at   timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz;
