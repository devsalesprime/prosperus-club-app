-- Migration: Setup Avatars Storage Bucket with RLS Policies
-- Description: Create avatars bucket and configure policies for user profile images
-- Date: 2026-01-28
-- Reference: ETAPA 0 (Parte 2) - Storage Policies

-- ============================================
-- STEP 1: Create Avatars Bucket (if not exists)
-- ============================================

-- Note: Bucket creation is done via Supabase Dashboard or API
-- This is just documentation of the bucket configuration:
-- 
-- Bucket Name: avatars
-- Public: true (images need to be publicly accessible)
-- File Size Limit: 5MB (recommended)
-- Allowed MIME Types: image/jpeg, image/png, image/webp, image/gif

-- ============================================
-- STEP 2: Enable RLS on storage.objects
-- ============================================

-- RLS should already be enabled, but ensure it is
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Drop Existing Policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- ============================================
-- STEP 4: Create Storage Policies
-- ============================================

-- Policy 1: Allow public viewing of avatar images (SELECT)
CREATE POLICY "Avatar images are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to upload avatars (INSERT)
CREATE POLICY "Users can upload their own avatar" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Policy 3: Allow users to update their own avatar (UPDATE)
CREATE POLICY "Users can update their own avatar" 
    ON storage.objects 
    FOR UPDATE 
    USING (
        bucket_id = 'avatars' 
        AND auth.uid() = owner
    ) 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid() = owner
    );

-- Policy 4: Allow users to delete their own avatar (DELETE)
CREATE POLICY "Users can delete their own avatar" 
    ON storage.objects 
    FOR DELETE 
    USING (
        bucket_id = 'avatars' 
        AND auth.uid() = owner
    );

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policies were created
SELECT 
    'Storage Policies Created:' as status;

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- ============================================
-- NOTES
-- ============================================

-- 1. Bucket Creation:
--    - Must be created via Supabase Dashboard: Storage → New Bucket
--    - Name: avatars
--    - Public: YES (checked)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg,image/png,image/webp,image/gif

-- 2. Testing:
--    - Login as any user
--    - Go to Profile → Edit
--    - Click on avatar image
--    - Upload a new image
--    - Should work without 400/401 errors

-- 3. Troubleshooting:
--    - If upload fails with 401: Check if user is authenticated
--    - If upload fails with 403: Check RLS policies
--    - If upload fails with 413: File too large (reduce size)
--    - If upload fails with 415: Invalid file type (use jpg/png)

-- 4. Security:
--    - Users can only update/delete their OWN avatars (owner check)
--    - Anyone can VIEW avatars (public bucket)
--    - Only authenticated users can UPLOAD
--    - File size and type restrictions prevent abuse
