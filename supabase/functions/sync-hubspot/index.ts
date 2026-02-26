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

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')
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
 * Format phone to international format required by HubSpot
 * "11984330202" → "+5511984330202"
 * "+5511984330202" → "+5511984330202" (already formatted)
 */
function formatPhoneInternational(phone: string): string {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`
    return `+${digits}`
}

/**
 * Map Supabase profile to HubSpot contact properties
 * Standard HubSpot fields + Prosperus custom properties
 */
function mapProfileToHubSpot(profile: any) {
    const { firstname, lastname } = splitName(profile.name || '')
    const phone = formatPhoneInternational(profile.phone || '')

    // Core HubSpot properties (always exist)
    const properties: Record<string, string> = {
        email: profile.email,
        firstname,
        lastname,
        jobtitle: profile.job_title || '',
        company: profile.company || '',
    }

    // Phone in international format
    if (phone) {
        properties.phone = phone
        properties.mobilephone = phone
    }

    // Custom Prosperus properties → HubSpot internal names
    // These are optional — only sent if properties exist in HubSpot
    if (profile.what_i_sell) properties.produto_servico = profile.what_i_sell
    if (profile.what_i_need) properties.o_que_precisa = profile.what_i_need

    // Social media
    if (profile.socials?.linkedin) properties.hs_linkedin_url = profile.socials.linkedin
    if (profile.socials?.instagram) properties.redes_sociais = profile.socials.instagram
    if (profile.socials?.whatsapp) {
        const whatsappPhone = formatPhoneInternational(profile.socials.whatsapp)
        if (whatsappPhone) properties.hs_whatsapp_phone_number = whatsappPhone
    }

    // Avatar — use twitterprofilephoto as writable photo property
    if (profile.image_url) properties.twitterprofilephoto = profile.image_url

    if (profile.partnership_interests?.length) {
        properties.setores_de_interesse = profile.partnership_interests.join(';')
    }

    return properties
}


/**
 * Upload profile photo to HubSpot File Manager and return the file path (key)
 * HubSpot requires uploading the image first, then setting hs_avatar_filemanager_key
 */
async function uploadAvatarToHubSpot(imageUrl: string, contactEmail: string): Promise<string | null> {
    try {
        // 1. Download the image from Supabase Storage
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
            console.warn('⚠️ Could not download avatar image:', imageResponse.status)
            return null
        }
        const imageBlob = await imageResponse.blob()
        const fileName = `prosperus-avatar-${contactEmail.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`

        // 2. Upload to HubSpot Files API v3
        const formData = new FormData()
        formData.append('file', imageBlob, fileName)
        formData.append('options', JSON.stringify({
            access: 'PUBLIC_NOT_INDEXABLE',
            overwrite: true
        }))
        formData.append('folderPath', '/prosperus-avatars')

        const uploadResponse = await fetch('https://api.hubapi.com/files/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            },
            body: formData
        })

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.warn('⚠️ HubSpot avatar upload failed:', errorText)
            return null
        }

        const fileData = await uploadResponse.json()
        console.log('✅ Avatar uploaded to HubSpot:', fileData.path)
        return fileData.path  // This is the filemanager key
    } catch (err) {
        console.warn('⚠️ Avatar upload error (non-blocking):', err)
        return null
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
