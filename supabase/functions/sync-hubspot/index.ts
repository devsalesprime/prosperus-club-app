/// <reference path="../deno.d.ts" />

/**
 * Supabase Edge Function: sync-hubspot
 *
 * Bidirectional sync between Supabase profiles and HubSpot contacts.
 *
 * ADR-015: Todas as chamadas HubSpot passam por hubspotFetch (retry/backoff)
 * e o fluxo principal é envolto em withFailureQueue. Falhas após 4 attempts
 * são enfileiradas em hubspot_failed_calls para reprocessamento cron.
 *
 * Response contract: sempre 200, com payload uniforme
 *   { synced, queued, queueId?, hubspot_contact_id?, error? }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
    hubspotFetch,
    withFailureQueue,
    uniformResponse,
} from '../_shared/hubspot-client.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function splitName(fullName: string): { firstname: string; lastname: string } {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { firstname: parts[0], lastname: '' };
    return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

function formatPhoneInternational(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    return `+${digits}`;
}

function mapProfileToHubSpot(profile: any) {
    const { firstname, lastname } = splitName(profile.name || '');
    const phone = formatPhoneInternational(profile.phone || '');

    const ALLOWED_JOBS = [
        'Vice Presidete ou C-Level', 'Gerente', 'Vendedor', 'CEO', 'Sócio/Fundador',
        'Autônomo', 'Não Informado', 'Sócio ou dono de operação comercial',
        'Presidente/CEO', 'Diretor ou Gerente', 'Diretor', 'Outro', 'Dono',
        'Sócio ou CEO', 'Gerente de equipe de vendas',
    ];
    let cargo_2 = 'Outro';
    const jobTitleRaw = profile.job_title || '';
    if (ALLOWED_JOBS.includes(jobTitleRaw)) {
        cargo_2 = jobTitleRaw;
    } else {
        const titleUpper = jobTitleRaw.toUpperCase();
        if (titleUpper.includes('CEO') || titleUpper.includes('C-LEVEL') || titleUpper.includes('PRESIDENTE')) cargo_2 = 'CEO';
        else if (titleUpper.includes('DIRETOR') || titleUpper.includes('HEAD')) cargo_2 = 'Diretor';
        else if (titleUpper.includes('GERENTE') || titleUpper.includes('COORDENADOR')) cargo_2 = 'Gerente';
        else if (titleUpper.includes('SÓCIO') || titleUpper.includes('SOCIO') || titleUpper.includes('FUNDADOR') || titleUpper.includes('DONO')) cargo_2 = 'Sócio/Fundador';
        else if (titleUpper.includes('VENDAS') || titleUpper.includes('VENDEDOR') || titleUpper.includes('COMERCIAL')) cargo_2 = 'Vendedor';
        else if (jobTitleRaw.trim() !== '') cargo_2 = 'Outro';
        else cargo_2 = 'Não Informado';
    }

    const contactProperties: Record<string, string> = {
        email: profile.email,
        firstname,
        lastname,
        nome_do_cliente: profile.name || '',
        jobtitle: jobTitleRaw,
        cargo_na_empresa_2_: cargo_2,
        sobre_voce: profile.bio || '',
    };

    const companyProperties: Record<string, string> = {
        name: profile.company || '',
        nome_fantasia: profile.company || '',
        domain: profile.socials?.website || '',
        website: profile.socials?.website || '',
    };

    if (profile.birth_date) {
        contactProperties.data_de_nascimento_ = profile.birth_date;
        contactProperties.data_de_aniversario = profile.birth_date;
    }
    if (phone) {
        contactProperties.phone = phone;
        contactProperties.mobilephone = phone;
    }
    if (profile.what_i_sell) {
        contactProperties.produto_servico = profile.what_i_sell;
        contactProperties.necessidade = profile.what_i_sell;
    }
    if (profile.what_i_need) {
        contactProperties.o_que_precisa = profile.what_i_need;
        contactProperties.frequencia_de_consumo = profile.what_i_need;
    }

    const formatHubspotOption = (val: string) => val.replace(/ & /g, ' e ');
    const ALLOWED_HUBSPOT_OPTIONS = [
        'Tecnologia e Inovação', 'Saúde e Bem-estar', 'Finanças e Investimentos',
        'Consultoria e Gestão', 'Jurídico e Compliance', 'Agronegócio',
        'Logística e Supply Chain', 'E-commerce e Digital', 'Energia e Sustentabilidade',
        'Food e Beverage', 'Educação', 'Imóveis e Construção',
        'Marketing e Publicidade', 'Indústria e Manufatura', 'Comércio e Varejo',
    ];

    if (profile.tags?.length) {
        const validTags = profile.tags.map(formatHubspotOption).filter((v: string) => ALLOWED_HUBSPOT_OPTIONS.includes(v));
        if (validTags.length > 0) contactProperties.tags_de_interesse = validTags.join(';');
    }

    if (profile.socials?.linkedin) contactProperties.hs_linkedin_url = profile.socials.linkedin;
    if (profile.socials?.instagram) contactProperties.redes_sociais = profile.socials.instagram;
    if (profile.socials?.whatsapp) {
        const whatsappPhone = formatPhoneInternational(profile.socials.whatsapp);
        if (whatsappPhone) contactProperties.hs_whatsapp_phone_number = whatsappPhone;
    }
    if (profile.image_url) contactProperties.avatar_url = profile.image_url;

    if (profile.partnership_interests?.length) {
        const validSectors = profile.partnership_interests.map(formatHubspotOption).filter((v: string) => ALLOWED_HUBSPOT_OPTIONS.includes(v));
        if (validSectors.length > 0) {
            contactProperties.setores_de_interesse = validSectors.join(';');
            contactProperties.setor_de_interesse = validSectors.join(';');
        }
    }

    return { contactProperties, companyProperties };
}

async function searchContactByEmail(email: string): Promise<any | null> {
    const response = await hubspotFetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
            limit: 1,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HubSpot Search ${response.status}: ${errorText.slice(0, 300)}`);
    }
    const data = await response.json();
    return data.total > 0 ? data.results[0] : null;
}

async function createHubSpotContact(properties: any): Promise<string> {
    const response = await hubspotFetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HubSpot Create ${response.status}: ${errorText.slice(0, 300)}`);
    }
    const data = await response.json();
    console.log('✅ Created HubSpot contact:', data.id);
    return data.id;
}

async function updateHubSpotContact(contactId: string, properties: any): Promise<void> {
    const response = await hubspotFetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HubSpot Update ${response.status}: ${errorText.slice(0, 300)}`);
    }
    console.log('✅ Updated HubSpot contact:', contactId);
}

async function getAssociatedCompany(contactId: string): Promise<string | null> {
    const response = await hubspotFetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/company`);
    if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) return data.results[0].id;
    }
    return null;
}

async function createHubSpotCompany(properties: any, associatedContactId: string): Promise<string | void> {
    if (!properties.name && !properties.nome_fantasia) return;
    const cleanProps: any = {};
    for (const k in properties) {
        if (properties[k]) cleanProps[k] = properties[k];
    }

    const response = await hubspotFetch('https://api.hubapi.com/crm/v3/objects/companies', {
        method: 'POST',
        body: JSON.stringify({ properties: cleanProps }),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HubSpot Create Company ${response.status}: ${errText.slice(0, 300)}`);
    }
    const data = await response.json();
    const companyId = data.id;
    console.log('✅ Created HubSpot company:', companyId);

    const assocResp = await hubspotFetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${companyId}/associations/contacts/${associatedContactId}/company_to_contact`,
        { method: 'PUT' }
    );
    if (assocResp.ok) console.log('✅ Associated newly created company to contact:', associatedContactId);
}

async function updateHubSpotCompany(companyId: string, properties: any): Promise<void> {
    const cleanProps: any = {};
    for (const k in properties) {
        if (properties[k]) cleanProps[k] = properties[k];
    }
    if (Object.keys(cleanProps).length === 0) return;

    const response = await hubspotFetch(`https://api.hubapi.com/crm/v3/objects/companies/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: cleanProps }),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HubSpot Update Company ${response.status}: ${errText.slice(0, 300)}`);
    }
    console.log('✅ Updated HubSpot company:', companyId);
}

async function updateSupabaseContactId(userId: string, hubspotContactId: string): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase
        .from('profiles')
        .update({ hubspot_contact_id: hubspotContactId })
        .eq('id', userId);
    if (error) throw new Error('Failed to update hubspot_contact_id in Supabase: ' + error.message);
    console.log('✅ Updated Supabase profile with hubspot_contact_id:', hubspotContactId);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let profile: any;
    try {
        const body = await req.json();
        profile = body.profile;
        if (!profile || !profile.id || !profile.email) {
            return uniformResponse(
                { synced: false, queued: false, error: 'Invalid payload: profile.id and profile.email are required' }
            );
        }
    } catch (e) {
        return uniformResponse(
            { synced: false, queued: false, error: 'Invalid JSON body' }
        );
    }

    console.log('🔄 Syncing profile to HubSpot:', {
        userId: profile.id, email: profile.email, hasContactId: !!profile.hubspot_contact_id,
    });

    const outcome = await withFailureQueue(
        { functionName: 'sync-hubspot', payload: { profile } },
        async () => {
            const { contactProperties, companyProperties } = mapProfileToHubSpot(profile);
            let hubspotContactId = profile.hubspot_contact_id;

            if (hubspotContactId) {
                await updateHubSpotContact(hubspotContactId, contactProperties);
            } else {
                const existingContact = await searchContactByEmail(profile.email);
                if (existingContact) {
                    hubspotContactId = existingContact.id;
                    await updateHubSpotContact(hubspotContactId, contactProperties);
                } else {
                    hubspotContactId = await createHubSpotContact(contactProperties);
                }
                await updateSupabaseContactId(profile.id, hubspotContactId);
            }

            if (hubspotContactId && (companyProperties.name || companyProperties.website)) {
                const companyId = await getAssociatedCompany(hubspotContactId);
                if (companyId) {
                    await updateHubSpotCompany(companyId, companyProperties);
                } else {
                    await createHubSpotCompany(companyProperties, hubspotContactId);
                }
            }

            return hubspotContactId;
        }
    );

    if (outcome.ok) {
        return new Response(
            JSON.stringify({ synced: true, queued: false, hubspot_contact_id: outcome.result }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    return new Response(
        JSON.stringify({ synced: false, queued: !!outcome.queueId, queueId: outcome.queueId, error: outcome.error }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
