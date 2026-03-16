// lib/supabase.ts
// Centralized Supabase client instance — SINGLETON
// This ensures only ONE instance is created even with React StrictMode double-mount

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Singleton guard ──────────────────────────────────────────────────────
// Impede que React Strict Mode ou múltiplos imports criem dois clientes
// que vão disputar o auth lock e gerar AbortError em todos os fetches
let _instance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_instance) {
        _instance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage,
                storageKey: 'prosperus-club-auth',
            },
        });
    }
    return _instance;
}

// Create a single instance with auth persistence
export const supabase = getSupabaseClient();

// Export for convenience
export default supabase;
