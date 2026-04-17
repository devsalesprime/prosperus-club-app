/// <reference path="../deno.d.ts" />

/**
 * Supabase Edge Function: hubspot-webhook
 * 
 * Purpose: Receive webhooks from HubSpot when contacts/deals are created, updated, or deleted
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
 * - deal.propertyChange → When situacao_do_negocio changes, update associated contacts' is_active
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const HUBSPOT_CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'https://app.prosperusclub.com.br'

// Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Business statuses from custom HubSpot property 'situacao_do_negocio'
const ACTIVE_BUSINESS_STATUSES = ['ativo']

// Deal-level custom properties that hold extra member emails
const DEAL_PARTICIPANT_EMAIL_PROPS = [
    'e_mail___participante_vinculado__01_',
    'c_e_mail',
    'e_mail___participante_vinculado__02_',
    'e_mail___participante_vinculado__03_',
    'e_mail___participante_vinculado__04_',
]

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

    if (!signature && !req.headers.get('X-HubSpot-Signature')) {
        console.warn('⚠️ Missing ALL signature headers')
        return false
    }

    // Anti-replay: reject V3 requests older than 5 minutes (só recusa se tiver timestamp)
    if (timestamp) {
        const requestAge = Date.now() - Number(timestamp)
        if (requestAge > 5 * 60 * 1000) {
            console.warn('⚠️ Request too old:', requestAge, 'ms')
            return false
        }
    }

    // Build the source string per HubSpot v3 spec
    const method = req.method
    // O Edge function muitas vezes pode injetar trailing slashes, mas o app original não tem
    const url = req.url.endsWith('/') ? req.url.slice(0, -1) : req.url
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
        
        if (expected === signature) return true;

        console.warn(`⚠️ V3 validation failed. Expected: ${expected}, Got: ${signature}`);
        
        // --- Fallback para V1/V2 (O Botão "Testar Webhook" usa v1) ---
        const sigV1 = req.headers.get('X-HubSpot-Signature')
        if (sigV1) {
            const v1Source = `${HUBSPOT_CLIENT_SECRET}${body}`
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v1Source))
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const v1Expected = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
            
            if (v1Expected === sigV1) {
                console.log('✅ Approved via V1 Signature (HubSpot Test Button fallback)')
                return true;
            }
        }

        return false
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
        `https://api.hubapi.com/crm/v3/objects/contacts/${objectId}?properties=email,firstname,lastname,company,jobtitle,phone,lifecyclestage,situacao_do_negocio`,
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
    const situacao = (props.situacao_do_negocio || '').toLowerCase()
    const isActive = ACTIVE_BUSINESS_STATUSES.includes(situacao)
    const hubspotId = String(contact.id)

    if (!email) {
        return { success: false, reason: 'Contact has no email' }
    }

    console.log('HubSpot Processing contact:', { email, fullName, situacao, isActive, hubspotId })

    // Check if profile already exists by hubspot_contact_id or email
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, hubspot_contact_id')
        .or(`hubspot_contact_id.eq.${hubspotId},email.eq.${email}`)
        .limit(1)
        .single()
        
    // UNIVERSAL DIRECTORY UPSERT (Shadow Profiles)
    await supabase.from('hubspot_directory').upsert({
        hubspot_id: hubspotId,
        full_name: fullName,
        email,
        company,
        app_profile_id: existingProfile?.id || null,
        is_active: isActive,
        updated_at: new Date().toISOString()
    }, { onConflict: 'hubspot_id' });

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

// ─── Provision Profile by Email ─────────────────────────────────
// Used for deal participant emails that may not be CRM-associated contacts.
// Creates Auth user + profile (if new & active), updates is_active (if existing),
// or deactivates (if inactive). Sends magic link on first creation.

async function provisionProfileByEmail(
    email: string,
    isActive: boolean
): Promise<{ email: string; action: string }> {
    const normalEmail = email.trim().toLowerCase()

    if (!normalEmail || !normalEmail.includes('@')) {
        return { email, action: 'invalid_email' }
    }

    // 1. Check if profile already exists
    const { data: existing } = await supabase
        .from('profiles')
        .select('id, email, is_active')
        .eq('email', normalEmail)
        .maybeSingle()

    if (existing) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', existing.id)

        if (updateError) {
            console.error(`❌ Participant update error (${normalEmail}):`, updateError)
            return { email: normalEmail, action: `error: ${updateError.message}` }
        }
        console.log(`✅ Participant updated: ${normalEmail} → is_active: ${isActive}`)
        return { email: normalEmail, action: 'updated' }
    }

    // 2. No profile — skip if deactivating (nothing to deactivate)
    if (!isActive) {
        console.log(`⏭️ Skipping inactive new participant: ${normalEmail}`)
        return { email: normalEmail, action: 'skipped_inactive' }
    }

    // 3. Create Auth user
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: normalEmail,
        email_confirm: true,
        user_metadata: { source: 'hubspot_deal_participant' },
    })

    if (authError) {
        if (authError.message?.includes('already been registered')) {
            console.log(`⚠️ Auth user exists, upserting profile: ${normalEmail}`)
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const authUser = users?.find((u: { email?: string }) => u.email === normalEmail)
            if (authUser) {
                await supabase.from('profiles').upsert({
                    id: authUser.id,
                    email: normalEmail,
                    name: 'Novo Membro',
                    role: 'MEMBER',
                    is_active: true,
                    has_completed_onboarding: false,
                })
                return { email: normalEmail, action: 'profile_upserted' }
            }
        }
        console.error(`❌ Auth error for ${normalEmail}:`, authError)
        return { email: normalEmail, action: `error: ${authError.message}` }
    }

    // 4. Create profile record
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUser.user.id,
        email: normalEmail,
        name: 'Novo Membro',
        role: 'MEMBER',
        is_active: true,
        has_completed_onboarding: false,
    })

    if (profileError) {
        console.error(`❌ Profile creation error for ${normalEmail}:`, profileError)
        return { email: normalEmail, action: `error: ${profileError.message}` }
    }

    // 5. Magic link for first access
    try {
        await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: normalEmail,
            options: { redirectTo: `${APP_URL}/` },
        })
        console.log(`📧 Magic link sent to participant: ${normalEmail}`)
    } catch (linkErr) {
        console.warn(`⚠️ Magic link failed for ${normalEmail} (non-critical):`, linkErr)
    }

    console.log(`✅ New participant created: ${normalEmail}`)
    return { email: normalEmail, action: 'created' }
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

// ─── Deal Property Changed ──────────────────────────────────────
// situacao_do_negocio lives on the Deal object, not Contact.
// When it changes, we fetch the deal's associated contacts and update is_active.

async function handleDealPropertyChange(eventData: any) {
    const dealId = String(eventData.objectId)
    const propertyName = eventData.propertyName || ''
    const propertyValue = (eventData.propertyValue || '')

    // Properties we react to on Deal objects
    const HANDLED_PROPERTIES = [
        'situacao_do_negocio',
        'data_de_nascimento__socio_principal',
        'amount',
        ...DEAL_PARTICIPANT_EMAIL_PROPS,
    ]

    if (!HANDLED_PROPERTIES.includes(propertyName)) {
        console.log(`⏭️ Deal property '${propertyName}' ignored`)
        return { success: true, action: 'ignored_property', dealId, propertyName }
    }

    // Fetch associated contacts from HubSpot
    const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY') || HUBSPOT_CLIENT_SECRET
    const assocRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/contacts`,
        {
            headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` }
        }
    )

    if (!assocRes.ok) {
        const errText = await assocRes.text()
        console.error('❌ Failed to fetch deal associations:', errText)
        return { success: false, reason: `HubSpot associations API error: ${assocRes.status}` }
    }

    const assocData = await assocRes.json()
    const contactIds: string[] = (assocData.results || []).map((r: any) => String(r.id))

    if (contactIds.length === 0) {
        console.log(`⚠️ Deal ${dealId} has no associated contacts`)
        return { success: true, action: 'no_contacts', dealId }
    }

    console.log(`👥 Deal ${dealId} associated with ${contactIds.length} contact(s): ${contactIds.join(', ')}`)

    // ── Handle situacao_do_negocio ──
    if (propertyName === 'situacao_do_negocio') {
        const isActive = ACTIVE_BUSINESS_STATUSES.includes(propertyValue.toLowerCase())
        console.log(`📋 Deal ${dealId}: situacao_do_negocio = '${propertyValue}' → is_active: ${isActive}`)

        // ── 1. Fetch deal properties to collect participant emails and amount ──
        const dealPropsQuery = ['amount', ...DEAL_PARTICIPANT_EMAIL_PROPS].join(',')
        const dealRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${dealPropsQuery}`,
            { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
        )

        const participantEmails: string[] = []
        let amountValue: number | null = null

        if (dealRes.ok) {
            const dealData = await dealRes.json()
            const dp = dealData.properties || {}
            
            if (dp['amount']) amountValue = parseFloat(dp['amount'])

            for (const prop of DEAL_PARTICIPANT_EMAIL_PROPS) {
                const email = (dp[prop] || '').trim()
                if (email && email.includes('@')) participantEmails.push(email.toLowerCase())
            }
            console.log(`📧 Deal ${dealId} participant emails: ${participantEmails.join(', ') || 'none'}, Amount: ${amountValue}`)
        } else {
            console.warn(`⚠️ Could not fetch deal properties for ${dealId}`)
        }

        // ── 2. Process CRM-associated contacts (existing flow) ──
        const updatedEmails: string[] = []

        for (const contactId of contactIds) {
            try {
                const contactRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email`,
                    { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
                )

                if (!contactRes.ok) {
                    console.warn(`⚠️ Failed to fetch contact ${contactId}`)
                    continue
                }

                const contact = await contactRes.json()
                const email = contact.properties?.email
                if (!email) continue

                const payload: any = { is_active: isActive, updated_at: new Date().toISOString() }
                if (amountValue !== null) {
                    payload.valor_pago_mentoria = amountValue
                }

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(payload)
                    .or(`hubspot_contact_id.eq.${contactId},email.eq.${email}`)

                if (updateError) {
                    console.error(`❌ Failed to update profile for ${email}:`, updateError)
                } else {
                    updatedEmails.push(email)
                    console.log(`✅ CRM contact updated: ${email} → is_active: ${isActive}`)
                }
            } catch (err) {
                console.error(`❌ Error processing contact ${contactId}:`, err)
            }
        }

        // ── 3. Provision deal participant emails (new feature) ──
        const participantResults = await Promise.all(
            participantEmails.map(email => provisionProfileByEmail(email, isActive))
        )
        const provisionedEmails = participantResults.map(r => `${r.email}(${r.action})`)

        return {
            success: true,
            action: 'deal_status_updated',
            dealId,
            situacao: propertyValue,
            isActive,
            updatedCrmEmails: updatedEmails,
            provisionedParticipants: provisionedEmails,
        }
    }

    // ── Handle amount (Update value directly) ──
    if (propertyName === 'amount') {
        const amountValue = propertyValue ? parseFloat(propertyValue) : null
        console.log(`💰 Deal ${dealId}: amount = '${amountValue}'`)
        
        const updatedEmails: string[] = []

        for (const contactId of contactIds) {
            try {
                const contactRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email`,
                    { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
                )

                if (!contactRes.ok) continue

                const contact = await contactRes.json()
                const email = contact.properties?.email
                if (!email) continue

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        valor_pago_mentoria: amountValue,
                        updated_at: new Date().toISOString()
                    })
                    .or(`hubspot_contact_id.eq.${contactId},email.eq.${email}`)

                if (!updateError) {
                    updatedEmails.push(email)
                    console.log(`✅ valor_pago_mentoria updated: ${email} → ${amountValue}`)
                } else {
                    console.error(`❌ Failed to update amount for ${email}:`, updateError)
                }
            } catch (err) {
                console.error(`❌ Error updating amount for contact ${contactId}:`, err)
            }
        }

        return {
            success: true,
            action: 'deal_amount_updated',
            dealId,
            amount: amountValue,
            updatedEmails
        }
    }

    // ── Handle data_de_nascimento__socio_principal ──
    if (propertyName === 'data_de_nascimento__socio_principal') {
        // HubSpot sends dates as YYYY-MM-DD or as a timestamp at midnight UTC
        let birthDateStr: string | null = null

        if (propertyValue) {
            // If it looks like a timestamp (all digits), convert UTC-safe
            if (/^\d{13,}$/.test(propertyValue)) {
                const d = new Date(Number(propertyValue))
                birthDateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            } else if (/^\d{4}-\d{2}-\d{2}/.test(propertyValue)) {
                // Already YYYY-MM-DD format — extract just the date part
                birthDateStr = propertyValue.substring(0, 10)
            } else {
                console.warn(`⚠️ Unexpected birth_date format: ${propertyValue}`)
            }
        }

        console.log(`🎂 Deal ${dealId}: birth_date = '${birthDateStr}'`)

        const updatedEmails: string[] = []

        for (const contactId of contactIds) {
            try {
                const contactRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email`,
                    {
                        headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` }
                    }
                )

                if (!contactRes.ok) {
                    console.warn(`⚠️ Failed to fetch contact ${contactId}`)
                    continue
                }

                const contact = await contactRes.json()
                const email = contact.properties?.email
                if (!email) continue

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        birth_date: birthDateStr,
                        updated_at: new Date().toISOString()
                    })
                    .or(`hubspot_contact_id.eq.${contactId},email.eq.${email}`)

                if (updateError) {
                    console.error(`❌ Failed to update birth_date for ${email}:`, updateError)
                } else {
                    updatedEmails.push(email)
                    console.log(`✅ birth_date updated: ${email} → ${birthDateStr}`)
                }
            } catch (err) {
                console.error(`❌ Error processing contact ${contactId}:`, err)
            }
        }

        return {
            success: true,
            action: 'deal_birth_date_updated',
            dealId,
            birthDate: birthDateStr,
            updatedEmails
        }
    }

    // ── Handle individual participant email property change ──
    // Triggered when admin adds/updates an email on a deal that's already active.
    if (DEAL_PARTICIPANT_EMAIL_PROPS.includes(propertyName)) {
        const newEmail = (propertyValue || '').trim().toLowerCase()
        if (!newEmail || !newEmail.includes('@')) {
            return { success: true, action: 'participant_email_empty', dealId, propertyName }
        }

        // Fetch current deal status to know if we should activate
        const dealStatusRes = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=situacao_do_negocio`,
            { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
        )

        let isActive = false
        if (dealStatusRes.ok) {
            const dealData = await dealStatusRes.json()
            const situacao = (dealData.properties?.situacao_do_negocio || '').toLowerCase()
            isActive = ACTIVE_BUSINESS_STATUSES.includes(situacao)
        } else {
            console.warn(`⚠️ Could not fetch deal status for ${dealId} — defaulting isActive: false`)
        }

        console.log(`📧 Participant email changed on deal ${dealId}: ${newEmail} | deal isActive: ${isActive}`)
        const result = await provisionProfileByEmail(newEmail, isActive)

        return {
            success: true,
            dealId,
            propertyName,
            ...result,
            action: 'participant_email_provisioned',  // sobrepõe result.action
        }
    }

    return { success: true, action: 'no_op', dealId }
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
            } else if (type.includes('deal.propertyChange')) {
                const result = await handleDealPropertyChange(event)
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
