/// <reference path="../deno.d.ts" />

// Edge Function: check-email-exists
// Verifies if an email already has an account in Supabase profiles table
// Returns: { exists: boolean, has_password: boolean }
// Uses SUPABASE_SERVICE_ROLE_KEY (server-side only — never exposed to client)
// Deployment: supabase functions deploy check-email-exists

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email } = await req.json()

        if (!email || typeof email !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Email obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client with Service Role Key (secure — runs on server only)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const normalizedEmail = email.toLowerCase().trim()

        // 1. Check if email exists in profiles table
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle()

        if (error) {
            console.error('Database query error:', error)
            return new Response(
                JSON.stringify({ exists: false, has_password: false }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!profile) {
            // Not in profiles table — frontend will check HubSpot separately
            return new Response(
                JSON.stringify({ exists: false, has_password: false }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Profile exists — check if user has a password set in auth.users
        let hasPassword = false
        try {
            const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id)
            // If the user has identities with email provider, they have a password
            hasPassword = !!authData?.user?.identities?.some(
                (i: { provider: string }) => i.provider === 'email'
            )
        } catch (e) {
            console.error('Auth check error:', e)
            // Assume has password if we can't check — safer fallback
            hasPassword = true
        }

        return new Response(
            JSON.stringify({ exists: true, has_password: hasPassword }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ exists: false, has_password: false, error: 'Erro interno do servidor' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
