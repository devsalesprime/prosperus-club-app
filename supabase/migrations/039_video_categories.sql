-- ============================================
-- 039: Video Categories System
-- ============================================
-- Adds structured categories for Academy videos
-- Replaces free-text `category` column with FK relationship

-- 1. Create video_categories table
CREATE TABLE IF NOT EXISTS video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (open — admin uses anon key without session)
CREATE POLICY "video_categories_select_all" ON video_categories FOR SELECT USING (true);
CREATE POLICY "video_categories_insert" ON video_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "video_categories_update" ON video_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "video_categories_delete" ON video_categories FOR DELETE USING (true);

-- 4. Add category_id FK to videos table (nullable — preserves existing data)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES video_categories(id) ON DELETE SET NULL;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
