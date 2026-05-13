/**
 * Prosperus Club App - Admin User Seed Script
 * 
 * This script creates the administrative user in Supabase Auth
 * Run with: npx tsx supabase/seed-admin.ts
 * 
 * Requirements:
 * - npm install @supabase/supabase-js dotenv tsx
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_EMAIL = 'tecnologia@salesprime.com.br';
const ADMIN_PASSWORD = '1L/0_C%pAY5u';

async function seedAdminUser() {
    console.log('🌱 Starting Admin User Seed...\n');

    // Initialize Supabase Client with Service Role Key (required for admin operations)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Missing environment variables');
        console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
        console.error('   Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        console.log('📧 Creating admin user:', ADMIN_EMAIL);

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: 'Administrador SalesPrime',
                avatar_url: 'https://ui-avatars.com/api/?name=Admin+SalesPrime&background=EAB308&color=fff&size=200'
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message.includes('already registered')) {
                console.log('⚠️  User already exists, updating password...');

                // Get existing user
                const { data: users } = await supabase.auth.admin.listUsers();
                const existingUser = users?.users.find(u => u.email === ADMIN_EMAIL);

                if (existingUser) {
                    // Update password
                    const { error: updateError } = await supabase.auth.admin.updateUserById(
                        existingUser.id,
                        { password: ADMIN_PASSWORD }
                    );

                    if (updateError) {
                        throw updateError;
                    }

                    console.log('✅ Password updated successfully');

                    // Update profile
                    await updateProfile(supabase, existingUser.id);
                } else {
                    throw new Error('User exists but could not be found');
                }
            } else {
                throw authError;
            }
        } else {
            console.log('✅ Auth user created:', authData.user?.id);

            // Update profile (the trigger should have created it, but we ensure it's correct)
            if (authData.user) {
                await updateProfile(supabase, authData.user.id);
            }
        }

        console.log('\n🎉 Admin user seed completed successfully!');
        console.log('📋 Login credentials:');
        console.log('   Email:', ADMIN_EMAIL);
        console.log('   Password:', ADMIN_PASSWORD);
        console.log('   Role: ADMIN\n');

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Error seeding admin user:', message);
        process.exit(1);
    }
}

async function updateProfile(supabase: any, userId: string) {
    console.log('👤 Updating profile for user:', userId);

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: ADMIN_EMAIL,
            name: 'Administrador SalesPrime',
            role: 'ADMIN',
            company: 'SalesPrime',
            job_title: 'Administrador de Sistema',
            image_url: 'https://ui-avatars.com/api/?name=Admin+SalesPrime&background=EAB308&color=fff&size=200',
            bio: 'Conta administrativa do sistema Prosperus Club',
            has_completed_onboarding: true,
            socials: {},
            tags: ['admin', 'tech'],
            is_featured: false
        }, {
            onConflict: 'id'
        });

    if (profileError) {
        throw profileError;
    }

    console.log('✅ Profile updated successfully');
}

// Run the seed
seedAdminUser();
