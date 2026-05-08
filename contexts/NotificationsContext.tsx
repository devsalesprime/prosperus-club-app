// NotificationsContext.tsx
// SINGLETON Provider para subscription Realtime de user_notifications.
// Espelho de UnreadCountContext (ADR-002) para o domínio de notifications.
//
// ADR-012: única subscription Realtime para `user_notifications` deve passar
// por aqui. Componentes consomem via:
//   - useNotifications() (count + helpers)
//   - window.addEventListener('prosperus:new-notification', handler) — para
//     listar/atualizar dados próprios sem recriar canal.

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNotificationsSubscription } from '../hooks/useNotificationsSubscription';
import { notificationService, type UserNotification } from '../services/notificationService';
import { logger } from '../utils/logger';

interface NotificationsContextType {
    /** Contagem atual de notificações não lidas */
    unreadNotifications: number;
    /** Recarrega o count do banco */
    refreshNotifications: () => Promise<void>;
    /** Marca todas as notificações do usuário como lidas */
    markAllNotificationsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
    unreadNotifications: 0,
    refreshNotifications: async () => { },
    markAllNotificationsRead: async () => { },
});

interface NotificationsProviderProps {
    userId?: string;
    children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ userId, children }) => {
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // ─── Singleton da subscription ─────────────────────────────────
    // ADR-012: este é o ÚNICO canal Realtime para user_notifications no app.
    // O hook dispara DOM event 'prosperus:new-notification' para componentes
    // que mantêm listas próprias (NotificationCenter, NotificationsPage).
    useNotificationsSubscription(userId ?? null);

    const refreshNotifications = useCallback(async () => {
        if (!userId) {
            setUnreadNotifications(0);
            return;
        }
        try {
            const count = await notificationService.getUnreadCount(userId);
            setUnreadNotifications(count);
        } catch (err) {
            logger.error('[NotificationsContext] refresh error', err);
        }
    }, [userId]);

    const markAllNotificationsRead = useCallback(async () => {
        if (!userId) return;
        try {
            await notificationService.markAllAsRead(userId);
            setUnreadNotifications(0);
        } catch (err) {
            logger.error('[NotificationsContext] markAllRead error', err);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setUnreadNotifications(0);
            return;
        }

        // Initial load
        refreshNotifications();

        // Bump counter on each new notification (DOM event do hook singleton)
        const handleNew = (_e: Event) => {
            setUnreadNotifications((prev) => prev + 1);
        };
        window.addEventListener('prosperus:new-notification', handleNew);

        // Refresh on visibility change (volta de background com count atualizado)
        const handleVisibility = () => {
            if (!document.hidden) refreshNotifications();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('prosperus:new-notification', handleNew);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [userId, refreshNotifications]);

    return (
        <NotificationsContext.Provider
            value={{ unreadNotifications, refreshNotifications, markAllNotificationsRead }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = (): NotificationsContextType => useContext(NotificationsContext);

/**
 * Helper hook para componentes que querem reagir a cada nova notificação
 * (ex: animação, push to local list). Wraps o DOM event listener com tipagem
 * do payload e cleanup automático.
 */
export const useOnNewNotification = (handler: (notification: UserNotification) => void): void => {
    useEffect(() => {
        const wrappedHandler = (e: Event) => {
            const detail = (e as CustomEvent<UserNotification>).detail;
            if (detail) handler(detail);
        };
        window.addEventListener('prosperus:new-notification', wrappedHandler);
        return () => window.removeEventListener('prosperus:new-notification', wrappedHandler);
    }, [handler]);
};
