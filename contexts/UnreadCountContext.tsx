// ============================================
// UnreadCountContext — Global Unread Count
// ============================================
// Provides unread notification count to the entire app
// with Realtime subscription and Badging API integration.

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { badgeService } from '../services/badgeService';

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

export const UnreadCountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!userProfile?.id) return;
        try {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userProfile.id)
                .eq('is_read', false);

            const total = count ?? 0;
            setUnreadCount(total);
            badgeService.setBadge(total);
        } catch (err) {
            console.error('UnreadCountContext: refresh error', err);
        }
    }, [userProfile?.id]);

    const markAllRead = useCallback(async () => {
        if (!userProfile?.id) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userProfile.id)
                .eq('is_read', false);
            setUnreadCount(0);
            badgeService.clear();
        } catch (err) {
            console.error('UnreadCountContext: markAllRead error', err);
        }
    }, [userProfile?.id]);

    useEffect(() => {
        if (!userProfile?.id) return;

        // Initial fetch
        refreshUnreadCount();

        // Realtime: listen for notification inserts/updates
        const channel = supabase
            .channel(`unread-notif-${userProfile.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userProfile.id}`,
            }, () => refreshUnreadCount())
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userProfile.id}`,
            }, () => refreshUnreadCount())
            .subscribe();

        // Refresh when app becomes visible (user returns to app)
        const handleVisibility = () => {
            if (!document.hidden) refreshUnreadCount();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [userProfile?.id, refreshUnreadCount]);

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
