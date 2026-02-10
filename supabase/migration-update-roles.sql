-- Migration: Update user_role enum from lowercase to uppercase
-- This migration updates the existing enum values to match the new schema

-- Step 1: Add new enum values (uppercase) to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TEAM';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MEMBER';

-- Step 2: Update existing data to use new values
UPDATE public.profiles SET role = 'ADMIN' WHERE role = 'admin';
UPDATE public.profiles SET role = 'MEMBER' WHERE role = 'member';

-- Step 3: Update default value for the column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'MEMBER';

-- Step 4: Update the trigger function to use new enum value
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'), 'MEMBER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We cannot remove the old enum values ('admin', 'member') without recreating the enum
-- This is safe because we've migrated all data and new inserts will use uppercase values
-- The old values remain in the enum for backward compatibility but won't be used

-- Verification query (run after migration):
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumlabel;
