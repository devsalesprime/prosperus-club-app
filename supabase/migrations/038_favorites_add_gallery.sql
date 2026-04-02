-- ============================================
-- MIGRATION 038: Add 'gallery' to user_favorites entity_type
-- ============================================
-- Adds 'gallery' as a valid entity_type for the favorites system
-- Required for: Gallery album favoriting feature

-- Drop the old constraint
ALTER TABLE user_favorites 
DROP CONSTRAINT user_favorites_entity_type_check;

-- Re-create with 'gallery' included
ALTER TABLE user_favorites 
ADD CONSTRAINT user_favorites_entity_type_check 
CHECK (entity_type IN ('video', 'article', 'event', 'member', 'gallery'));
