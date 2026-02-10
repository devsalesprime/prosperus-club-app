-- Migration: Create analytics_events table
-- Sistema de Analytics Interno para medir engajamento dos sócios

-- Criar tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    page_url TEXT,
    session_id TEXT,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
ON public.analytics_events (event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
ON public.analytics_events (user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_composite 
ON public.analytics_events (event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow admins to read analytics" ON public.analytics_events;

-- Policy: Allow authenticated users to INSERT their own events (fire and forget)
CREATE POLICY "Allow authenticated users to insert analytics"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
);

-- Policy: Allow only ADMIN/TEAM to SELECT analytics data
CREATE POLICY "Allow admins to read analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Comments
COMMENT ON TABLE public.analytics_events IS 'Stores user behavior analytics events for engagement tracking';
COMMENT ON COLUMN public.analytics_events.event_type IS 'Type of event: APP_OPEN, PAGE_VIEW, VIDEO_START, VIDEO_COMPLETE, ARTICLE_READ, MESSAGE_SENT, etc.';
COMMENT ON COLUMN public.analytics_events.metadata IS 'Additional event-specific data in JSON format';
COMMENT ON COLUMN public.analytics_events.session_id IS 'Unique session identifier to track user journeys';
