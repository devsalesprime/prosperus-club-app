// lib/supabase.ts
// Centralized Supabase client instance
// This ensures only ONE instance is created and shared across the entire app

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single instance with auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage, // Explicitly use localStorage
        storageKey: 'prosperus-club-auth', // Custom key for this app
    }
});

// Export for convenience
export default supabase;
