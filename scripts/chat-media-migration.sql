-- Chat Media Support Migration
-- Adds media columns to messages table and creates chat-media storage bucket
-- Run in Supabase SQL Editor

-- 1. Add media columns (all nullable, backward compatible)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_filename TEXT;

-- 2. Add check constraint for message_type values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_message_type_check'
    ) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
            CHECK (message_type IN ('text', 'image', 'file'));
    END IF;
END $$;

-- 3. Update content constraint to allow empty content for media messages
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_check
    CHECK (
        (message_type = 'text' AND char_length(content) > 0 AND char_length(content) <= 2000)
        OR (message_type IN ('image', 'file') AND media_url IS NOT NULL)
    );

-- 4. Create chat-media storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS policies
CREATE POLICY "Users can upload chat media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Chat media is publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-media');

-- 6. Index for faster media message queries (optional)
CREATE INDEX IF NOT EXISTS idx_messages_media_type
    ON public.messages (message_type)
    WHERE message_type != 'text';
