-- ============================================
-- MIGRATION 036: User Favorites System
-- ============================================
-- Generic favorites table for videos, articles, events, members
-- Each user can favorite any entity type with a unique constraint

-- Create the table
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('video', 'article', 'event', 'member')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entity_type, entity_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites(user_id);
-- Index for fast lookups by entity
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON user_favorites(entity_type, entity_id);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own favorites
CREATE POLICY "Users can view own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can see all favorites (for analytics)
CREATE POLICY "Admins can view all favorites"
    ON user_favorites FOR SELECT
    USING (user_has_admin_role(auth.uid()));
