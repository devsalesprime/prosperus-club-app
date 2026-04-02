-- FASE 6 (ATUALIZADA): Multi-Álbum Gallery System
-- Migration: Create gallery_albums table

-- Create the gallery_albums table
CREATE TABLE IF NOT EXISTS public.gallery_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    "embedUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gallery_albums_created_at 
ON public.gallery_albums ("createdAt" DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to insert gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to update gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to delete gallery albums" ON public.gallery_albums;

-- Policy: Allow all authenticated users to read gallery albums
CREATE POLICY "Allow authenticated users to read gallery albums"
ON public.gallery_albums
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow only admins to insert gallery albums
CREATE POLICY "Allow admins to insert gallery albums"
ON public.gallery_albums
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Policy: Allow only admins to update gallery albums
CREATE POLICY "Allow admins to update gallery albums"
ON public.gallery_albums
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Policy: Allow only admins to delete gallery albums
CREATE POLICY "Allow admins to delete gallery albums"
ON public.gallery_albums
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Add comment to table
COMMENT ON TABLE public.gallery_albums IS 'Stores multiple photo gallery albums for events. Each album has a title, description, and embed URL.';

-- Add comments to columns
COMMENT ON COLUMN public.gallery_albums.id IS 'Unique identifier for the gallery album';
COMMENT ON COLUMN public.gallery_albums.title IS 'Title of the event or album (e.g., "Encontro Anual 2024")';
COMMENT ON COLUMN public.gallery_albums.description IS 'Description or comment about the album';
COMMENT ON COLUMN public.gallery_albums."embedUrl" IS 'Embed URL for the gallery (e.g., Pixellu, Google Photos)';
COMMENT ON COLUMN public.gallery_albums."createdAt" IS 'Timestamp when the album was created';
