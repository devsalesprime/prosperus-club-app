-- Migration: Fix series_id type from UUID to TEXT
-- Reason: series_id should accept human-readable identifiers like "devolutiva", "curso-vendas-2024"
-- instead of requiring UUIDs

-- Step 1: Alter the column type from UUID to TEXT
ALTER TABLE public.videos 
ALTER COLUMN series_id TYPE TEXT USING series_id::TEXT;

-- Step 2: Update the schema.sql comment for future reference
COMMENT ON COLUMN public.videos.series_id IS 'Human-readable series identifier (e.g., "devolutiva", "curso-vendas-2024")';
