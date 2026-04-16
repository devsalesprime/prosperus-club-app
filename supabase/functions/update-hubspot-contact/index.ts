/// <reference path="../deno.d.ts" />

// Edge Function: update-hubspot-contact
// PUSH: App → HubSpot
// Atualiza a propriedade 'data_de_nascimento__socio_principal' no contato HubSpot
// quando o sócio insere/altera sua data de nascimento no perfil do app.
// SEGURANÇA: Token HubSpot NUNCA exposto ao frontend. Chamado via fire-and-forget.
// Deployment: supabase functions deploy update-hubspot-contact

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * NOTA: A API CRM v3 do HubSpot padronizou as propriedades do tipo 'date' (apenas data).
 * Elas DEVEM receber uma string no formato 'YYYY-MM-DD'.
 * O envio de timestamps em milissegundos era exigido apenas na v1 (ou para tipos 'datetime').
 */

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (!HUBSPOT_API_KEY) {
        console.error('❌ HUBSPOT_ACCESS_TOKEN not configured')
        return new Response(
            JSON.stringify({ error: 'Server configuration error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        const { email, birth_date } = await req.json()

        if (!email || !birth_date) {
            return new Response(
                JSON.stringify({ error: 'email e birth_date são obrigatórios' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validar formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
            return new Response(
                JSON.stringify({ error: 'birth_date deve estar no formato YYYY-MM-DD' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`📤 PUSH birth_date para HubSpot: ${email} → ${birth_date}`)

        // PATCH via email como identificador (idProperty=email)
        // Não precisamos do contactId — a API aceita email como key primária
        const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`

        const res = await fetch(hubspotUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    data_de_nascimento_: birth_date,
                },
            }),
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error(`❌ HubSpot PATCH failed: ${res.status}`, errText)

            // Não falha catastroficamente — o dado já foi salvo no Supabase
            return new Response(
                JSON.stringify({ success: false, error: `HubSpot error: ${res.status}` }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`✅ HubSpot atualizado com sucesso: ${email}`)

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('💥 update-hubspot-contact error:', message)
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
