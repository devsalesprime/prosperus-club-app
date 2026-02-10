// Hook to track unread message count with realtime updates
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { unreadMessageService } from '../services/unreadMessageService';
import { badgeService } from '../services/badgeService';

export const useUnreadMessageCount = (userId: string | null) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        // Initial fetch
        const fetchUnreadCount = async () => {
            const count = await unreadMessageService.getTotalUnreadCount(userId);
            setUnreadCount(count);
            setLoading(false);
        };

        fetchUnreadCount();

        // Subscribe to new messages
        const channel = supabase
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
                            // Update PWA badge
                            badgeService.increment();
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

                    console.log('📝 Badge: Message UPDATE event', {
                        messageId: updatedMessage.id,
                        isRead: updatedMessage.is_read,
                        senderId: updatedMessage.sender_id,
                        currentUserId: userId
                    });

                    // Since old value is not available (undefined), we can't detect the transition
                    // Instead, just refresh the count whenever a message is updated
                    // This will recalculate the correct count from the database
                    if (updatedMessage.sender_id !== userId) {
                        console.log('🔄 Badge: Refreshing count due to message update');

                        // Small delay to ensure DB is updated
                        setTimeout(async () => {
                            const count = await unreadMessageService.getTotalUnreadCount(userId);
                            setUnreadCount(count);
                        }, 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
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
