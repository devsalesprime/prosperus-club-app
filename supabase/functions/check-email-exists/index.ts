/// <reference path="../deno.d.ts" />

// Edge Function: check-email-exists
// Verifies if an email already has an account in Supabase profiles table.
// For existing users: also checks HubSpot deal's situacao_do_negocio in real-time
// to determine if the user is still active. Syncs result back to profiles.is_active.
// Deployment: supabase functions deploy check-email-exists

import { createClient } from 'jsr:@supabase/supabase-js@2'

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')
const ACTIVE_STATUSES = ['ativo']

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Check HubSpot deal status for a contact email ──────────────
async function checkHubSpotDealStatus(email: string): Promise<{ isActive: boolean; situacao: string }> {
    if (!HUBSPOT_API_KEY) {
        console.warn('⚠️ HUBSPOT_API_KEY not set — skipping deal check')
        return { isActive: true, situacao: 'unknown' }
    }

    try {
        // 1. Find contact by email
        const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            },
            body: JSON.stringify({
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: email,
                    }],
                }],
                limit: 1,
            }),
        })

        if (!searchRes.ok) {
            console.error('❌ HubSpot contact search failed:', searchRes.status)
            return { isActive: true, situacao: 'api_error' }
        }

        const searchData = await searchRes.json()
        if (!searchData.results || searchData.results.length === 0) {
            console.log(`⚠️ Contact not found in HubSpot: ${email}`)
            return { isActive: true, situacao: 'not_in_hubspot' }
        }

        const contactId = searchData.results[0].id

        // 2. Get associated deals
        const assocRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/deals`,
            { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
        )

        if (!assocRes.ok) {
            console.error('❌ HubSpot deals association failed:', assocRes.status)
            return { isActive: true, situacao: 'api_error' }
        }

        const assocData = await assocRes.json()
        const dealIds: string[] = (assocData.results || []).map((r: any) => String(r.id))

        if (dealIds.length === 0) {
            console.log(`⚠️ No deals found for contact ${contactId}`)
            return { isActive: false, situacao: 'no_deals' }
        }

        // 3. Check situacao_do_negocio on each deal — if ANY deal is "ativo", user is active
        for (const dealId of dealIds) {
            const dealRes = await fetch(
                `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=situacao_do_negocio`,
                { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
            )

            if (!dealRes.ok) continue

            const dealData = await dealRes.json()
            const situacao = (dealData.properties?.situacao_do_negocio || '').toLowerCase()

            console.log(`📋 Deal ${dealId}: situacao_do_negocio = '${situacao}'`)

            if (ACTIVE_STATUSES.includes(situacao)) {
                return { isActive: true, situacao }
            }
        }

        // No active deals found — user should be blocked
        const lastSituacao = 'cancelado/congelado/finalizado/inadimplente'
        console.log(`🚫 No active deals found for ${email}`)
        return { isActive: false, situacao: lastSituacao }

    } catch (err) {
        console.error('❌ HubSpot check error:', err)
        // On error, don't block — fail open
        return { isActive: true, situacao: 'check_error' }
    }
}

// ─── Main Handler ────────────────────────────────────────────────

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
            .select('id, is_active, hubspot_contact_id, role')
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

        // 2. ADMIN/TEAM users bypass HubSpot check — they are always active
        const isAdminOrTeam = profile.role === 'ADMIN' || profile.role === 'TEAM'

        let isActive: boolean
        let situacao: string

        if (isAdminOrTeam) {
            isActive = true
            situacao = 'admin_bypass'
            console.log(`👑 Admin/Team user ${normalizedEmail} — bypassing HubSpot check`)
        } else {
            const hubspotResult = await checkHubSpotDealStatus(normalizedEmail)
            isActive = hubspotResult.isActive
            situacao = hubspotResult.situacao
        }

        console.log(`📊 Real-time status for ${normalizedEmail}: is_active=${isActive} (situacao: ${situacao})`)

        // 3. Sync the result back to profiles table (best-effort)
        if (isActive !== (profile.is_active !== false)) {
            console.log(`🔄 Syncing is_active: ${profile.is_active} → ${isActive}`)
            await supabaseAdmin
                .from('profiles')
                .update({ is_active: isActive, updated_at: new Date().toISOString() })
                .eq('id', profile.id)
        }

        // 4. Check if user has a password set in auth.users
        let hasPassword = false
        try {
            const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id)
            hasPassword = !!authData?.user?.identities?.some(
                (i: { provider: string }) => i.provider === 'email'
            )
        } catch (e) {
            console.error('Auth check error:', e)
            hasPassword = true
        }

        return new Response(
            JSON.stringify({ exists: true, has_password: hasPassword, is_active: isActive }),
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
