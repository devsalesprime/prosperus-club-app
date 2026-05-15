// services/notificationTriggers.ts
// Disparadores de notificações in-app + push.
//
// REGRA R5 / ADR-011: notify* são fire-and-forget — nunca propagam erro para o caller.
// Falha de notificação não pode quebrar o fluxo principal (salvar evento, criar artigo etc.).
//
// EXCEÇÃO documentada: notifyColetaFaturamento é uma operação admin-triggered manual em que
// a notificação É o fluxo principal. Por isso retorna { ok, count, error? } em vez de throw.

import { supabase } from '../lib/supabase'
import { notificationService } from './notificationService'
import { addBreadcrumb } from '../lib/sentry'

export interface NotifyResult {
    ok: boolean;
    count: number;
    error?: string;
}

class NotificationTriggers {
    /**
     * Dispara push notification para sócios ativos atualizar faturamento trimestral.
     * Em produção rodaria via CRON Edge Function; o Admin também pode disparar manualmente.
     *
     * Caso especial: o caller (ROIAdminModule) precisa do status para mostrar success/error
     * no UI. Por isso retorna { ok, count, error? } em vez de seguir fire-and-forget puro.
     */
    async notifyColetaFaturamento(targetSocioId?: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyColetaFaturamento started', { target: targetSocioId ?? 'all' });
        try {
            let query = supabase
                .from('profiles')
                .select('id, name')
                .in('role', ['MEMBER', 'ACCOUNT_MANAGER']);

            if (targetSocioId && targetSocioId !== 'all') {
                query = query.eq('id', targetSocioId);
            }

            const { data: members, error } = await query;
            if (error) {
                console.error('[notifyColetaFaturamento] query error', error);
                return { ok: false, count: 0, error: error.message };
            }
            if (!members || members.length === 0) {
                return { ok: true, count: 0 };
            }

            let successCount = 0;
            for (const member of members) {
                try {
                    await notificationService.createNotification(
                        'Atualização de Faturamento',
                        `Olá ${member.name.split(' ')[0]}, o trimestre virou! É hora de atualizar seu faturamento para recalcularmos seu Múltiplo de Crescimento no clube.`,
                        'INDIVIDUAL',
                        '/app/roi-crescimento',
                        member.id
                    );
                    successCount++;
                } catch (err) {
                    console.error(`[notifyColetaFaturamento] erro ao notificar ${member.id}:`, err);
                }
            }
            return { ok: true, count: successCount };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error('[notifyColetaFaturamento] falha geral:', err);
            return { ok: false, count: 0, error: message };
        }
    }

    async notifyNewArticle(articleTitle: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyNewArticle started');
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyNewArticle]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            for (const member of members) {
                await notificationService.createNotification(
                    '📰 Novo Artigo na Prosperus',
                    `Acabamos de publicar: ${articleTitle}. Leia agora na aba News!`,
                    'INDIVIDUAL', '/app/noticias', member.id
                ).catch((e) => console.error('[notifyNewArticle] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyNewArticle]', e);
            return { ok: false, count: 0 };
        }
    }

    async notifyNewSolution(providerName: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyNewSolution started');
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyNewSolution]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            for (const member of members) {
                await notificationService.createNotification(
                    '💼 Nova Parceria Estratégica',
                    `Um novo parceiro entrou no clube: ${providerName}. Acesse a aba de Soluções para resgatar seus benefícios!`,
                    'INDIVIDUAL', '/app/tools/solucoes', member.id
                ).catch((e) => console.error('[notifyNewSolution] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyNewSolution]', e);
            return { ok: false, count: 0 };
        }
    }

    async notifyEventUpdated(eventName: string, eventId?: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyEventUpdated started', { hasEventId: !!eventId });
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyEventUpdated]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            // ADR-018: deep-link via query param. EventDetailsModal e global
            // (renderiza em qualquer view via selectedEvent no AppContext).
            const url = eventId ? `/app/agenda?evento=${eventId}` : '/app/agenda';

            for (const member of members) {
                await notificationService.createNotification(
                    '📅 Atualização de Evento',
                    `O evento "${eventName}" sofreu alterações. Verifique sua agenda para mais detalhes.`,
                    'INDIVIDUAL', url, member.id
                ).catch((e) => console.error('[notifyEventUpdated] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyEventUpdated]', e);
            return { ok: false, count: 0 };
        }
    }

    async notifyNewVideo(title: string, videoId?: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyNewVideo started', { hasVideoId: !!videoId });
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyNewVideo]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            // ADR-018: deep-link via query param. Academy.tsx lê `?video=<id>` no mount
            // e abre o VideoPlayerModal automaticamente. Fallback para tela genérica
            // quando videoId ausente (back-compat com callers antigos).
            const url = videoId ? `/app/academy?video=${videoId}` : '/app/academy';

            for (const member of members) {
                await notificationService.createNotification(
                    '🎬 Novo Vídeo na Academy',
                    `Acabamos de publicar: ${title}. Assista agora na aba Academy!`,
                    'INDIVIDUAL', url, member.id
                ).catch((e) => console.error('[notifyNewVideo] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyNewVideo]', e);
            return { ok: false, count: 0 };
        }
    }

    async notifyNewGallery(title: string, albumId?: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyNewGallery started', { albumId: albumId ?? null });
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyNewGallery]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            const url = albumId ? `/app/galeria?album=${albumId}` : '/app/galeria';
            for (const member of members) {
                await notificationService.createNotification(
                    '📸 Nova Galeria Disponível',
                    `Confira as novas fotos: ${title}.`,
                    'INDIVIDUAL', url, member.id
                ).catch((e) => console.error('[notifyNewGallery] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyNewGallery]', e);
            return { ok: false, count: 0 };
        }
    }

    async notifyNewEvent(_id: string, title: string, date: string, _authorId?: string): Promise<NotifyResult> {
        addBreadcrumb('notification', 'notifyNewEvent started');
        try {
            const { data: members, error } = await supabase.from('profiles').select('id').eq('role', 'MEMBER');
            if (error) {
                console.error('[notifyNewEvent]', error);
                return { ok: false, count: 0 };
            }
            if (!members) return { ok: true, count: 0 };

            const dateLabel = (() => {
                try { return new Date(date).toLocaleDateString('pt-BR'); }
                catch { return date; }
            })();
            for (const member of members) {
                await notificationService.createNotification(
                    '📅 Novo Evento na Agenda',
                    `${title} — ${dateLabel}. Confira a agenda para garantir sua presença!`,
                    'INDIVIDUAL', '/app/agenda', member.id
                ).catch((e) => console.error('[notifyNewEvent] item:', e));
            }
            return { ok: true, count: members.length };
        } catch (e) {
            console.error('[notifyNewEvent]', e);
            return { ok: false, count: 0 };
        }
    }

    /**
     * No-op intencional: notificações de nova mensagem são tratadas por outro caminho:
     *   1. DB trigger (migration 051_push_on_new_message) cria a user_notification
     *   2. Realtime do useUnreadMessageCount atualiza o badge in-app
     *   3. Edge Function send-push entrega o web push
     * Este método existe apenas para retrocompatibilidade do caller em conversationService.ts.
     */
    async notifyNewMessage(
        _conversationId: string,
        _senderId: string,
        _receiverId: string,
        _content: string
    ): Promise<NotifyResult> {
        return { ok: true, count: 0 };
    }
}

export const notificationTriggers = new NotificationTriggers()

// Exports soltos para retrocompatibilidade dos callers existentes
export const notifyNewVideo = (title: string, videoId?: string) => notificationTriggers.notifyNewVideo(title, videoId);
export const notifyNewArticle = (_id: string, title: string, _authorId?: string) => notificationTriggers.notifyNewArticle(title);
export const notifyNewSolution = (_id: string, title: string, _type?: string) => notificationTriggers.notifyNewSolution(title);
export const notifyNewGallery = (title: string, albumId?: string) => notificationTriggers.notifyNewGallery(title, albumId);
export const notifyNewEvent = (id: string, title: string, date: string, authorId?: string) => notificationTriggers.notifyNewEvent(id, title, date, authorId);
export const notifyEventUpdated = (payload: { eventTitle: string; eventId?: string;[key: string]: unknown }) => notificationTriggers.notifyEventUpdated(payload.eventTitle, payload.eventId);
export const notifyNewMessage = (conversationId: string, senderId: string, receiverId: string, content: string) => notificationTriggers.notifyNewMessage(conversationId, senderId, receiverId, content);
