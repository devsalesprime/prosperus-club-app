// Service for managing unread message counts
import { supabase } from '../lib/supabase';

export interface UnreadCount {
    conversationId: string;
    count: number;
}

class UnreadMessageService {
    /**
     * Get total unread message count for a user
     */
    async getTotalUnreadCount(userId: string): Promise<number> {
        try {
            // Get user's conversation IDs first
            const { data: conversations, error: convError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (convError) throw convError;
            if (!conversations || conversations.length === 0) {
                return 0;
            }

            const conversationIds = conversations.map(c => c.conversation_id);

            // Count unread messages in those conversations
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', userId)
                .in('conversation_id', conversationIds);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('Error getting total unread count:', error);
            return 0;
        }
    }

    /**
     * Get unread count per conversation for a user
     */
    async getUnreadCountByConversation(userId: string): Promise<UnreadCount[]> {
        try {
            // Get user's conversations
            const { data: conversations, error: convError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (convError) throw convError;
            if (!conversations || conversations.length === 0) return [];

            const conversationIds = conversations.map(c => c.conversation_id);

            // Get unread count for each conversation
            const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('conversation_id')
                .eq('is_read', false)
                .neq('sender_id', userId)
                .in('conversation_id', conversationIds);

            if (msgError) throw msgError;
            if (!messages) return [];

            // Count messages per conversation
            const counts: Record<string, number> = {};
            messages.forEach(msg => {
                counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
            });

            return Object.entries(counts).map(([conversationId, count]) => ({
                conversationId,
                count
            }));
        } catch (error) {
            console.error('Error getting unread count by conversation:', error);
            return [];
        }
    }

    /**
     * Mark all messages in a conversation as read
     */
    async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', userId)
                .eq('is_read', false);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    /**
     * Mark a specific message as read
     */
    async markMessageAsRead(messageId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }
}

export const unreadMessageService = new UnreadMessageService();
