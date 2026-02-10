-- Migration: Fix duplicate policy error
-- Description: Drop and recreate profile policies to ensure they exist correctly
-- Date: 2026-01-28

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);
