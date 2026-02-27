// ============================================
// Edge Function: send-push
// Envia push notifications para dispositivos registrados
// Suporta: DB trigger (type+record) e chamada direta (user_id+title+body)
// Tabela: push_subscriptions (migration 025)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const vapidMailto = Deno.env.get('VAPID_MAILTO') ?? 'mailto:contato@prosperusclub.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

webpush.setVapidDetails(vapidMailto, vapidPublicKey, vapidPrivateKey);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
};

interface DirectPayload {
    user_id: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
    type?: 'message' | 'event' | 'notification';
    icon?: string;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();

        let recipientId: string;
        let title: string;
        let body: string;
        let url: string;
        let tag: string;
        let pushType: string = 'notification';

        // ─── Mode 1: Direct call (user_id + title + body) ───
        if (payload.user_id && payload.title) {
            const p = payload as DirectPayload;
            recipientId = p.user_id;
            title = p.title;
            body = p.body;
            url = p.url || '/';
            tag = p.tag || 'prosperus';
            pushType = p.type || 'notification';

            console.log('📲 Direct push to:', recipientId, title);

            // ─── Mode 2: DB trigger (type + record) ───
        } else if (payload.type === 'message' && payload.record) {
            const record = payload.record;

            // Buscar destinatário da conversa
            const { data: participants } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', record.conversation_id)
                .neq('user_id', record.sender_id);

            if (!participants?.length) {
                return new Response(JSON.stringify({ sent: 0, reason: 'no_recipient' }), {
                    status: 200, headers: corsHeaders
                });
            }

            // Buscar nome do remetente
            const { data: sender } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', record.sender_id)
                .single();

            recipientId = participants[0].user_id;
            title = sender?.name || 'Nova mensagem';
            body = (record.content || '').substring(0, 100);
            url = `/chat?conversation=${record.conversation_id}`;
            tag = `chat-${record.conversation_id}`;
            pushType = 'message';

        } else if (payload.type === 'notification' && payload.record) {
            const record = payload.record;

            const { data: notification } = await supabase
                .from('notifications')
                .select('title, message')
                .eq('id', record.notification_id || record.id)
                .single();

            recipientId = record.user_id;
            title = notification?.title || 'Nova Notificação';
            body = notification?.message || '';
            url = '/notificacoes';
            tag = `notif-${record.notification_id || record.id}`;

        } else {
            return new Response(JSON.stringify({ error: 'Invalid payload' }), {
                status: 400, headers: corsHeaders
            });
        }

        // ─── Buscar subscriptions ativas em push_subscriptions ───
        const { data: subs, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, p256dh, auth, user_agent')
            .eq('user_id', recipientId)
            .eq('is_active', true);

        if (subsError || !subs?.length) {
            console.log('⚠️ No active subscriptions for:', recipientId);
            return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), {
                status: 200, headers: corsHeaders
            });
        }

        console.log(`📲 Sending to ${subs.length} device(s)`);

        const pushPayload = JSON.stringify({
            title,
            body,
            url,
            tag,
            type: pushType,
            icon: '/app/default-avatar.png',
            badge: '/app/default-avatar.png',
        });

        // ─── Enviar para todos os dispositivos ───
        const results = await Promise.allSettled(
            subs.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        pushPayload
                    );

                    // Atualizar last_used_at
                    await supabase
                        .from('push_subscriptions')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', sub.id);

                    console.log('✅ Push sent:', sub.id);
                    return { success: true, id: sub.id };

                } catch (err: any) {
                    console.error('❌ Push failed:', sub.id, err.statusCode, err.message);

                    // 410 Gone ou 404 = subscription expirada → desativar
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .eq('id', sub.id);
                        console.log('⚠️ Expired subscription deactivated:', sub.id);
                    }

                    return { success: false, id: sub.id, error: err.message };
                }
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
        const failed = results.length - sent;

        console.log(`📊 Push batch: ${sent} sent, ${failed} failed`);

        return new Response(JSON.stringify({ sent, failed, total: subs.length }), {
            status: 200, headers: corsHeaders
        });

    } catch (error: any) {
        console.error('❌ send-push error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: corsHeaders
        });
    }
});
