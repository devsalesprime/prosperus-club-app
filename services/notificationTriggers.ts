// ============================================
// Notification Triggers — Centralized Push + In-App
// ============================================
// Dispatches both in-app notifications (DB insert) and
// push notifications (edge function call) for all 7 event types.
// Usage: import and call after the relevant action completes.

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// ─── Generic Dispatcher ────────────────────────────────────────────

interface NotificationParams {
    userId: string;
    type: string;
    title: string;
    message: string;
    url: string;
    tag: string;
}

async function dispatchNotification(params: NotificationParams): Promise<void> {
    // 1. Save to DB (in-app notification center)
    const { error } = await supabase.from('user_notifications').insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        action_url: params.url,
        is_read: false,
    });
    if (error) logger.error('Notification insert error:', error);

    // 2. Push notification (fire-and-forget)
    supabase.functions
        .invoke('send-push', {
            body: {
                user_id: params.userId,
                title: params.title,
                body: params.message,
                url: params.url,
                tag: params.tag,
                type: params.type,
            },
        })
        .catch((err: unknown) => logger.warn('Push non-critical error:', err));
}

// ─── TIPO 1: Mensagem de chat ──────────────────────────────────────

export async function notifyNewMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string
): Promise<void> {
    const { data: sender } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', senderId)
        .single();

    await dispatchNotification({
        userId: recipientId,
        type: 'message',
        title: sender?.name || 'Nova mensagem',
        message: content.length > 80 ? content.slice(0, 77) + '...' : content,
        url: `/chat?conversation=${conversationId}`,
        tag: `chat-${conversationId}`,
    });
}

// ─── TIPO 2: Novo evento na agenda ─────────────────────────────────

export async function notifyNewEvent(
    eventId: string,
    eventTitle: string,
    eventDate: string
): Promise<void> {
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['MEMBER', 'ADMIN', 'TEAM'])
        .eq('is_active', true);
    if (!members?.length) return;

    const dateStr = new Date(eventDate).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    const BATCH = 20;
    for (let i = 0; i < members.length; i += BATCH) {
        await Promise.allSettled(
            members.slice(i, i + BATCH).map((m) =>
                dispatchNotification({
                    userId: m.id,
                    type: 'event',
                    title: '📅 Novo evento',
                    message: `${eventTitle} · ${dateStr}`,
                    url: `/agenda/${eventId}`,
                    tag: `event-${eventId}`,
                })
            )
        );
    }
}

// ─── TIPO 3: Novo vídeo na Academy ─────────────────────────────────

export async function notifyNewVideo(
    videoTitle: string,
    videoId: string
): Promise<void> {
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['MEMBER', 'ADMIN', 'TEAM'])
        .eq('is_active', true);
    if (!members?.length) return;

    const BATCH = 20;
    for (let i = 0; i < members.length; i += BATCH) {
        await Promise.allSettled(
            members.slice(i, i + BATCH).map((m) =>
                dispatchNotification({
                    userId: m.id,
                    type: 'video',
                    title: '🎥 Novo conteúdo na Academy',
                    message: videoTitle,
                    url: '/academy',
                    tag: `video-${videoId}`,
                })
            )
        );
    }
}

// ─── TIPO 4: Nova galeria ──────────────────────────────────────────

export async function notifyNewGallery(
    albumTitle: string,
    albumId: string
): Promise<void> {
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['MEMBER', 'ADMIN', 'TEAM'])
        .eq('is_active', true);
    if (!members?.length) return;

    const BATCH = 20;
    for (let i = 0; i < members.length; i += BATCH) {
        await Promise.allSettled(
            members.slice(i, i + BATCH).map((m) =>
                dispatchNotification({
                    userId: m.id,
                    type: 'gallery',
                    title: '🖼️ Nova galeria',
                    message: albumTitle,
                    url: '/galeria',
                    tag: `gallery-${albumId}`,
                })
            )
        );
    }
}

// ─── TIPO 5: Indicação recebida ────────────────────────────────────

export async function notifyReferralReceived(
    referralId: string,
    referrerId: string,
    recipientId: string
): Promise<void> {
    const { data: referrer } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', referrerId)
        .single();

    await dispatchNotification({
        userId: recipientId,
        type: 'referral',
        title: '🤝 Nova indicação',
        message: `${referrer?.name || 'Um sócio'} te indicou`,
        url: '/negocios?tab=indicacoes',
        tag: `referral-${referralId}`,
    });
}

// ─── TIPO 6: Negócio registrado com você ───────────────────────────

export async function notifyDealRegistered(
    dealId: string,
    registrerId: string,
    partnerId: string,
    dealValue?: number
): Promise<void> {
    const { data: registrer } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', registrerId)
        .single();

    const valueStr = dealValue
        ? ` · R$ ${dealValue.toLocaleString('pt-BR')}`
        : '';

    await dispatchNotification({
        userId: partnerId,
        type: 'deal',
        title: '💼 Negócio registrado',
        message: `${registrer?.name || 'Um sócio'} registrou um negócio com você${valueStr}`,
        url: '/negocios?tab=negocios',
        tag: `deal-${dealId}`,
    });
}

// ─── TIPO 7: Relatório disponível (admin manual) ───────────────────

export async function notifyReport(
    userId: string,
    title: string,
    message: string
): Promise<void> {
    await dispatchNotification({
        userId,
        type: 'report',
        title: `📊 ${title}`,
        message,
        url: '/notificacoes',
        tag: `report-${Date.now()}`,
    });
}
