/// <reference path="../deno.d.ts" />

// Edge Function: sync-hubspot-birthdays
// PULL: HubSpot → App
// Busca contatos do HubSpot onde 'banner_de_aniversario' está preenchido,
// cruza com os perfis no Supabase pelo e-mail e faz UPSERT em birthday_cards.
//
// ADR-015: chamadas HubSpot via hubspotFetch (retry/backoff). Falha catastrófica
// (search inteiro) enfileira em hubspot_failed_calls com payload vazio — cron
// reprocessa rodando a função de novo (idempotente).
// Falhas per-contact em getHubSpotFileUrl são tratadas localmente (stats.skipped).
// Fetches para AWS S3 (signed URL download) NÃO são wrappadas — não são HubSpot.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
    hubspotFetch,
    withFailureQueue,
} from '../_shared/hubspot-client.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function calcScheduledDate(birthDateStr: string): string {
    const [, monthStr, dayStr] = birthDateStr.split('-');
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let scheduled = new Date(Date.UTC(todayUTC.getUTCFullYear(), month, day));
    if (scheduled < todayUTC) {
        scheduled = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, month, day));
    }
    return scheduled.toISOString().split('T')[0];
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const stats = { found: 0, synced: 0, skipped: 0, errors: 0 };

    const outcome = await withFailureQueue(
        { functionName: 'sync-hubspot-birthdays', payload: {} },
        async () => {
            console.log('🔍 Buscando contatos HubSpot com banner_de_aniversario...');

            let allContacts: Array<{ id: string; properties: Record<string, string> }> = [];
            let after: string | undefined = undefined;

            // Paginação via cursor — search é o ponto mais exposto a 429
            do {
                const body: Record<string, unknown> = {
                    filterGroups: [
                        { filters: [{ propertyName: 'banner_de_aniversario', operator: 'HAS_PROPERTY' }] },
                    ],
                    properties: ['email', 'banner_de_aniversario', 'data_de_nascimento_'],
                    limit: 100,
                };
                if (after) body.after = after;

                const res = await hubspotFetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const err = await res.text();
                    throw new Error(`HubSpot search ${res.status}: ${err.slice(0, 300)}`);
                }

                const data = await res.json();
                allContacts = allContacts.concat(data.results || []);
                after = data.paging?.next?.after;
            } while (after);

            stats.found = allContacts.length;
            console.log(`📋 ${allContacts.length} contatos com banner encontrados`);

            // Helper: HubSpot File ID → URL pública (com upload p/ Storage)
            // Erros aqui ficam locais (per-contact) — não propagam pra withFailureQueue
            const getHubSpotFileUrl = async (fileOrUrl: string, email: string): Promise<string | null> => {
                let fileId = fileOrUrl;
                const hubspotInternalMatch = fileOrUrl.match(/files\/(\d+)/);
                if (hubspotInternalMatch && hubspotInternalMatch[1]) {
                    fileId = hubspotInternalMatch[1];
                } else if (fileOrUrl.startsWith('http') && !fileOrUrl.includes('crm-properties-file-values')) {
                    return fileOrUrl;
                }

                try {
                    // Signed URL — HubSpot Files API
                    const resSigned = await hubspotFetch(`https://api.hubapi.com/files/v3/files/${fileId}/signed-url`);

                    if (!resSigned.ok) {
                        console.error(`❌ Signed URL HubSpot ${fileId}: ${resSigned.status}`);
                        // Fallback: defaultHostingUrl via meta
                        const resMeta = await hubspotFetch(`https://api.hubapi.com/files/v3/files/${fileId}`);
                        if (!resMeta.ok) return null;
                        const metaData = await resMeta.json();
                        if (!metaData.defaultHostingUrl) return null;

                        // Download direto (não é HubSpot API)
                        const fRes = await fetch(metaData.defaultHostingUrl);
                        if (!fRes.ok) return null;

                        const { error: fUploadError } = await supabase.storage.from('birthday-cards').upload(
                            `${email.replace(/[^a-zA-Z0-9]/g, '_')}-${fileId}.jpg`,
                            await fRes.arrayBuffer(),
                            { contentType: 'image/jpeg', upsert: true }
                        );
                        if (fUploadError) return null;
                        return supabase.storage.from('birthday-cards').getPublicUrl(`${email.replace(/[^a-zA-Z0-9]/g, '_')}-${fileId}.jpg`).data.publicUrl;
                    }

                    const signedData = await resSigned.json();
                    const directAwsUrl = signedData.url;
                    if (!directAwsUrl) throw new Error('Signed URL vazia retornada pela API.');

                    // Download AWS S3 — não wrappar (não é HubSpot)
                    const imgRes = await fetch(directAwsUrl);
                    if (!imgRes.ok) throw new Error(`Download S3 falhou: ${imgRes.status}`);

                    const arrayBuffer = await imgRes.arrayBuffer();
                    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

                    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
                    const fileExt = signedData.extension || 'jpg';
                    const filename = `${safeEmail}-${fileId}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('birthday-cards')
                        .upload(filename, arrayBuffer, { contentType, upsert: true });

                    if (uploadError) {
                        console.error('❌ Upload Storage:', uploadError);
                        return null;
                    }
                    return supabase.storage.from('birthday-cards').getPublicUrl(filename).data.publicUrl;
                } catch (e) {
                    console.error(`❌ getHubSpotFileUrl ${fileId}:`, e);
                    return null;
                }
            };

            for (const contact of allContacts) {
                const email = (contact.properties.email || '').toLowerCase().trim();
                const bannerIdOrUrl = contact.properties.banner_de_aniversario?.trim();
                const rawHubspotDate = contact.properties.data_de_nascimento_;

                if (!email || !bannerIdOrUrl) {
                    stats.skipped++;
                    continue;
                }

                let hubspotBirthDateStr: string | null = null;
                if (rawHubspotDate) {
                    if (!isNaN(Number(rawHubspotDate))) {
                        hubspotBirthDateStr = new Date(Number(rawHubspotDate)).toISOString().split('T')[0];
                    } else if (typeof rawHubspotDate === 'string' && rawHubspotDate.match(/^\d{4}-\d{2}-\d{2}/)) {
                        hubspotBirthDateStr = rawHubspotDate.substring(0, 10);
                    }
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, birth_date')
                    .eq('email', email)
                    .maybeSingle();

                if (profileError || !profile) {
                    console.warn(`⚠️ Perfil não encontrado: ${email}`);
                    stats.skipped++;
                    continue;
                }

                let profileBirthDate = profile.birth_date;
                if (hubspotBirthDateStr && profileBirthDate !== hubspotBirthDateStr) {
                    console.log(`🔄 Sync date HubSpot→App: ${email} -> ${hubspotBirthDateStr}`);
                    const { error: updateProfileErr } = await supabase
                        .from('profiles')
                        .update({ birth_date: hubspotBirthDateStr, updated_at: new Date().toISOString() })
                        .eq('id', profile.id);

                    if (!updateProfileErr) profileBirthDate = hubspotBirthDateStr;
                }

                if (!profileBirthDate) {
                    console.warn(`⚠️ Sócio sem birth_date: ${email}`);
                    stats.skipped++;
                    continue;
                }

                const bannerUrl = await getHubSpotFileUrl(bannerIdOrUrl, email);
                if (!bannerUrl) {
                    console.warn(`⚠️ Banner URL inválida: ${email}`);
                    stats.skipped++;
                    continue;
                }

                const scheduledDate = calcScheduledDate(profileBirthDate);
                console.log(`📅 ${email} → ${scheduledDate}`);

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
                    );

                if (upsertError) {
                    console.error(`❌ UPSERT ${email}:`, upsertError);
                    stats.errors++;
                } else {
                    stats.synced++;
                }
            }

            console.log('✅ Sync completo:', stats);
            return stats;
        }
    );

    if (outcome.ok) {
        return new Response(
            JSON.stringify({ synced: true, queued: false, stats: outcome.result }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    return new Response(
        JSON.stringify({ synced: false, queued: !!outcome.queueId, queueId: outcome.queueId, error: outcome.error, stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
