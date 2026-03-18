-- Prosperus Club App - Admin User Seed
-- This script ensures the administrative user exists in Supabase Auth
-- Run this after initial schema setup

-- IMPORTANT: This is a SQL script to document the admin user requirements
-- The actual user creation must be done via Supabase Dashboard or Auth API
-- because we cannot directly insert into auth.users table via SQL

-- Admin User Details:
-- Email: tecnologia@salesprime.com.br
-- Password: 1L/0_C%pAY5u
-- Role: ADMIN

-- After creating the user in Supabase Auth Dashboard, run this to update the profile:

-- First, get the UUID of the admin user from auth.users
-- Then update or insert the profile

-- Example (replace <admin_user_id> with actual UUID from auth.users):
/*
INSERT INTO public.profiles (id, email, name, role, company, job_title, image_url, bio, has_completed_onboarding)
VALUES (
    '<admin_user_id>', -- UUID from auth.users
    'tecnologia@salesprime.com.br',
    'Administrador SalesPrime',
    'admin',
    'SalesPrime',
    'Administrador de Sistema',
    'https://ui-avatars.com/api/?name=Admin+SalesPrime&background=EAB308&color=fff&size=200',
    'Conta administrativa do sistema Prosperus Club',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    name = 'Administrador SalesPrime',
    company = 'SalesPrime',
    job_title = 'Administrador de Sistema',
    has_completed_onboarding = true;
*/

-- Note: The password must be set via Supabase Auth Dashboard or API
-- This cannot be done via SQL for security reasons
