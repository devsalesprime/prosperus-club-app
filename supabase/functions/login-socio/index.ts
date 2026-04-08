/// <reference path="../deno.d.ts" />

// Mocking Deno/Edge Function environment for documentation/deployment purposes
// Deployment: supabase functions deploy login-socio

// Get API Key from Environment Variables (set via supabase secrets set HUBSPOT_ACCESS_TOKEN=...)
const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_ACCESS_TOKEN') || Deno.env.get('HUBSPOT_API_KEY')

// Propriedades do Deal que armazenam e-mails de participantes vinculados
const PARTICIPANT_EMAIL_PROPS = [
    'e_mail___participante_vinculado__01_',
    'c_e_mail',
    'e_mail___participante_vinculado__02_',
    'e_mail___participante_vinculado__03_',
    'e_mail___participante_vinculado__04_',
]

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Busca Deal onde qualquer propriedade de participante = email ──────────────────
// Retorna o primeiro deal válido (closedwon + comprovante) encontrado.
async function searchDealByParticipantEmail(email: string) {
    // HubSpot: filterGroups são OR'd — cada grupo é uma propriedade diferente
    const filterGroups = PARTICIPANT_EMAIL_PROPS.map(prop => ({
        filters: [{ propertyName: prop, operator: 'EQ', value: email }]
    }))

    const propsToFetch = [
        'dealstage',
        'dealname',
        'situacao_do_negocio',
        'comprovante_de_pagamento_arq',
        'data_de_nascimento__socio_principal',
        'cargo_do_contato',
        'numero_de_telefone',
        ...PARTICIPANT_EMAIL_PROPS,
    ].join(',')

    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
            filterGroups,
            properties: propsToFetch.split(','),
            limit: 10,
        }),
    })

    if (!searchRes.ok) {
        console.error('❌ HubSpot deal search by participant failed:', await searchRes.text())
        return null
    }

    const searchData = await searchRes.json()
    const deals = searchData.results || []

    // Participantes vinculados: valida por situacao_do_negocio = 'ativo'
    // (comprovante_de_pagamento_arq é campo do sócio principal, não dos vinculados)
    for (const deal of deals) {
        const props = deal.properties || {}
        const situacao = (props.situacao_do_negocio || '').toLowerCase()
        const isAtivo = situacao === 'ativo'

        if (isAtivo) {
            // Extrai data de nascimento
            const rawBirthDate = props.data_de_nascimento__socio_principal || ''
            let birthDate = null
            if (/^\d{13,}$/.test(rawBirthDate)) {
                const d = new Date(Number(rawBirthDate))
                birthDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            } else if (/^\d{4}-\d{2}-\d{2}/.test(rawBirthDate)) {
                birthDate = rawBirthDate.substring(0, 10)
            }

            console.log(`✅ Participante vinculado encontrado no deal ${deal.id}: ${email} (${situacao})`)
            return {
                dealId: deal.id,
                dealName: props.dealname || '',
                jobTitle: props.cargo_do_contato || '',
                phone: props.numero_de_telefone || '',
                birthDate,
            }
        }
    }

    console.log(`⚠️ Nenhum deal ativo encontrado para participante: ${email}`)
    return null
}


Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        if (!HUBSPOT_API_KEY) {
            console.error('HUBSPOT_API_KEY is missing')
            throw new Error('Server configuration error: HUBSPOT_API_KEY not set')
        }

        // 1. Search Contact in HubSpot by Email
        const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search'
        const searchBody = {
            filterGroups: [
                {
                    filters: [
                        {
                            propertyName: 'email',
                            operator: 'EQ',
                            value: email,
                        },
                    ],
                },
            ],
            // REMOVED properties filter to get ALL properties including custom ones
            limit: 1,
        }

        const hubspotResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            },
            body: JSON.stringify(searchBody),
        })

        if (!hubspotResponse.ok) {
            const errorText = await hubspotResponse.text()
            console.error('HubSpot API Error:', errorText)
            throw new Error('Failed to query HubSpot')
        }

        const hubspotData = await hubspotResponse.json()

        // 2. Get Contact and Associated Deals
        if (hubspotData.total > 0 && hubspotData.results.length > 0) {
            const contact = hubspotData.results[0]
            const contactId = contact.id

            // Extract contact properties for profile
            const firstName = contact.properties.firstname || ''
            const lastName = contact.properties.lastname || ''
            const fullName = `${firstName} ${lastName}`.trim() || contact.properties.email
            const jobTitle = contact.properties.jobtitle || ''
            const company = contact.properties.company || ''
            const phone = contact.properties.phone || contact.properties.mobilephone || ''

            console.log('📧 Contact found:', {
                id: contactId,
                email: contact.properties.email,
                fullName,
                jobTitle,
                company,
                phone
            })

            // 3. Fetch Associated Deals for this Contact
            const dealsUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/deals`

            const dealsResponse = await fetch(dealsUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                },
            })

            if (!dealsResponse.ok) {
                console.error('Failed to fetch deals for contact')
                return new Response(
                    JSON.stringify({ valid: false, message: 'Erro ao buscar negócios do contato.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }

            const dealsData = await dealsResponse.json()
            console.log('💼 Deals found:', dealsData.results?.length || 0)

            // 4. Check each deal for closedwon status and payment proof
            if (dealsData.results && dealsData.results.length > 0) {
                for (const dealAssociation of dealsData.results) {
                    const dealId = dealAssociation.id

                    // Fetch deal details with properties (including profile data)
                    const dealDetailsUrl = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=dealstage,closedate,amount,comprovante_de_pagamento_arq,cargo_do_contato,numero_de_telefone,dealname,data_de_nascimento__socio_principal`

                    const dealDetailsResponse = await fetch(dealDetailsUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                        },
                    })

                    if (dealDetailsResponse.ok) {
                        const dealDetails = await dealDetailsResponse.json()
                        const dealStage = dealDetails.properties.dealstage
                        const paymentProof = dealDetails.properties.comprovante_de_pagamento_arq

                        console.log('🔍 Deal Validation:', {
                            dealId,
                            dealstage: dealStage,
                            comprovante_de_pagamento_arq: paymentProof,
                            isClosedWon: dealStage === 'closedwon',
                            hasPaymentProof: !!paymentProof && paymentProof.trim() !== ''
                        })

                        // AND Logic: BOTH conditions must be true
                        // 1. dealstage must be "closedwon"
                        // 2. comprovante_de_pagamento_arq must be filled
                        const isClosedWon = dealStage === 'closedwon'
                        const hasPaymentProof = paymentProof && paymentProof.trim() !== ''

                        if (isClosedWon && hasPaymentProof) {
                            const firstName = contact.properties.firstname || ''
                            const lastName = contact.properties.lastname || ''
                            const fullName = `${firstName} ${lastName}`.trim() || contact.properties.email
                            const jobTitle = dealDetails.properties.cargo_do_contato || ''
                            const company = dealDetails.properties.dealname || ''
                            const phone = dealDetails.properties.numero_de_telefone || ''
                            
                            // Extract birth date
                            const rawBirthDate = dealDetails.properties.data_de_nascimento__socio_principal || ''
                            let birthDate = null
                            if (rawBirthDate) {
                                if (/^\d{13,}$/.test(rawBirthDate)) {
                                    const d = new Date(Number(rawBirthDate))
                                    birthDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
                                } else if (/^\d{4}-\d{2}-\d{2}/.test(rawBirthDate)) {
                                    birthDate = rawBirthDate.substring(0, 10)
                                }
                            }

                            console.log('✅ Validation PASSED for:', contact.properties.email)
                            console.log('📋 Profile Data:', {
                                fullName,
                                jobTitle,
                                company,
                                phone,
                                birthDate
                            })

                            return new Response(
                                JSON.stringify({
                                    valid: true,
                                    message: 'User valid',
                                    contactId,
                                    dealId,
                                    profile: {
                                        fullName,
                                        email: contact.properties.email,
                                        jobTitle,
                                        company,
                                        phone,
                                        birthDate
                                    }
                                }),
                                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                            )
                        } else {
                            console.log('❌ Validation FAILED:', {
                                email: contact.properties.email,
                                reason: !isClosedWon ? 'dealstage is not closedwon' : 'payment proof is missing'
                            })
                        }
                    }
                }

                // If we checked all deals and none passed validation
                return new Response(
                    JSON.stringify({ valid: false, message: 'Pagamento não confirmado ou comprovante ausente.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            } else {
                console.log('❌ No deals found for this contact')
                return new Response(
                    JSON.stringify({ valid: false, message: 'Nenhum negócio encontrado para este contato.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
        }

        // 3. Contato não encontrado no HubSpot como CRM contact —
        //    Busca fallback: email pode ser participante vinculado no Deal
        console.log(`⚠️ Contato não encontrado no HubSpot: ${email} — buscando como participante vinculado...`)
        const participantDeal = await searchDealByParticipantEmail(email)

        if (participantDeal) {
            return new Response(
                JSON.stringify({
                    valid: true,
                    message: 'Participante vinculado validado',
                    contactId: null,
                    dealId: participantDeal.dealId,
                    isParticipante: true,  // flag para o frontend saber que é participante
                    profile: {
                        fullName: 'Sócio Participante',  // será preenchido no onboarding
                        email,
                        jobTitle: participantDeal.jobTitle,
                        company: participantDeal.dealName,
                        phone: participantDeal.phone,
                        birthDate: participantDeal.birthDate,
                    },
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Não encontrado nem como contato nem como participante
        return new Response(
            JSON.stringify({ valid: false, message: 'Pagamento não confirmado ou comprovante ausente.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ valid: false, error: error instanceof Error ? error.message : String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
