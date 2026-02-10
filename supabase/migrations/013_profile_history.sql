-- Migration 013: Profile Change History
-- Created: 2026-01-28
-- Description: Creates table to track profile changes for audit and moderation

-- Create profile_history table
CREATE TABLE IF NOT EXISTS public.profile_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- What changed
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    
    -- Metadata
    change_type TEXT CHECK (change_type IN ('UPDATE', 'CREATE', 'DELETE')) DEFAULT 'UPDATE',
    ip_address INET,
    user_agent TEXT,
    
    -- Moderation
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profile_history_profile_id ON public.profile_history(profile_id);
CREATE INDEX idx_profile_history_created_at ON public.profile_history(created_at DESC);
CREATE INDEX idx_profile_history_requires_approval ON public.profile_history(requires_approval) WHERE requires_approval = TRUE;

-- RLS Policies
ALTER TABLE public.profile_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own history"
ON public.profile_history FOR SELECT
USING (auth.uid() = profile_id);

-- Admins can view all history
CREATE POLICY "Admins can view all history"
ON public.profile_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- System can insert history (via trigger)
CREATE POLICY "System can insert history"
ON public.profile_history FOR INSERT
WITH CHECK (true);

-- Admins can approve/reject changes
CREATE POLICY "Admins can update history"
ON public.profile_history FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'TEAM')
    )
);

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_change()
RETURNS TRIGGER AS $$
DECLARE
    field_name TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Only log if values actually changed
    IF TG_OP = 'UPDATE' THEN
        -- Check each field
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'name', OLD.name, NEW.name);
        END IF;
        
        IF OLD.bio IS DISTINCT FROM NEW.bio THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'bio', OLD.bio, NEW.bio);
        END IF;
        
        IF OLD.company IS DISTINCT FROM NEW.company THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'company', OLD.company, NEW.company);
        END IF;
        
        IF OLD.job_title IS DISTINCT FROM NEW.job_title THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'job_title', OLD.job_title, NEW.job_title);
        END IF;
        
        IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'image_url', OLD.image_url, NEW.image_url);
        END IF;
        
        IF OLD.tags::text IS DISTINCT FROM NEW.tags::text THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'tags', OLD.tags::text, NEW.tags::text);
        END IF;
        
        IF OLD.socials::text IS DISTINCT FROM NEW.socials::text THEN
            INSERT INTO public.profile_history (profile_id, changed_by, field_name, old_value, new_value)
            VALUES (NEW.id, auth.uid(), 'socials', OLD.socials::text, NEW.socials::text);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS profile_change_trigger ON public.profiles;
CREATE TRIGGER profile_change_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_change();

-- Comments
COMMENT ON TABLE public.profile_history IS 'Tracks all changes made to user profiles for audit and moderation';
COMMENT ON COLUMN public.profile_history.requires_approval IS 'If true, change requires admin approval before being visible';
