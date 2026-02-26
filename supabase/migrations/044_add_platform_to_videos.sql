-- ============================================
-- Migration 044: Add platform column to videos
-- ============================================
-- The videoService.listVideos() selects `platform` but the column
-- was never created. This causes a 400 Bad Request from PostgREST.
-- 
-- Platform values: 'youtube' | 'vimeo' | 'cursedu' | 'file' | null
-- ============================================

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS platform TEXT;

COMMENT ON COLUMN public.videos.platform IS 
'Video hosting platform: youtube, vimeo, cursedu, file. NULL = auto-detect from video_url.';

-- Verification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'videos' AND column_name = 'platform';

SELECT '✅ Migration 044 completed: platform column added to videos' as status;
