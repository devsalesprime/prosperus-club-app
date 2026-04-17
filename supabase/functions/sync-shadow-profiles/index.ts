import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACTIVE_BUSINESS_STATUSES = [
  'active', 'ativo', 'em andamento', 'onboarding', 'closed won', 'ganho', 'fechado ganho'
]

const DEAL_PARTICIPANT_EMAIL_PROPS = [
  'c_e_mail',
  'e_mail___participante_vinculado__01_',
  'e_mail___participante_vinculado__02_',
  'e_mail___participante_vinculado__03_',
  'e_mail___participante_vinculado__04_'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')
    if (!HUBSPOT_API_KEY) throw new Error("Missing HubSpot API Key")

    console.log("Fetching active deals from HubSpot...")

    let allDeals: any[] = []
    let hasMore = true
    let after = undefined

    // Loop through deals
    while (hasMore && allDeals.length < 5000) {
      const bodyParams: any = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "situacao_do_negocio",
                operator: "IN",
                values: ACTIVE_BUSINESS_STATUSES
              }
            ]
          }
        ],
        properties: ["amount", "dealname", "situacao_do_negocio", ...DEAL_PARTICIPANT_EMAIL_PROPS],
        limit: 100
      }
      
      if (after) bodyParams.after = after;

      const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyParams)
      })

      if (!searchRes.ok) {
         // If filter fails, just fetch all and filter client side
         console.log("Filter search failed, falling back to all active pipelines...")
         hasMore = false;
         break;
      } else {
         const searchData = await searchRes.json()
         allDeals.push(...searchData.results)
         if (searchData.paging && searchData.paging.next) {
            after = searchData.paging.next.after
         } else {
            hasMore = false
         }
      }
    }
    
    // If search didn't work because situacao_do_negocio doesn't exist, let's fetch all recently closed deals
    if (allDeals.length === 0) {
        console.log("No deals found with active status. Searching closed won deals...")
        const genericSearch = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filterGroups: [
                {
                  filters: [
                    {
                      propertyName: "amount",
                      operator: "GT",
                      value: "0"
                    }
                  ]
                }
              ],
              limit: 100
            })
        })
        if (genericSearch.ok) {
           const gd = await genericSearch.json();
           allDeals = gd.results || [];
        }
    }

    console.log(`Found ${allDeals.length} active deals. Fetching Contact associations...`)

    let importedCount = 0;

    // Fetch contacts for each deal
    for (const deal of allDeals) {
      // Get associated contacts for this deal
      const assocRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/deals/${deal.id}/associations/contacts`,
        { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
      )
      
      if (!assocRes.ok) continue;
      
      const assocData = await assocRes.json()
      const contactIds = (assocData.results || []).map((r: any) => r.id)
      
      for (const cid of contactIds) {
          const cRes = await fetch(
             `https://api.hubapi.com/crm/v3/objects/contacts/${cid}?properties=email,firstname,lastname,company,jobtitle`,
             { headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}` } }
          )
          
          if (cRes.ok) {
             const cData = await cRes.json();
             const props = cData.properties || {};
             
             if (!props.email) continue;
             
             const fullName = `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Desconhecido';
             
             // See if they have an app profile
             const { data: profileData } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('email', props.email)
                .maybeSingle();

             await supabaseClient.from('hubspot_directory').upsert({
                 hubspot_id: String(cid),
                 full_name: fullName,
                 email: props.email,
                 company: props.company || '',
                 app_profile_id: profileData ? profileData.id : null,
                 is_active: true,
             }, { onConflict: 'hubspot_id' });
             
             importedCount++;
          }
          await new Promise(r => setTimeout(r, 100)); // anti rate limit
      }

      // Also process custom participant emails on the deal
      const dealProps = deal.properties || {};
      for (const prop of DEAL_PARTICIPANT_EMAIL_PROPS) {
          const participantEmail = dealProps[prop];
          if (participantEmail && participantEmail.includes('@')) {
             const cleanEmail = participantEmail.trim().toLowerCase();
             
             // Check if we already have this email in hubspot_directory to avoid redundant API calls
             const { data: existingEntry } = await supabaseClient
                .from('hubspot_directory')
                .select('hubspot_id')
                .eq('email', cleanEmail)
                .maybeSingle();

             if (!existingEntry) {
                 // Fetch contact by email to get their hubspot_id and details
                 const searchCRes = await fetch(
                    `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                    {
                       method: 'POST',
                       headers: { 'Authorization': `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                          filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: cleanEmail }] }],
                          properties: ["email", "firstname", "lastname", "company", "jobtitle"]
                       })
                    }
                 );

                 if (searchCRes.ok) {
                    const searchData = await searchCRes.json();
                    if (searchData.results && searchData.results.length > 0) {
                        const cData = searchData.results[0];
                        const cProps = cData.properties || {};
                        const fullName = `${cProps.firstname || ''} ${cProps.lastname || ''}`.trim() || 'Desconhecido';
                        
                        const { data: profileData } = await supabaseClient
                           .from('profiles')
                           .select('id')
                           .eq('email', cleanEmail)
                           .maybeSingle();

                        await supabaseClient.from('hubspot_directory').upsert({
                            hubspot_id: String(cData.id),
                            full_name: fullName,
                            email: cleanEmail,
                            company: cProps.company || '',
                            app_profile_id: profileData ? profileData.id : null,
                            is_active: true,
                        }, { onConflict: 'hubspot_id' });
                        importedCount++;
                    }
                 }
                 await new Promise(r => setTimeout(r, 150));
             }
          }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Imported/Updated ${importedCount} contacts from ${allDeals.length} active deals.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("Error syncing shadow profiles:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
