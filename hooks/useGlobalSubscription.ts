import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Interface para notificações de usuário
 */
export interface UserNotification {
    id: string;
    user_id: string;
    notification_id: string;
    is_read: boolean;
    created_at: string;
    notification?: {
        title: string;
        message: string;
        type: string;
    };
}

/**
 * Hook para escutar novas notificações do usuário logado via Supabase Realtime
 * 
 * @param onNewNotification - Callback chamado quando nova notificação é recebida
 * 
 * @example
 * ```tsx
 * const [unreadCount, setUnreadCount] = useState(0);
 * 
 * useGlobalSubscription((notification) => {
 *   setUnreadCount(prev => prev + 1);
 *   showToast({
 *     title: 'Nova Notificação',
 *     message: notification.notification?.title || '',
 *     type: 'info'
 *   });
 * });
 * ```
 */
export const useGlobalSubscription = (
    onNewNotification: (notification: UserNotification) => void
) => {
    const { session } = useAuth();

    useEffect(() => {
        if (!session?.user?.id) return;

        console.log('🔔 Subscribing to notifications for user:', session.user.id);

        const channel = supabase
            .channel(`notifications:${session.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${session.user.id}`
                },
                (payload) => {
                    console.log('🔔 New notification received:', payload.new);
                    onNewNotification(payload.new as UserNotification);
                }
            )
            .subscribe();

        return () => {
            console.log('🔔 Unsubscribing from notifications');
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, onNewNotification]);
};
