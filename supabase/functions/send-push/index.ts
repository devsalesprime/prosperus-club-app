// ============================================
// Edge Function: send-push
// Envia push notifications para dispositivos registrados
// Suporta: chamada direta (user_id+title+body)
// Tabela: push_subscriptions (migration 025)
// FIX: esm.sh import (npm: causa 403 no Deno runtime)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_MAILTO = Deno.env.get('VAPID_MAILTO')
    ?? 'mailto:contato@prosperusclub.com.br'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Content-Type': 'application/json',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()

        // ─── Validar payload ───────────────────────────────────────
        if (!body.user_id || !body.title) {
            return new Response(
                JSON.stringify({ error: 'user_id e title obrigatórios' }),
                { status: 400, headers: corsHeaders }
            )
        }

        const recipientId = body.user_id
        const title = body.title
        const message = body.body || body.message || ''
        const url = body.url || '/'
        const tag = body.tag || 'prosperus'
        const pushType = body.type || 'notification'

        console.log(`📲 Push → ${recipientId} | ${title}`)

        // ─── Buscar subscriptions ativas ───────────────────────────
        const { data: subs, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, p256dh, auth')
            .eq('user_id', recipientId)
            .eq('is_active', true)

        if (subsError || !subs?.length) {
            console.log('⚠️ Sem subscriptions para:', recipientId)
            return new Response(
                JSON.stringify({ sent: 0, reason: 'no_subscriptions' }),
                { headers: corsHeaders }
            )
        }

        // ─── Preparar payload da notificação ───────────────────────
        const payload = JSON.stringify({
            title,
            body: message,
            url,
            tag,
            type: pushType,
            icon: '/app/default-avatar.png',
            badge: '/app/default-avatar.png',
        })

        // ─── Enviar para todos os dispositivos ─────────────────────
        let sent = 0, failed = 0
        const errors: string[] = []

        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                )
                sent++
                console.log('✅ Enviado:', sub.id)
            } catch (err: any) {
                failed++
                const msg = `${sub.id}: HTTP ${err.statusCode} ${err.message}`
                console.error('❌', msg)
                errors.push(msg)

                // 410/404 = subscription expirada → desativar
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .update({ is_active: false })
                        .eq('id', sub.id)
                    console.log('⚠️ Subscription desativada:', sub.id)
                }
            }
        }

        console.log(`📊 ${sent} sent, ${failed} failed`)

        return new Response(
            JSON.stringify({
                sent, failed, total: subs.length,
                errors: errors.length ? errors : undefined,
            }),
            { headers: corsHeaders }
        )

    } catch (err: any) {
        console.error('❌ send-push fatal:', err.message)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: corsHeaders }
        )
    }
})
