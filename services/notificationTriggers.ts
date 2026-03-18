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
    eventDate: string,
    excludeUserId?: string
): Promise<void> {
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['MEMBER', 'ADMIN', 'TEAM'])
        .eq('is_active', true);
    if (!members?.length) return;

    const recipients = excludeUserId ? members.filter(m => m.id !== excludeUserId) : members;

    const dateStr = new Date(eventDate).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    const BATCH = 20;
    for (let i = 0; i < recipients.length; i += BATCH) {
        await Promise.allSettled(
            recipients.slice(i, i + BATCH).map((m) =>
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

// ─── TIPO 8: Novo artigo publicado ─────────────────────────────────

export async function notifyNewArticle(
    articleId: string,
    articleTitle: string,
    excludeUserId?: string
): Promise<void> {
    const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['MEMBER', 'ADMIN', 'TEAM'])
        .eq('is_active', true);
    if (!members?.length) return;

    const recipients = excludeUserId ? members.filter(m => m.id !== excludeUserId) : members;

    const BATCH = 20;
    for (let i = 0; i < recipients.length; i += BATCH) {
        await Promise.allSettled(
            recipients.slice(i, i + BATCH).map((m) =>
                dispatchNotification({
                    userId: m.id,
                    type: 'article',
                    title: '📰 Novo artigo',
                    message: articleTitle,
                    url: '/artigos',
                    tag: `article-${articleId}`,
                })
            )
        );
    }
}

// ─── TIPO 9: Evento atualizado (data/local/link) ───────────────────

interface EventUpdatePayload {
    eventId: string;
    eventTitle: string;
    dateChanged?: boolean;
    newDate?: string;
    locationChanged?: boolean;
    newLocation?: string;
    linkChanged?: boolean;
    newLink?: string;
}

export async function notifyEventUpdated(payload: EventUpdatePayload & { excludeUserId?: string }): Promise<void> {
    const { eventId, eventTitle, dateChanged, newDate, locationChanged, newLocation, linkChanged, newLink, excludeUserId } = payload;

    // Só notifica se algo relevante mudou
    if (!dateChanged && !locationChanged && !linkChanged) return;

    // Buscar apenas sócios com RSVP confirmado para este evento
    const { data: rsvps, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'CONFIRMED');

    if (rsvpError) { logger.error('notifyEventUpdated rsvp query error:', rsvpError); return; }
    if (!rsvps?.length) return;

    // Montar mensagem com o que mudou
    const changes: string[] = [];
    if (dateChanged && newDate) {
        const dateStr = new Date(newDate).toLocaleDateString('pt-BR', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        });
        changes.push(`Data: ${dateStr}`);
    }
    if (locationChanged && newLocation) changes.push(`Local: ${newLocation}`);
    if (linkChanged && newLink) changes.push(`Link atualizado`);

    const message = changes.join(' · ');
    const title = `⚠️ Evento atualizado: ${eventTitle}`;

    const userIds = [...new Set(rsvps.map(r => r.user_id))].filter(id => id !== excludeUserId); // dedupe + exclude admin

    const BATCH = 20;
    for (let i = 0; i < userIds.length; i += BATCH) {
        await Promise.allSettled(
            userIds.slice(i, i + BATCH).map((userId) =>
                dispatchNotification({
                    userId,
                    type: 'event',
                    title,
                    message,
                    url: `/agenda/${eventId}`,
                    tag: `event-update-${eventId}`,
                })
            )
        );
    }
}
