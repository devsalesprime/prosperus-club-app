-- Migration: Add pitch_video_url column to profiles
-- Description: Stores external video URLs (YouTube, Vimeo, Drive, Loom) for member pitch videos
-- Business Rule: Users send links to support, who inserts via Admin panel

-- Add the pitch_video_url column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pitch_video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pitch_video_url IS 'URL of member pitch video (YouTube, Vimeo, Drive, Loom). Inserted by support via Admin panel.';
