-- ============================================
-- Migration: Add HubSpot Contact ID to Profiles
-- ============================================
-- Purpose: Store HubSpot contact reference for bidirectional sync
-- Author: Antigravity AI
-- Date: 2026-01-30
-- ============================================

-- 1. Add hubspot_contact_id column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT;

-- 2. Add unique constraint (one Supabase profile = one HubSpot contact)
ALTER TABLE public.profiles
ADD CONSTRAINT unique_hubspot_contact_id UNIQUE (hubspot_contact_id);

-- 3. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hubspot_contact_id 
ON public.profiles(hubspot_contact_id) 
WHERE hubspot_contact_id IS NOT NULL;

-- 4. Add comment for documentation
COMMENT ON COLUMN public.profiles.hubspot_contact_id IS 
'HubSpot Contact ID for CRM synchronization. Populated automatically by sync-hubspot Edge Function.';

-- ============================================
-- RLS POLICIES
-- ============================================

-- Allow users to VIEW their own hubspot_contact_id
-- (Already covered by existing SELECT policy, but explicit is better)

-- PREVENT users from UPDATING hubspot_contact_id directly
-- Only Service Role (Edge Functions) can update this field
CREATE POLICY "Users cannot modify hubspot_contact_id"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  -- Allow update only if hubspot_contact_id is NOT being changed
  -- OR if the role is service_role (checked at application level)
  (hubspot_contact_id IS NOT DISTINCT FROM (SELECT hubspot_contact_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'hubspot_contact_id';

SELECT '✅ Migration 018 completed: hubspot_contact_id added to profiles' as status;
