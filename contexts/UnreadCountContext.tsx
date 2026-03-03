// ============================================
// UnreadCountContext — Global Unread Count
// ============================================
// Provides unread notification count to the entire app
// with Realtime subscription, BroadcastChannel (SW push),
// and Badging API integration.

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface UnreadCountContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    markAllRead: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType>({
    unreadCount: 0,
    refreshUnreadCount: async () => { },
    markAllRead: async () => { },
});

export const UnreadCountProvider: React.FC<{ userId?: string; children: ReactNode }> = ({ userId, children }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!userId) return;
        try {
            const { count } = await supabase
                .from('user_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            const total = count ?? 0;
            setUnreadCount(total);

            // Update app badge (Badging API)
            if ('setAppBadge' in navigator) {
                if (total > 0) {
                    (navigator as any).setAppBadge(total).catch(() => { });
                } else {
                    (navigator as any).clearAppBadge().catch(() => { });
                }
            }
        } catch (err) {
            console.error('UnreadCountContext: refresh error', err);
        }
    }, [userId]);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        try {
            await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);
            setUnreadCount(0);

            // Clear app badge
            if ('clearAppBadge' in navigator) {
                (navigator as any).clearAppBadge().catch(() => { });
            }
        } catch (err) {
            console.error('UnreadCountContext: markAllRead error', err);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        // Initial fetch
        refreshUnreadCount();

        // Realtime: listen for notification inserts/updates
        const channel = supabase
            .channel(`unread-notif-${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'user_notifications',
                filter: `user_id=eq.${userId}`,
            }, () => refreshUnreadCount())
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_notifications',
                filter: `user_id=eq.${userId}`,
            }, () => refreshUnreadCount())
            .subscribe();

        // Refresh when app becomes visible (user returns to app)
        const handleVisibility = () => {
            if (!document.hidden) refreshUnreadCount();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // BroadcastChannel: SW sends PUSH_RECEIVED when push arrives
        // This ensures badge refreshes even when app is open (foreground)
        let broadcastChannel: BroadcastChannel | null = null;
        try {
            broadcastChannel = new BroadcastChannel('prosperus-push');
            broadcastChannel.onmessage = () => {
                refreshUnreadCount();
            };
        } catch {
            // BroadcastChannel not supported in this browser
        }

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibility);
            broadcastChannel?.close();
        };
    }, [userId, refreshUnreadCount]);

    return (
        <UnreadCountContext.Provider value={{ unreadCount, refreshUnreadCount, markAllRead }}>
            {children}
        </UnreadCountContext.Provider>
    );
};

export const useUnreadCount = () => useContext(UnreadCountContext);

// Legacy hook for backward compatibility with ChatIconWithBadge etc.
export const useUnreadCountContext = () => {
    const ctx = useContext(UnreadCountContext);
    return { refreshUnreadCount: ctx.refreshUnreadCount };
};
