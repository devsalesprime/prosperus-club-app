/// <reference path="../deno.d.ts" />

/**
 * Supabase Edge Function: hubspot-webhook
 * 
 * Purpose: Receive webhooks from HubSpot when contacts are created, updated, or deleted
 * Direction: HubSpot → App (inbound)
 * 
 * Security:
 * - HMAC-SHA256 signature validation (v3)
 * - Anti-replay: reject timestamps > 5min
 * - Service Role key for Supabase operations
 * 
 * Events handled:
 * - contact.creation → Create Supabase Auth user + profile
 * - contact.propertyChange → Update profile fields, lifecycle determines is_active
 * - contact.deletion → Soft-delete: is_active = false
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const HUBSPOT_CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://app.prosperusclub.com.br'

// Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Lifecycle stages that indicate an active member
const ACTIVE_LIFECYCLE_STAGES = ['customer', 'evangelist', 'other']

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hubspot-signature-v3, x-hubspot-request-timestamp',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// ─── Signature Validation ────────────────────────────────────────

async function validateHubSpotSignature(
    req: Request,
    body: string
): Promise<boolean> {
    const signature = req.headers.get('X-HubSpot-Signature-v3')
    const timestamp = req.headers.get('X-HubSpot-Request-Timestamp')

    if (!signature || !timestamp) {
        console.warn('⚠️ Missing signature headers')
        return false
    }

    // Anti-replay: reject requests older than 5 minutes
    const requestAge = Date.now() - Number(timestamp)
    if (requestAge > 5 * 60 * 1000) {
        console.warn('⚠️ Request too old:', requestAge, 'ms')
        return false
    }

    // Build the source string per HubSpot v3 spec
    const method = req.method
    const url = req.url
    const source = `${method}${url}${body}${timestamp}`

    try {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(HUBSPOT_CLIENT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        )
        const sig = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(source)
        )
        const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
        return expected === signature
    } catch (err) {
        console.error('❌ Signature validation error:', err)
        return false
    }
}

// ─── Contact Created or Updated ──────────────────────────────────

async function handleContactCreatedOrUpdated(eventData: any) {
    // HubSpot webhook payload structure varies:
    // - propertyChange events have: objectId, propertyName, propertyValue
    // - creation events have: objectId
    // We need to fetch the full contact from HubSpot API to get all properties

    const objectId = String(eventData.objectId)

    // Fetch full contact from HubSpot API
    const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY') || HUBSPOT_CLIENT_SECRET
    const contactRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${objectId}?properties=email,firstname,lastname,company,jobtitle,phone,lifecyclestage`,
        {
            headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` }
        }
    )

    if (!contactRes.ok) {
        const errText = await contactRes.text()
        console.error('❌ Failed to fetch contact from HubSpot:', errText)
        return { success: false, reason: `HubSpot API error: ${contactRes.status}` }
    }

    const contact = await contactRes.json()
    const props = contact.properties || {}

    const email = props.email
    const firstName = props.firstname || ''
    const lastName = props.lastname || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Novo Membro'
    const company = props.company || ''
    const jobTitle = props.jobtitle || ''
    const phone = props.phone || ''
    const lifecycle = (props.lifecyclestage || '').toLowerCase()
    const isActive = ACTIVE_LIFECYCLE_STAGES.includes(lifecycle)
    const hubspotId = String(contact.id)

    if (!email) {
        return { success: false, reason: 'Contact has no email' }
    }

    console.log('📋 Processing contact:', { email, fullName, lifecycle, isActive, hubspotId })

    // Check if profile already exists by hubspot_contact_id or email
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, hubspot_contact_id')
        .or(`hubspot_contact_id.eq.${hubspotId},email.eq.${email}`)
        .limit(1)
        .single()

    if (existingProfile) {
        // ── UPDATE existing profile ──
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                name: fullName,
                company,
                job_title: jobTitle,
                phone,
                is_active: isActive,
                hubspot_contact_id: hubspotId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id)

        if (updateError) {
            console.error('❌ Profile update error:', updateError)
            return { success: false, reason: updateError.message }
        }

        console.log(`✅ Profile updated: ${email} | active: ${isActive}`)
        return { success: true, action: 'updated', email, isActive }
    }

    // ── CREATE new user (only if active) ──
    if (!isActive) {
        console.log(`⏭️ Skipping inactive contact: ${email}`)
        return { success: true, action: 'skipped_inactive', email }
    }

    // Create user in Supabase Auth
    const { data: newUser, error: authError } = await supabase.auth.admin
        .createUser({
            email,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                company,
                job_title: jobTitle,
                hubspot_id: hubspotId,
            },
        })

    if (authError) {
        // User might already exist in Auth but not have a profile
        if (authError.message?.includes('already been registered')) {
            console.log(`⚠️ Auth user exists, updating profile: ${email}`)
            // Find the auth user and update their profile
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const authUser = users?.find((u: { email?: string }) => u.email === email)
            if (authUser) {
                await supabase.from('profiles').upsert({
                    id: authUser.id,
                    email,
                    name: fullName,
                    company,
                    job_title: jobTitle,
                    phone,
                    role: 'MEMBER',
                    is_active: true,
                    hubspot_contact_id: hubspotId,
                    has_completed_onboarding: false,
                })
                return { success: true, action: 'profile_upserted', email }
            }
        }
        console.error('❌ Auth error:', authError)
        return { success: false, reason: authError.message }
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUser.user.id,
        email,
        name: fullName,
        company,
        job_title: jobTitle,
        phone,
        role: 'MEMBER',
        is_active: true,
        hubspot_contact_id: hubspotId,
        has_completed_onboarding: false,
    })

    if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        return { success: false, reason: profileError.message }
    }

    // Send magic link for first access
    try {
        await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${APP_URL}/` }
        })
        console.log(`📧 Magic link sent to: ${email}`)
    } catch (linkErr) {
        console.warn('⚠️ Magic link failed (non-critical):', linkErr)
    }

    console.log(`✅ New member created: ${email}`)
    return { success: true, action: 'created', email }
}

// ─── Contact Deleted ─────────────────────────────────────────────

async function handleContactDeleted(objectId: string) {
    const hubspotId = String(objectId)

    const { data, error } = await supabase
        .from('profiles')
        .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
        .eq('hubspot_contact_id', hubspotId)
        .select('email')

    if (error) {
        console.error('❌ Deactivation error:', error)
        return { success: false, reason: error.message }
    }

    const email = data?.[0]?.email || 'unknown'
    console.log(`✅ Member deactivated: ${email} (hubspot_id: ${hubspotId})`)
    return { success: true, action: 'deactivated', email }
}

// ─── Main Handler ────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // GET healthcheck (HubSpot connectivity test)
    if (req.method === 'GET') {
        return new Response(
            JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const body = await req.text()

    // Validate HubSpot signature
    const isValid = await validateHubSpotSignature(req, body)
    if (!isValid) {
        console.error('❌ Invalid HubSpot signature — rejecting request')
        return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Parse events
    let events: any[]
    try {
        const parsed = JSON.parse(body)
        events = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return new Response(
            JSON.stringify({ error: 'Invalid JSON' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log(`📨 Received ${events.length} webhook event(s)`)

    const results = []

    for (const event of events) {
        try {
            const type = event.subscriptionType || event.eventType || ''

            console.log(`🔄 Processing event: ${type} | objectId: ${event.objectId}`)

            if (type.includes('contact.creation') || type.includes('contact.propertyChange')) {
                const result = await handleContactCreatedOrUpdated(event)
                results.push(result)
            } else if (type.includes('contact.deletion')) {
                const result = await handleContactDeleted(String(event.objectId))
                results.push(result)
            } else {
                console.log(`⏭️ Ignored event type: ${type}`)
                results.push({ success: true, action: 'ignored', type })
            }
        } catch (err) {
            console.error(`❌ Event processing error:`, err)
            results.push({ success: false, error: String(err) })
        }
    }

    return new Response(
        JSON.stringify({ processed: results.length, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
})
