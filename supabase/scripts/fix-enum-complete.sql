-- Complete Enum Recreation Script
-- This script properly recreates the user_role enum with uppercase values
-- Use this if the migration script doesn't work

-- Step 1: Drop the constraint and column temporarily
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 2: Drop and recreate the enum type
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEAM', 'MEMBER');

-- Step 3: Add the column back with the new enum
ALTER TABLE public.profiles 
ADD COLUMN role user_role DEFAULT 'MEMBER' NOT NULL;

-- Step 4: Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'), 'MEMBER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verification
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
