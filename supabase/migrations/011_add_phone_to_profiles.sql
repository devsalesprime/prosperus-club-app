-- Migration 011: Add phone field to profiles
-- Created: 2026-01-28
-- Description: Adds phone field to profiles table

-- Add phone column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
