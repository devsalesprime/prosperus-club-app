// Hook to track unread message count with realtime updates
// Includes: status handler, auto-reconnect, online listener, badge sync
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { unreadMessageService } from '../services/unreadMessageService';
import { badgeService } from '../services/badgeService';
import { logger } from '../utils/logger';

export const useUnreadMessageCount = (userId: string | null) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let isCleanedUp = false;

        // ─── Fetch count from DB and update badge ─────────────────────
        const fetchUnreadCount = async () => {
            const count = await unreadMessageService.getTotalUnreadCount(userId);
            setUnreadCount(count);
            setLoading(false);
            // Sync PWA app icon badge (combined notifications + messages)
            badgeService.updateBadge(userId);
        };

        // Initial fetch
        fetchUnreadCount();

        // ─── Setup Realtime channel with reconnection ─────────────────
        const setupChannel = () => {
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
            if (isCleanedUp) return;

            channel = supabase
                .channel(`unread-messages:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    async (payload) => {
                        const newMessage = payload.new as any;

                        // Only count if message is not from current user
                        if (newMessage.sender_id !== userId) {
                            // Check if user is participant in this conversation
                            const { data } = await supabase
                                .from('conversation_participants')
                                .select('conversation_id')
                                .eq('user_id', userId)
                                .eq('conversation_id', newMessage.conversation_id)
                                .single();

                            if (data) {
                                setUnreadCount(prev => prev + 1);
                                // Update PWA badge with combined count
                                badgeService.updateBadge(userId);
                            }
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                    },
                    async (payload) => {
                        const updatedMessage = payload.new as any;

                        // Refresh count when a message from another user is updated (mark-as-read)
                        if (updatedMessage.sender_id !== userId) {
                            logger.debug('🔄 Badge: Refreshing count due to message update');
                            // Small delay to ensure DB is updated
                            setTimeout(() => fetchUnreadCount(), 100);
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        logger.debug('[Unread Realtime] ✅ Conectado');
                    }
                    if (status === 'CHANNEL_ERROR') {
                        logger.error('[Unread Realtime] ❌ Erro:', err);
                        if (!isCleanedUp) {
                            reconnectTimer = setTimeout(setupChannel, 3000);
                        }
                    }
                    if (status === 'TIMED_OUT') {
                        logger.warn('[Unread Realtime] ⏱️ Timeout — reconectando...');
                        if (!isCleanedUp) {
                            reconnectTimer = setTimeout(setupChannel, 2000);
                        }
                    }
                });
        };

        setupChannel();

        // ─── Refresh when app becomes visible (user returns from background)
        const handleVisibility = () => {
            if (!document.hidden) fetchUnreadCount();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // ─── Reconexão ao voltar online ─────────────────────
        const handleOnline = () => {
            logger.info('[Unread Realtime] 📶 Online — reconectando...');
            setupChannel();
            fetchUnreadCount();
        };
        window.addEventListener('online', handleOnline);

        // ─── Explicit mark-as-read signals from ChatWindow ─────────
        const handleMessagesRead = () => fetchUnreadCount();
        window.addEventListener('prosperus:messages-read', handleMessagesRead);

        return () => {
            isCleanedUp = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (channel) supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('prosperus:messages-read', handleMessagesRead);
        };
    }, [userId]);

    const refreshCount = async () => {
        if (!userId) return;
        const count = await unreadMessageService.getTotalUnreadCount(userId);
        setUnreadCount(count);
        // Full badge refresh with combined count
        badgeService.updateBadge(userId);
    };

    return { unreadCount, loading, refreshCount };
};
