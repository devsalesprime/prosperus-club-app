-- Migration 063: Setup Supabase Storage for Prosperus Files
-- Created: 2026-03-17
-- Description: Creates storage bucket for video materials (academy PDFs, PPTs, images)
-- Required by: videoService.uploadVideoMaterial() → storage.from('prosperus-files')

-- Create storage bucket for academy materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('prosperus-files', 'prosperus-files', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES for prosperus-files bucket
-- ============================================
-- These policies are created via SQL to avoid manual dashboard configuration.

-- Policy 1: Public can READ all files (downloads)
CREATE POLICY "Public read access for prosperus-files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'prosperus-files');

-- Policy 2: Authenticated users can UPLOAD files
CREATE POLICY "Authenticated users can upload to prosperus-files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'prosperus-files');

-- Policy 3: Authenticated users can UPDATE files
CREATE POLICY "Authenticated users can update prosperus-files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'prosperus-files');

-- Policy 4: Authenticated users can DELETE files
CREATE POLICY "Authenticated users can delete from prosperus-files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'prosperus-files');
