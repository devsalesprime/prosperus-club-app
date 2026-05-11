/// <reference path="../deno.d.ts" />

// Edge Function: update-hubspot-contact
// PUSH: App → HubSpot
// Atualiza a propriedade 'data_de_nascimento_' no contato HubSpot quando o
// sócio insere/altera sua data de nascimento no perfil do app.
// ADR-015: hubspotFetch + withFailureQueue. Token nunca exposto ao frontend.

import {
    hubspotFetch,
    withFailureQueue,
} from '../_shared/hubspot-client.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let email: string | undefined;
    let birth_date: string | undefined;
    try {
        const body = await req.json();
        email = body.email;
        birth_date = body.birth_date;
    } catch {
        return new Response(
            JSON.stringify({ synced: false, queued: false, error: 'Invalid JSON body' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (!email || !birth_date) {
        return new Response(
            JSON.stringify({ synced: false, queued: false, error: 'email e birth_date são obrigatórios' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
        return new Response(
            JSON.stringify({ synced: false, queued: false, error: 'birth_date deve estar no formato YYYY-MM-DD' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`📤 PUSH birth_date para HubSpot: ${email} → ${birth_date}`);

    const outcome = await withFailureQueue(
        { functionName: 'update-hubspot-contact', payload: { email, birth_date } },
        async () => {
            const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email!)}?idProperty=email`;
            const res = await hubspotFetch(hubspotUrl, {
                method: 'PATCH',
                body: JSON.stringify({
                    properties: { data_de_nascimento_: birth_date },
                }),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HubSpot PATCH ${res.status}: ${errText.slice(0, 300)}`);
            }
            console.log(`✅ HubSpot atualizado com sucesso: ${email}`);
            return true;
        }
    );

    if (outcome.ok) {
        return new Response(
            JSON.stringify({ synced: true, queued: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    return new Response(
        JSON.stringify({ synced: false, queued: !!outcome.queueId, queueId: outcome.queueId, error: outcome.error }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
