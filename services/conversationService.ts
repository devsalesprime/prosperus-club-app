// Service for managing conversations and messages

import { supabase } from '../lib/supabase';
import { fetchWithOfflineCache } from './offlineStorage';
import { logger } from '../utils/logger';
import { notifyNewMessage } from './notificationTriggers';

export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
    participants: ConversationParticipant[];
    lastMessage?: Message;
    unreadCount?: number;
}

export interface ConversationParticipant {
    user_id: string;
    joined_at: string;
    profile?: {
        id: string;
        name: string;
        image_url: string;
        job_title?: string;
        company?: string;
    };
}

export type MessageType = 'text' | 'image' | 'file';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    is_deleted?: boolean; // Added for soft delete support
    message_type?: MessageType;
    media_url?: string;
    media_filename?: string;
    created_at: string;
    sender?: {
        id: string;
        name: string;
        image_url: string;
    };
}

export interface ConversationWithDetails extends Conversation {
    otherParticipant?: {
        id: string;
        name: string;
        image_url: string;
        job_title?: string;
        company?: string;
    };
}

class ConversationService {
    // Cache for sender profiles to avoid repeated fetches
    private profileCache: Map<string, { id: string; name: string; image_url: string }> = new Map();

    /**
     * Get sender profile from cache or fetch from database
     */
    private async getSenderProfile(senderId: string): Promise<{ id: string; name: string; image_url: string } | null> {
        // Check cache first
        if (this.profileCache.has(senderId)) {
            return this.profileCache.get(senderId)!;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, image_url')
                .eq('id', senderId)
                .single();

            if (error) {
                console.debug('⚠️ Realtime: Could not fetch sender profile:', error.message);
                return null;
            }

            if (data) {
                // Store in cache
                this.profileCache.set(senderId, data);
                return data;
            }

            return null;
        } catch (err) {
            console.debug('⚠️ Realtime: Error fetching sender profile:', err);
            return null;
        }
    }

    /**
     * Subscribe to new messages in a conversation (Realtime)
     * Returns an unsubscribe function for cleanup
     */
    subscribeToConversation(
        conversationId: string,
        onNewMessage: (message: Message) => void
    ): { unsubscribe: () => void } {
        // UNIQUE channel name prevents "mismatch between server and client bindings"
        const channelName = `chat-${conversationId}-${Math.random().toString(36).slice(2, 8)}`;
        logger.debug('🔌 Realtime: Subscribing directly to conversation:', channelName);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to both INSERT and UPDATE
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    const eventType = payload.eventType;
                    const rawMessage = payload.new as any;
                    
                    if (!rawMessage || (eventType !== 'INSERT' && eventType !== 'UPDATE')) return;

                    logger.debug(`📩 Realtime: Message ${eventType}:`, rawMessage);

                    // Hydrate with sender profile data
                    const senderProfile = await this.getSenderProfile(rawMessage.sender_id);

                    const hydratedMessage: Message = {
                        id: rawMessage.id,
                        conversation_id: rawMessage.conversation_id,
                        sender_id: rawMessage.sender_id,
                        content: rawMessage.content,
                        is_read: rawMessage.is_read,
                        is_deleted: rawMessage.is_deleted,
                        message_type: rawMessage.message_type || 'text',
                        media_url: rawMessage.media_url,
                        media_filename: rawMessage.media_filename,
                        created_at: rawMessage.created_at,
                        sender: senderProfile || {
                            id: rawMessage.sender_id,
                            name: 'Sócio',
                            image_url: ''
                        }
                    };

                    onNewMessage(hydratedMessage);
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') logger.debug(`[Chat Realtime] ✅ Connected ${channelName}`);
                if (status === 'CHANNEL_ERROR') logger.error(`[Chat Realtime] ❌ Error ${channelName}:`, err);
            });

        return {
            unsubscribe: () => {
                logger.debug('🔌 Realtime: Unsubscribing from conversation:', channelName);
                supabase.removeChannel(channel);
            }
        };
    }

    /**
     * Subscribe to all conversations for a user (for unread count updates)
     */
    subscribeToUserConversations(
        userId: string,
        conversationIds: string[],
        onUpdate: (conversationId: string) => void
    ): { unsubscribe: () => void } {
        if (conversationIds.length === 0) {
            return { unsubscribe: () => { } };
        }

        const channelName = `user-convs-${userId}-${Math.random().toString(36).slice(2, 8)}`;
        logger.debug('🔌 Realtime: Subscribing to user conversations:', channelName);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    if (!newMsg) return;

                    // Only notify if message is in one of user's conversations and not from user
                    if (conversationIds.includes(newMsg.conversation_id) && newMsg.sender_id !== userId) {
                        logger.debug('📩 Realtime: New message in conversation:', newMsg.conversation_id);
                        onUpdate(newMsg.conversation_id);
                    }
                }
            )
            .subscribe();

        return {
            unsubscribe: () => {
                logger.debug('🔌 Realtime: Unsubscribing from user conversations:', channelName);
                supabase.removeChannel(channel);
            }
        };
    }

    /**
     * Subscribe to all user messages with full payload (for ConversationList updates)
     */
    subscribeToUserMessages(
        userId: string,
        onNewMessage: (payload: {
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
        }) => void
    ): { unsubscribe: () => void } {
        const channelName = `user-msgs-${userId}-${Math.random().toString(36).slice(2, 8)}`;
        logger.debug('🔌 Realtime: Subscribing to all user messages:', channelName);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    if (!newMsg) return;

                    onNewMessage({
                        conversation_id: newMsg.conversation_id,
                        sender_id: newMsg.sender_id,
                        content: newMsg.content,
                        created_at: newMsg.created_at
                    });
                }
            )
            .subscribe();

        return {
            unsubscribe: () => {
                logger.debug('🔌 Realtime: Unsubscribing from all user messages:', channelName);
                supabase.removeChannel(channel);
            }
        };
    }

    /**
     * Get a single conversation by ID with all details
     */
    async getConversationById(conversationId: string, currentUserId: string): Promise<ConversationWithDetails | null> {
        try {
            // Get conversation
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('id, created_at, updated_at')
                .eq('id', conversationId)
                .single();

            if (convError || !conv) {
                logger.error('Error fetching conversation:', convError);
                return null;
            }

            // Get participants with profiles
            const { data: participants, error: partError } = await supabase
                .from('conversation_participants')
                .select(`
                    user_id,
                    joined_at,
                    profiles:user_id (
                        id,
                        name,
                        image_url,
                        job_title,
                        company
                    )
                `)
                .eq('conversation_id', conversationId);

            if (partError) {
                logger.error('Error fetching participants:', partError);
            }

            // Get last message
            const { data: lastMessage, error: msgError } = await supabase
                .from('messages')
                .select(`
                    id,
                    conversation_id,
                    content,
                    created_at,
                    sender_id,
                    is_read,
                    profiles:sender_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (msgError && msgError.code !== 'PGRST116') {
                logger.error('Error fetching last message:', msgError);
            }

            // Get unread count
            const { count: unreadCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId)
                .eq('is_read', false)
                .neq('sender_id', currentUserId);

            // Find the other participant
            const otherParticipant = participants?.find(p => p.user_id !== currentUserId);

            return {
                ...conv,
                participants: participants || [],
                lastMessage: lastMessage || undefined,
                unreadCount: unreadCount || 0,
                otherParticipant: otherParticipant?.profiles as any
            };
        } catch (error) {
            logger.error('Error getting conversation by ID:', error);
            return null;
        }
    }

    /**
     * Clear the profile cache (useful after profile updates)
     */
    clearProfileCache(userId?: string): void {
        if (userId) {
            this.profileCache.delete(userId);
        } else {
            this.profileCache.clear();
        }
    }

    /**
     * Get all conversations for the current user
     * Uses offline cache for offline access (2 min TTL)
     */
    async getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
        const cacheKey = `conversations:${userId}`;

        const { data } = await fetchWithOfflineCache<ConversationWithDetails[]>(
            cacheKey,
            async () => {
                return this._fetchUserConversations(userId);
            },
            2 * 60 * 1000 // 2 minutes (short TTL for freshness)
        );
        return data;
    }

    /**
     * Internal: fetch conversations from Supabase
     */
    private async _fetchUserConversations(userId: string): Promise<ConversationWithDetails[]> {
        try {
            // 1. Get all conversation IDs for this user
            const { data: participantData, error: participantError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (participantError) throw participantError;
            if (!participantData || participantData.length === 0) return [];

            const conversationIds = participantData.map(p => p.conversation_id);

            // 2. Get conversation details
            const { data: conversations, error: conversationsError } = await supabase
                .from('conversations')
                .select('id, created_at, updated_at')
                .in('id', conversationIds)
                .order('updated_at', { ascending: false });

            if (conversationsError) throw conversationsError;
            if (!conversations) return [];

            // 3. For each conversation, get participants and last message
            const conversationsWithDetails = await Promise.all(
                conversations.map(async (conv) => {
                    // Get participants with profiles
                    const { data: participants, error: partError } = await supabase
                        .from('conversation_participants')
                        .select(`
                            user_id,
                            joined_at,
                            profiles:user_id (
                                id,
                                name,
                                image_url,
                                job_title,
                                company
                            )
                        `)
                        .eq('conversation_id', conv.id);

                    if (partError) {
                        logger.error('Error fetching participants:', partError);
                    }

                    // Get last message
                    const { data: lastMessage, error: msgError } = await supabase
                        .from('messages')
                        .select(`
                            id,
                            conversation_id,
                            content,
                            created_at,
                            sender_id,
                            is_read,
                            is_deleted,
                            profiles:sender_id (
                                id,
                                name,
                                image_url
                            )
                        `)
                        .eq('conversation_id', conv.id)
                        .eq('is_deleted', false)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (msgError && msgError.code !== 'PGRST116') {
                        // PGRST116 = no rows returned, which is ok
                        logger.error('Error fetching last message:', msgError);
                    }

                    // Get unread count
                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .eq('is_read', false)
                        .neq('sender_id', userId);

                    // Find the other participant (not the current user)
                    const otherParticipant = participants?.find(p => p.user_id !== userId);

                    return {
                        ...conv,
                        participants: participants || [],
                        lastMessage: lastMessage || undefined,
                        unreadCount: unreadCount || 0,
                        otherParticipant: otherParticipant?.profiles as any
                    };
                })
            );

            // Filter out conversations archived by this user
            const archivedIds = this.getArchivedConversationIds(userId);
            return conversationsWithDetails.filter(c => !archivedIds.includes(c.id));
        } catch (error) {
            logger.error('Error fetching conversations:', error);
            throw error;
        }
    }

    /**
     * Get or create a conversation between two users
     */
    async getOrCreateConversation(userId: string, otherUserId: string): Promise<string> {
        try {
            // 1. Check if conversation already exists
            const { data: existingConvs, error: searchError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (searchError) throw searchError;

            if (existingConvs && existingConvs.length > 0) {
                // Check if any of these conversations include the other user
                for (const conv of existingConvs) {
                    const { data: otherUserInConv } = await supabase
                        .from('conversation_participants')
                        .select('user_id')
                        .eq('conversation_id', conv.conversation_id)
                        .eq('user_id', otherUserId)
                        .maybeSingle();

                    if (otherUserInConv) {
                        // Conversation exists
                        return conv.conversation_id;
                    }
                }
            }

            // 2. Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            if (!newConv) throw new Error('Failed to create conversation');

            // 3. Add current user as participant first (passes RLS: auth.uid() = user_id)
            const { error: selfError } = await supabase
                .from('conversation_participants')
                .insert({ conversation_id: newConv.id, user_id: userId });

            if (selfError) throw selfError;

            // 4. Add other user as participant (passes RLS: user is already a participant)
            const { error: otherError } = await supabase
                .from('conversation_participants')
                .insert({ conversation_id: newConv.id, user_id: otherUserId });

            if (otherError) throw otherError;

            return newConv.id;
        } catch (error) {
            logger.error('Error getting or creating conversation:', error);
            throw error;
        }
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    conversation_id,
                    sender_id,
                    content,
                    is_read,
                    is_deleted,
                    message_type,
                    media_url,
                    media_filename,
                    created_at,
                    profiles:sender_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * Send a message
     */
    async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content: content.trim(),
                    message_type: 'text'
                })
                .select(`
                    id,
                    conversation_id,
                    sender_id,
                    content,
                    is_read,
                    message_type,
                    media_url,
                    media_filename,
                    created_at,
                    profiles:sender_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Failed to send message');

            // ─── Push notification — MUST await to avoid browser aborting ───
            // We await the push call so the browser doesn't cancel the request.
            // The try/catch ensures a push failure never blocks message delivery.
            try {
                const { data: participants } = await supabase
                    .from('conversation_participants')
                    .select('user_id')
                    .eq('conversation_id', conversationId)
                    .neq('user_id', senderId);
                if (participants?.length) {
                    await notifyNewMessage(conversationId, senderId, participants[0].user_id, content.trim());
                }
            } catch { /* Never block message delivery */ }

            return data;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }



    /**
     * Send a media message (image or file)
     * Uploads file to chat-media bucket, then inserts message with media metadata
     */
    async sendMediaMessage(
        conversationId: string,
        senderId: string,
        file: File,
        caption?: string
    ): Promise<Message> {
        try {
            // Validate file size (max 25MB)
            const MAX_SIZE = 25 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                throw new Error('Arquivo muito grande. Máximo permitido: 25MB.');
            }

            // Determine message type
            const isImage = file.type.startsWith('image/');
            const messageType: MessageType = isImage ? 'image' : 'file';

            // Generate unique path: conversationId/timestamp_filename
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `${conversationId}/${Date.now()}_${safeName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                logger.error('❌ Chat Media: Upload error:', uploadError);
                throw new Error('Falha ao enviar arquivo. Tente novamente.');
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            // Insert message with media metadata
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content: caption?.trim() || (isImage ? '📷 Imagem' : `📎 ${file.name}`),
                    message_type: messageType,
                    media_url: publicUrl,
                    media_filename: file.name
                })
                .select(`
                    id,
                    conversation_id,
                    sender_id,
                    content,
                    is_read,
                    message_type,
                    media_url,
                    media_filename,
                    created_at,
                    profiles:sender_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Failed to send media message');

            logger.info('✅ Chat Media: Sent successfully', {
                type: messageType,
                filename: file.name,
                size: `${(file.size / 1024).toFixed(0)}KB`
            });

            return data;
        } catch (error) {
            logger.error('Error sending media message:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
        try {
            logger.debug('📖 ConversationService: Marking messages as read', {
                conversationId,
                userId
            });

            const { data, error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', userId)
                .eq('is_read', false)
                .select();

            if (error) throw error;

            logger.debug('✅ ConversationService: Marked messages as read', {
                count: data?.length || 0,
                messageIds: data?.map(m => m.id) || []
            });
        } catch (error) {
            logger.error('Error marking messages as read:', error);
            throw error;
        }
    }

    /**
     * Soft-delete a message (set is_deleted = true).
     * Only the sender should call this on their own messages.
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_deleted: true })
                .eq('id', messageId);

            if (error) throw error;
            logger.debug('🗑️ ConversationService: Soft-deleted message', { messageId });
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    // ─── Local Archive (Member soft-delete) ──────────────────────

    /**
     * Archive a conversation for a specific user (localStorage-based).
     * The conversation disappears from their list but remains for the other participant.
     */
    archiveConversation(conversationId: string, userId: string): void {
        const key = `archived_conversations:${userId}`;
        const archived = this.getArchivedConversationIds(userId);
        if (!archived.includes(conversationId)) {
            archived.push(conversationId);
            localStorage.setItem(key, JSON.stringify(archived));
        }
    }

    /**
     * Get all archived conversation IDs for a user.
     */
    getArchivedConversationIds(userId: string): string[] {
        try {
            const key = `archived_conversations:${userId}`;
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Unarchive a conversation (e.g., when a new message arrives).
     */
    unarchiveConversation(conversationId: string, userId: string): void {
        const key = `archived_conversations:${userId}`;
        const archived = this.getArchivedConversationIds(userId);
        const filtered = archived.filter(id => id !== conversationId);
        localStorage.setItem(key, JSON.stringify(filtered));
    }

    /**
     * Delete a conversation (admin only)
     */
    async deleteConversation(conversationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            if (error) throw error;
        } catch (error) {
            logger.error('Error deleting conversation:', error);
            throw error;
        }
    }
}

export const conversationService = new ConversationService();

