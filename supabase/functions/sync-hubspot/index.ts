/// <reference path="../deno.d.ts" />

/**
 * Supabase Edge Function: sync-hubspot
 * 
 * Purpose: Bidirectional sync between Supabase profiles and HubSpot contacts
 * Trigger: Called after profile updates to keep HubSpot in sync
 * 
 * Flow:
 * 1. Receive profile data from Supabase
 * 2. Check if hubspot_contact_id exists
 *    - YES: Update existing contact (PATCH)
 *    - NO: Search by email, then create or update
 * 3. Save hubspot_contact_id back to Supabase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const HUBSPOT_API_KEY = Deno.env.get('VITE_HUBSPOT_WEBHOOK_SECRET') || Deno.env.get('HUBSPOT_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Split full name into firstname and lastname
 * Example: "João Silva Santos" -> { firstname: "João", lastname: "Silva Santos" }
 */
function splitName(fullName: string): { firstname: string; lastname: string } {
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) {
        return { firstname: parts[0], lastname: '' }
    }
    return {
        firstname: parts[0],
        lastname: parts.slice(1).join(' ')
    }
}

/**
 * Map Supabase profile to HubSpot contact properties
 */
function mapProfileToHubSpot(profile: any) {
    const { firstname, lastname } = splitName(profile.name || '')

    return {
        email: profile.email,
        firstname,
        lastname,
        jobtitle: profile.job_title || '',
        company: profile.company || '',
        phone: profile.phone || '',
        mobilephone: profile.phone || '' // Use same phone for both fields
    }
}

/**
 * Search for contact in HubSpot by email
 */
async function searchContactByEmail(email: string): Promise<any | null> {
    const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search'
    const searchBody = {
        filterGroups: [{
            filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
            }]
        }],
        limit: 1
    }

    const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`
        },
        body: JSON.stringify(searchBody)
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('HubSpot Search Error:', errorText)
        throw new Error('Failed to search HubSpot contact')
    }

    const data = await response.json()
    return data.total > 0 ? data.results[0] : null
}

/**
 * Create new contact in HubSpot
 */
async function createHubSpotContact(properties: any): Promise<string> {
    const createUrl = 'https://api.hubapi.com/crm/v3/objects/contacts'

    const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`
        },
        body: JSON.stringify({ properties })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('HubSpot Create Error:', errorText)
        throw new Error('Failed to create HubSpot contact')
    }

    const data = await response.json()
    console.log('✅ Created HubSpot contact:', data.id)
    return data.id
}

/**
 * Update existing contact in HubSpot
 */
async function updateHubSpotContact(contactId: string, properties: any): Promise<void> {
    const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`

    const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`
        },
        body: JSON.stringify({ properties })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('HubSpot Update Error:', errorText)
        throw new Error('Failed to update HubSpot contact')
    }

    console.log('✅ Updated HubSpot contact:', contactId)
}

/**
 * Update hubspot_contact_id in Supabase profiles table
 */
async function updateSupabaseContactId(userId: string, hubspotContactId: string): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
        .from('profiles')
        .update({ hubspot_contact_id: hubspotContactId })
        .eq('id', userId)

    if (error) {
        console.error('Supabase Update Error:', error)
        throw new Error('Failed to update hubspot_contact_id in Supabase')
    }

    console.log('✅ Updated Supabase profile with hubspot_contact_id:', hubspotContactId)
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { profile } = await req.json()

        if (!profile || !profile.id || !profile.email) {
            throw new Error('Invalid payload: profile.id and profile.email are required')
        }

        if (!HUBSPOT_API_KEY) {
            throw new Error('HUBSPOT_API_KEY not configured')
        }

        console.log('🔄 Syncing profile to HubSpot:', {
            userId: profile.id,
            email: profile.email,
            hasContactId: !!profile.hubspot_contact_id
        })

        // Map profile to HubSpot properties
        const hubspotProperties = mapProfileToHubSpot(profile)

        let hubspotContactId = profile.hubspot_contact_id

        // SCENARIO A: Profile already has hubspot_contact_id
        if (hubspotContactId) {
            console.log('📝 Updating existing HubSpot contact:', hubspotContactId)
            await updateHubSpotContact(hubspotContactId, hubspotProperties)
        }
        // SCENARIO B: No hubspot_contact_id - search or create
        else {
            console.log('🔍 Searching for contact by email:', profile.email)
            const existingContact = await searchContactByEmail(profile.email)

            if (existingContact) {
                // Found existing contact - update it
                hubspotContactId = existingContact.id
                console.log('📝 Found existing contact, updating:', hubspotContactId)
                await updateHubSpotContact(hubspotContactId, hubspotProperties)
            } else {
                // Contact doesn't exist - create new
                console.log('➕ Creating new HubSpot contact')
                hubspotContactId = await createHubSpotContact(hubspotProperties)
            }

            // Save hubspot_contact_id back to Supabase
            await updateSupabaseContactId(profile.id, hubspotContactId)
        }

        return new Response(
            JSON.stringify({
                success: true,
                hubspot_contact_id: hubspotContactId,
                message: 'Profile synced to HubSpot successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Sync Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error)
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
