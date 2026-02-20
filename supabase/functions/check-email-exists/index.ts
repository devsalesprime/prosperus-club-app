/// <reference path="../deno.d.ts" />

// Edge Function: check-email-exists
// Verifies if an email already has an account in Supabase profiles table
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

        // Check if email exists in profiles table
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle()

        if (error) {
            console.error('Database query error:', error)
            // Return exists: false on error to fail gracefully
            return new Response(
                JSON.stringify({ exists: false }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ exists: !!data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ exists: false, error: 'Erro interno do servidor' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
