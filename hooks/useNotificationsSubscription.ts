// useNotificationsSubscription.ts
// SINGLETON do canal Realtime para a tabela `user_notifications`.
// Espelha o padrão arquitetural de useUnreadMessageCount (ADR-002):
//   - Channel name determinístico (R4 / ADR-004)
//   - Mount único via NotificationsContext provider
//   - Componentes consumidores escutam via DOM event 'prosperus:new-notification'
//     ou via useNotifications() do context.
//
// ADR-012 (espelho de ADR-002 estendida ao domínio de notifications).

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { UserNotification } from '../services/notificationService';

export const useNotificationsSubscription = (userId: string | null): void => {
    useEffect(() => {
        if (!userId) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let isCleanedUp = false;

        // ─── Setup Realtime channel with reconnection ─────────────────
        const setupChannel = () => {
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
            if (isCleanedUp) return;

            // ADR-004 (IMUTÁVEL): nome determinístico. Singleton garantido por ADR-012
            // (este hook só roda dentro de NotificationsContext provider).
            const channelName = `notifications-${userId}`;

            channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const notification = payload.new as UserNotification;
                        logger.debug('[Notifications Realtime] 🔔 New:', notification.id);
                        // Broadcast para componentes que consomem via DOM events
                        window.dispatchEvent(
                            new CustomEvent<UserNotification>('prosperus:new-notification', {
                                detail: notification,
                            })
                        );
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        // ADR-006 requer REPLICA IDENTITY FULL em user_notifications para
                        // que este filter funcione — migration 20260511 aplicou.
                        const notification = payload.new as UserNotification;
                        logger.debug('[Notifications Realtime] ✏️ Updated:', notification.id, 'is_read=', notification.is_read);
                        // Broadcast: consumidores devem refresh count (ex: NotificationsContext)
                        window.dispatchEvent(
                            new CustomEvent<UserNotification>('prosperus:notification-updated', {
                                detail: notification,
                            })
                        );
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const notification = payload.old as UserNotification;
                        logger.debug('[Notifications Realtime] 🗑️ Deleted:', notification?.id);
                        window.dispatchEvent(
                            new CustomEvent<UserNotification>('prosperus:notification-deleted', {
                                detail: notification,
                            })
                        );
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        logger.debug('[Notifications Realtime] ✅ Conectado');
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        logger.error('[Notifications Realtime] ❌', status, err);
                        // Auto-reconnect com backoff de 5s
                        if (!isCleanedUp && !reconnectTimer) {
                            reconnectTimer = setTimeout(() => {
                                reconnectTimer = null;
                                setupChannel();
                            }, 5000);
                        }
                    }
                });
        };

        setupChannel();

        // Reconnect when network returns
        const handleOnline = () => {
            logger.debug('[Notifications Realtime] 🌐 Online — reconnecting');
            setupChannel();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            isCleanedUp = true;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
            window.removeEventListener('online', handleOnline);
        };
    }, [userId]);
};
