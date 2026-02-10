-- Migration: Fix RLS Policies for Videos Table
-- Description: Add policies to allow ADMIN to create/update/delete videos
-- Date: 2026-01-28

-- Enable RLS on videos table (if not already enabled)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;

-- Policy 1: Everyone can view videos (SELECT)
CREATE POLICY "Videos are viewable by everyone" 
    ON public.videos 
    FOR SELECT 
    USING (true);

-- Policy 2: Only authenticated users with ADMIN role can insert videos
CREATE POLICY "Admins can insert videos" 
    ON public.videos 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy 3: Only authenticated users with ADMIN role can update videos
CREATE POLICY "Admins can update videos" 
    ON public.videos 
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy 4: Only authenticated users with ADMIN role can delete videos
CREATE POLICY "Admins can delete videos" 
    ON public.videos 
    FOR DELETE 
    USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'videos'
ORDER BY policyname;
