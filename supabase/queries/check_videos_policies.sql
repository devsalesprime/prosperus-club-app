-- Query: Check existing policies on videos table
-- Description: Use this to verify which policies already exist before running migrations
-- Date: 2026-01-28

-- Check all policies on videos table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'videos'
ORDER BY policyname;

-- Alternative: Check if specific policies exist
SELECT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'videos' 
    AND policyname = 'Videos are viewable by everyone'
) AS "select_policy_exists",
EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'videos' 
    AND policyname = 'Admins can insert videos'
) AS "insert_policy_exists",
EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'videos' 
    AND policyname = 'Admins can update videos'
) AS "update_policy_exists",
EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'videos' 
    AND policyname = 'Admins can delete videos'
) AS "delete_policy_exists";

-- Check if RLS is enabled on videos table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'videos';
