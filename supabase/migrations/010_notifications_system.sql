-- Migration 010: Notifications System (RLS and Indexes)
-- Created: 2026-01-28
-- Description: Adds RLS policies and indexes for notifications system

-- 1. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read) WHERE is_read = FALSE;

-- 2. ENABLE RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES for USER_NOTIFICATIONS

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
USING (user_id = auth.uid());

-- Users cannot delete notifications (only admins can)
CREATE POLICY "Users cannot delete notifications"
ON public.user_notifications FOR DELETE
USING (false);

-- 4. RLS POLICIES for NOTIFICATIONS (Admin only)

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- Only admins can create notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- Only admins can update notifications
CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- 5. FUNCTION: Create user notifications for a segment
CREATE OR REPLACE FUNCTION public.create_user_notifications(
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT,
    p_segment TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_user_record RECORD;
BEGIN
    -- Validate segment
    IF p_segment NOT IN ('ALL', 'MEMBERS', 'TEAM', 'ADMIN') THEN
        RAISE EXCEPTION 'Invalid segment: %', p_segment;
    END IF;

    -- Insert notifications based on segment
    IF p_segment = 'ALL' THEN
        INSERT INTO public.user_notifications (user_id, title, message, action_url)
        SELECT id, p_title, p_message, p_action_url
        FROM public.profiles;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    ELSIF p_segment = 'MEMBERS' THEN
        INSERT INTO public.user_notifications (user_id, title, message, action_url)
        SELECT id, p_title, p_message, p_action_url
        FROM public.profiles
        WHERE role = 'MEMBER';
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    ELSIF p_segment = 'TEAM' THEN
        INSERT INTO public.user_notifications (user_id, title, message, action_url)
        SELECT id, p_title, p_message, p_action_url
        FROM public.profiles
        WHERE role IN ('TEAM', 'ADMIN');
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    ELSIF p_segment = 'ADMIN' THEN
        INSERT INTO public.user_notifications (user_id, title, message, action_url)
        SELECT id, p_title, p_message, p_action_url
        FROM public.profiles
        WHERE role = 'ADMIN';
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. COMMENTS
COMMENT ON TABLE public.notifications IS 'Master notifications sent by admins';
COMMENT ON TABLE public.user_notifications IS 'Individual user notification inbox';
COMMENT ON FUNCTION public.create_user_notifications IS 'Creates user notifications for a specific segment';
COMMENT ON COLUMN public.user_notifications.is_read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN public.user_notifications.action_url IS 'Optional URL to redirect when notification is clicked';
