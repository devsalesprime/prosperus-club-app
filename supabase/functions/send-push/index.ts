// ============================================
// Edge Function: send-push
// Descrição: Envia push notifications para dispositivos registrados
// Trigger: INSERT em messages ou user_notifications
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.6';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar VAPID
webpush.setVapidDetails(
    'mailto:contato@prosperusclub.com',
    vapidPublicKey,
    vapidPrivateKey
);

serve(async (req) => {
    try {
        const { type, record } = await req.json();

        console.log('📲 Send-push triggered:', { type, record: record?.id });

        let recipientId: string;
        let title: string;
        let body: string;
        let url: string;
        let tag: string;

        // Determinar destinatário e conteúdo baseado no tipo
        if (type === 'message') {
            // Nova mensagem no chat
            const { data: participants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('user_id, profiles(name)')
                .eq('conversation_id', record.conversation_id)
                .neq('user_id', record.sender_id);

            if (participantsError || !participants || participants.length === 0) {
                console.log('⚠️ No recipient found for message');
                return new Response(JSON.stringify({ message: 'No recipient found' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Buscar nome do remetente
            const { data: sender } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', record.sender_id)
                .single();

            recipientId = participants[0].user_id;
            title = `Nova mensagem de ${sender?.name || 'Alguém'}`;
            body = record.content.substring(0, 100);
            url = `/chat?conversation=${record.conversation_id}`;
            tag = `message-${record.conversation_id}`;

        } else if (type === 'notification') {
            // Nova notificação
            const { data: notification } = await supabase
                .from('notifications')
                .select('*')
                .eq('id', record.notification_id)
                .single();

            recipientId = record.user_id;
            title = notification?.title || 'Nova Notificação';
            body = notification?.message || '';
            url = '/notificacoes';
            tag = `notification-${record.notification_id}`;

        } else {
            return new Response(JSON.stringify({ error: 'Unknown type' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar dispositivos ativos do destinatário
        const { data: devices, error: devicesError } = await supabase
            .from('user_devices')
            .select('id, subscription_json')
            .eq('user_id', recipientId)
            .eq('is_active', true);

        if (devicesError || !devices || devices.length === 0) {
            console.log('⚠️ No active devices found for user:', recipientId);
            return new Response(JSON.stringify({ message: 'No active devices' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log(`📲 Sending push to ${devices.length} device(s)`);

        // Enviar push para cada dispositivo
        const results = await Promise.allSettled(
            devices.map(async (device) => {
                try {
                    const subscription = JSON.parse(device.subscription_json);

                    const payload = JSON.stringify({
                        title,
                        body,
                        url,
                        tag,
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png'
                    });

                    await webpush.sendNotification(subscription, payload);

                    // Atualizar last_used_at
                    await supabase
                        .from('user_devices')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', device.id);

                    console.log('✅ Push sent to device:', device.id);
                    return { success: true, deviceId: device.id };

                } catch (error: any) {
                    console.error('❌ Error sending push to device:', device.id, error);

                    // Se erro 410 (Gone), marcar dispositivo como inativo
                    if (error.statusCode === 410) {
                        await supabase
                            .from('user_devices')
                            .update({ is_active: false })
                            .eq('id', device.id);
                        console.log('⚠️ Device marked as inactive:', device.id);
                    }

                    return { success: false, deviceId: device.id, error: error.message };
                }
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failureCount = results.length - successCount;

        console.log(`📊 Push results: ${successCount} success, ${failureCount} failures`);

        return new Response(JSON.stringify({
            message: 'Push notifications sent',
            total: devices.length,
            success: successCount,
            failures: failureCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('❌ Error in send-push:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
