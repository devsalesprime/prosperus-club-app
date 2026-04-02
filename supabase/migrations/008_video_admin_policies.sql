-- Migration: Add RLS policies for video management (Admin/Team only)
-- Allows ADMIN and TEAM users to create, update, and delete videos

-- Policy: Allow admins to insert videos
CREATE POLICY "Allow admins to insert videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Policy: Allow admins to update videos
CREATE POLICY "Allow admins to update videos"
ON public.videos
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);

-- Policy: Allow admins to delete videos
CREATE POLICY "Allow admins to delete videos"
ON public.videos
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'TEAM')
    )
);
