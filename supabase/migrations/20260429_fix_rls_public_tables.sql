-- 20260429_fix_rls_public_tables.sql
-- Enforces Row-Level Security on previously unprotected tables

-- 1. Enable RLS on all vulnerable tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES FOR articles
-- ==========================================
CREATE POLICY "Articles are viewable by authenticated users" 
ON public.articles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to insert articles"
ON public.articles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Allow admins to update articles"
ON public.articles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Allow admins to delete articles"
ON public.articles FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- ==========================================
-- POLICIES FOR gallery_config
-- ==========================================
CREATE POLICY "Gallery config viewable by authenticated users" 
ON public.gallery_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage gallery config"
ON public.gallery_config FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- ==========================================
-- POLICIES FOR hubspot_directory
-- ==========================================
-- Note: Service Role (used by Edge Functions / backend) bypasses RLS automatically.
CREATE POLICY "Hubspot directory viewable by authenticated users" 
ON public.hubspot_directory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage hubspot directory"
ON public.hubspot_directory FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- ==========================================
-- POLICIES FOR member_files
-- ==========================================
CREATE POLICY "Member files viewable by authenticated users" 
ON public.member_files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage member files"
ON public.member_files FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- ==========================================
-- POLICIES FOR video_comments
-- ==========================================
CREATE POLICY "Video comments viewable by authenticated users" 
ON public.video_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.video_comments FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id
);

CREATE POLICY "Users can update their own comments"
ON public.video_comments FOR UPDATE TO authenticated USING (
    auth.uid() = author_id
);

CREATE POLICY "Users can delete their own comments or admins can delete any"
ON public.video_comments FOR DELETE TO authenticated USING (
    auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
