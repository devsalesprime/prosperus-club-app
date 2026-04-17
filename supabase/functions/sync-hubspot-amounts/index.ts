import { createClient } from 'jsr:@supabase/supabase-js@2'

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        // Fetch all profiles that need syncing (e.g. have a hubspot contact ID but no amount yet, or we want to blanket sync all)
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, hubspot_contact_id, valor_pago_mentoria')
            .not('hubspot_contact_id', 'is', null)

        if (error) throw error
        
        console.log(`Starting sync for ${profiles?.length || 0} profiles`);
        const stats = { synced: 0, skipped: 0, errors: 0 };
        
        for (const profile of profiles || []) {
            try {
                // 1. Get associated deals for this contact
                const assocRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/${profile.hubspot_contact_id}/associations/deals`,
                    { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
                )
                
                if (!assocRes.ok) {
                    stats.skipped++;
                    continue;
                }
                
                const assocData = await assocRes.json()
                const dealIds = (assocData.results || []).map((r: any) => r.id)
                
                if (dealIds.length === 0) {
                    stats.skipped++;
                    continue;
                }
                
                // 2. Fetch all deals and find the most recently modified one
                let bestDeal: any = null;
                
                for (const dealId of dealIds) {
                    const dealRes = await fetch(
                        `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=amount,closedate,situacao_do_negocio`,
                        { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
                    )
                    
                    if (!dealRes.ok) continue;
                    const dealData = await dealRes.json();
                    
                    const dealAmount = parseFloat(dealData.properties?.amount);
                    if (isNaN(dealAmount) || dealAmount <= 0) {
                        continue;
                    }
                    
                    if (!bestDeal) {
                        bestDeal = dealData;
                    } else {
                        const currentCloseDate = new Date(dealData.properties?.closedate || 0).getTime();
                        const bestCloseDate = new Date(bestDeal.properties?.closedate || 0).getTime();
                        if (currentCloseDate > bestCloseDate) {
                            bestDeal = dealData;
                        }
                    }
                }
                
                if (!bestDeal) {
                    stats.errors++;
                    continue;
                }
                
                const props = bestDeal.properties || {};
                
                if (props.amount) {
                    const amountValue = parseFloat(props.amount);
                    if (!isNaN(amountValue)) {
                        // Update the profile if it's different or null
                        if (profile.valor_pago_mentoria !== amountValue) {
                            const { error: updErr } = await supabase
                                .from('profiles')
                                .update({ 
                                    valor_pago_mentoria: amountValue,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', profile.id)
                                
                            if (updErr) throw updErr;
                            console.log(`Updated ${profile.email} amount from HubSpot Deal ${bestDeal.id} -> ${amountValue}`);
                            stats.synced++;
                        } else {
                            stats.skipped++; // Already synced
                        }
                    } else {
                        stats.skipped++;
                    }
                } else {
                    stats.skipped++;
                }

            } catch(e: any) {
                console.error(`Error for ${profile.email}:`, e.message);
                stats.errors++;
            }
            
            // Wait 500ms to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        }

        return new Response(
            JSON.stringify({ success: true, stats }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
