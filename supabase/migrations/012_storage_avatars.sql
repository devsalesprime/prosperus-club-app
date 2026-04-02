-- Migration 012: Setup Supabase Storage for Profile Images
-- Created: 2026-01-28
-- Description: Creates storage bucket for profile avatars

-- IMPORTANT: Storage policies must be created via Supabase Dashboard
-- This migration only creates the bucket

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: After running this migration, create the following policies in Supabase Dashboard:
-- 
-- Policy 1: "Public Access" (SELECT)
--   Target roles: public
--   USING expression: bucket_id = 'avatars'
--
-- Policy 2: "Authenticated users can upload" (INSERT)
--   Target roles: authenticated
--   WITH CHECK expression: bucket_id = 'avatars'
--
-- Policy 3: "Authenticated users can update" (UPDATE)
--   Target roles: authenticated
--   USING expression: bucket_id = 'avatars'
--
-- Policy 4: "Authenticated users can delete" (DELETE)
--   Target roles: authenticated
--   USING expression: bucket_id = 'avatars'
--
-- IMPORTANT: Use simplified policies (bucket_id only) to avoid RLS errors
-- File organization by userId is handled in the application code
