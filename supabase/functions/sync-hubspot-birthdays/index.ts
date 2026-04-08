/// <reference path="../deno.d.ts" />

// Edge Function: sync-hubspot-birthdays
// PULL: HubSpot → App
// Busca contatos do HubSpot onde 'banner_de_aniversario' está preenchido,
// cruza com os perfis no Supabase pelo e-mail e faz UPSERT em birthday_cards.
// Deployment: supabase functions deploy sync-hubspot-birthdays

import { createClient } from 'jsr:@supabase/supabase-js@2'

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Calcula a data de trigger do aniversário para o ano corrente (ou próximo).
 * Usa UTC para evitar bug de day-shift no fuso de Brasília.
 */
function calcScheduledDate(birthDateStr: string): string {
    // birthDateStr é YYYY-MM-DD (vem do Supabase)
    const [, monthStr, dayStr] = birthDateStr.split('-')
    const month = parseInt(monthStr, 10) - 1 // 0-indexed
    const day = parseInt(dayStr, 10)

    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    let scheduled = new Date(Date.UTC(todayUTC.getUTCFullYear(), month, day))
    if (scheduled < todayUTC) {
        // Aniversário já passou este ano → agenda para o próximo
        scheduled = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, month, day))
    }

    return scheduled.toISOString().split('T')[0] // YYYY-MM-DD
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (!HUBSPOT_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'HUBSPOT_ACCESS_TOKEN not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const stats = { found: 0, synced: 0, skipped: 0, errors: 0 }

    try {
        // ── STEP 1: Buscar contatos com banner_de_aniversario preenchido ──
        console.log('🔍 Buscando contatos HubSpot com banner_de_aniversario...')

        let allContacts: Array<{ id: string; properties: Record<string, string> }> = []
        let after: string | undefined = undefined

        // Paginação via cursor
        do {
            const body: Record<string, unknown> = {
                filterGroups: [
                    {
                        filters: [
                            {
                                propertyName: 'banner_de_aniversario',
                                operator: 'HAS_PROPERTY',
                            },
                        ],
                    },
                ],
                properties: ['email', 'banner_de_aniversario'],
                limit: 100,
            }
            if (after) body.after = after

            const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const err = await res.text()
                console.error('❌ HubSpot search error:', res.status, err)
                throw new Error(`HubSpot search failed: ${res.status}`)
            }

            const data = await res.json()
            allContacts = allContacts.concat(data.results || [])
            after = data.paging?.next?.after
        } while (after)

        stats.found = allContacts.length
        console.log(`📋 ${allContacts.length} contatos com banner encontrados`)

        // ── HELPERS: Função para resolver File ID em URL pública ──
        const getHubSpotFileUrl = async (fileId: string): Promise<string | null> => {
            if (fileId.startsWith('http')) return fileId; // Já é URL

            try {
                const res = await fetch(`https://api.hubapi.com/files/v3/files/${fileId}`, {
                    headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` }
                });
                if (!res.ok) {
                    console.error(`❌ Erro requisição arquivo HubSpot ${fileId}: ${res.status}`);
                    return null;
                }
                const data = await res.json();
                return data.url || null;
            } catch (e) {
                console.error(`❌ Exception arquivo HubSpot ${fileId}:`, e);
                return null;
            }
        };

        // ── STEP 2: Para cada contato, cruzar com Supabase e fazer UPSERT ──
        for (const contact of allContacts) {
            const email = (contact.properties.email || '').toLowerCase().trim()
            const bannerIdOrUrl = contact.properties.banner_de_aniversario?.trim()

            if (!email || !bannerIdOrUrl) {
                stats.skipped++
                continue
            }

            // Buscar profile pelo e-mail
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, birth_date')
                .eq('email', email)
                .maybeSingle()

            if (profileError || !profile) {
                console.warn(`⚠️ Perfil não encontrado para: ${email}`)
                stats.skipped++
                continue
            }

            if (!profile.birth_date) {
                console.warn(`⚠️ Sócio sem birth_date: ${email}`)
                stats.skipped++
                continue
            }

            // Converter ID do arquivo HubSpot em URL pública real
            const bannerUrl = await getHubSpotFileUrl(bannerIdOrUrl);
            if (!bannerUrl) {
                console.warn(`⚠️ Imagem do banner não retornou URL válida para: ${email} (Valor: ${bannerIdOrUrl})`);
                stats.skipped++;
                continue;
            }

            const scheduledDate = calcScheduledDate(profile.birth_date)

            console.log(`📅 Agendando para ${email} → ${scheduledDate} | banner: ${bannerUrl.substring(0, 60)}...`)

            // UPSERT: se já existe para este usuário+data, atualiza URL e reseta status
            const { error: upsertError } = await supabase
                .from('birthday_cards')
                .upsert(
                    {
                        user_id: profile.id,
                        image_url: bannerUrl,
                        trigger_date: scheduledDate,
                        is_viewed: false,
                        status: 'scheduled',
                    },
                    { onConflict: 'user_id, trigger_date' }
                )

            if (upsertError) {
                console.error(`❌ UPSERT error for ${email}:`, upsertError)
                stats.errors++
            } else {
                stats.synced++
            }
        }

        console.log('✅ Sync completo:', stats)

        return new Response(
            JSON.stringify({ success: true, stats }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('💥 sync-hubspot-birthdays fatal error:', message)
        return new Response(
            JSON.stringify({ error: message, stats }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
