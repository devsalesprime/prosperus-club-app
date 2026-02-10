// adminChatService.ts
// Serviço de administração para moderação de chat
// Permite ADMIN/TEAM visualizar todas as conversas e moderar conteúdo

import { supabase } from '../lib/supabase';

// Types
export interface ConversationWithParticipants {
    id: string;
    created_at: string;
    updated_at: string;
    participants: {
        id: string;
        name: string;
        email: string;
        image_url: string | null;
    }[];
    lastMessage?: {
        id: string;
        content: string;
        created_at: string;
        sender_id: string;
        is_deleted: boolean;
    } | null;
    messageCount: number;
}

export interface MessageWithSender {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    is_deleted: boolean;
    deleted_at?: string | null;
    deleted_by?: string | null;
    sender: {
        id: string;
        name: string;
        email: string;
        image_url: string | null;
    };
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

class AdminChatService {
    /**
     * Verifica se o usuário atual tem permissão de admin
     */
    private async checkAdminRole(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'ADMIN' || profile?.role === 'TEAM';
    }

    /**
     * Busca todas as conversas (paginado) - apenas para ADMIN/TEAM
     */
    async getAllConversations(
        page: number = 1,
        limit: number = 20,
        search?: string
    ): Promise<PaginatedResult<ConversationWithParticipants>> {
        console.log('📋 Admin: Fetching all conversations...');

        // Verificar permissão
        const isAdmin = await this.checkAdminRole();
        if (!isAdmin) {
            console.error('❌ Unauthorized: User is not ADMIN/TEAM');
            throw new Error('Unauthorized');
        }

        const offset = (page - 1) * limit;

        try {
            // Buscar conversas com count total
            let query = supabase
                .from('conversations')
                .select('*', { count: 'exact' })
                .order('updated_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data: conversations, error: convError, count } = await query;

            if (convError) {
                console.error('Error fetching conversations:', convError);
                throw convError;
            }

            // Para cada conversa, buscar participantes e última mensagem
            const enrichedConversations: ConversationWithParticipants[] = await Promise.all(
                (conversations || []).map(async (conv) => {
                    // Buscar participantes com profiles
                    const { data: participants } = await supabase
                        .from('conversation_participants')
                        .select(`
                            user_id,
                            profiles:user_id (
                                id,
                                name,
                                email,
                                image_url
                            )
                        `)
                        .eq('conversation_id', conv.id);

                    // Buscar última mensagem
                    const { data: lastMessage } = await supabase
                        .from('messages')
                        .select('id, content, created_at, sender_id, is_deleted')
                        .eq('conversation_id', conv.id)
                        .eq('is_deleted', false)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    // Contar mensagens
                    const { count: messageCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id);

                    // Mapear participantes
                    const mappedParticipants = (participants || [])
                        .map((p: any) => p.profiles)
                        .filter(Boolean);

                    // Filtrar por search se fornecido
                    if (search) {
                        const searchLower = search.toLowerCase();
                        const matchesSearch = mappedParticipants.some((p: any) =>
                            p.name?.toLowerCase().includes(searchLower) ||
                            p.email?.toLowerCase().includes(searchLower)
                        );
                        if (!matchesSearch) return null;
                    }

                    return {
                        id: conv.id,
                        created_at: conv.created_at,
                        updated_at: conv.updated_at,
                        participants: mappedParticipants,
                        lastMessage: lastMessage || null,
                        messageCount: messageCount || 0
                    };
                })
            );

            // Remover nulls (conversas filtradas pelo search)
            const filteredConversations = enrichedConversations.filter(Boolean) as ConversationWithParticipants[];

            console.log(`✅ Admin: Found ${filteredConversations.length} conversations`);

            return {
                data: filteredConversations,
                total: count || 0,
                page,
                limit,
                hasMore: offset + limit < (count || 0)
            };
        } catch (error) {
            console.error('Error in getAllConversations:', error);
            throw error;
        }
    }

    /**
     * Busca todas as mensagens de uma conversa específica
     */
    async getConversationMessages(conversationId: string): Promise<MessageWithSender[]> {
        console.log('💬 Admin: Fetching messages for conversation:', conversationId);

        const isAdmin = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized');
        }

        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    conversation_id,
                    sender_id,
                    content,
                    created_at,
                    is_read,
                    is_deleted,
                    deleted_at,
                    deleted_by,
                    profiles:sender_id (
                        id,
                        name,
                        email,
                        image_url
                    )
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                throw error;
            }

            // Mapear para o formato esperado
            const mappedMessages: MessageWithSender[] = (messages || []).map((msg: any) => ({
                id: msg.id,
                conversation_id: msg.conversation_id,
                sender_id: msg.sender_id,
                content: msg.is_deleted ? '[Mensagem removida pelo moderador]' : msg.content,
                created_at: msg.created_at,
                is_read: msg.is_read,
                is_deleted: msg.is_deleted || false,
                deleted_at: msg.deleted_at,
                deleted_by: msg.deleted_by,
                sender: msg.profiles || { id: msg.sender_id, name: 'Usuário', email: '', image_url: null }
            }));

            console.log(`✅ Admin: Found ${mappedMessages.length} messages`);
            return mappedMessages;
        } catch (error) {
            console.error('Error in getConversationMessages:', error);
            throw error;
        }
    }

    /**
     * Soft delete de uma mensagem (moderação)
     * Marca como deletada para mostrar placeholder
     */
    async deleteMessage(messageId: string, adminId: string): Promise<boolean> {
        console.log('🗑️ Admin: Soft deleting message:', messageId);

        const isAdmin = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized');
        }

        try {
            // Soft delete - marca como deletada para mostrar placeholder
            const { error } = await supabase
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: adminId
                })
                .eq('id', messageId);

            if (error) {
                console.error('Error deleting message:', error);
                throw error;
            }

            // Log de auditoria
            console.log(`📝 AUDIT: Admin ${adminId} soft deleted message ${messageId} at ${new Date().toISOString()}`);

            return true;
        } catch (error) {
            console.error('Error in deleteMessage:', error);
            throw error;
        }
    }

    /**
     * Restaurar uma mensagem deletada
     */
    async restoreMessage(messageId: string): Promise<boolean> {
        console.log('♻️ Admin: Restoring message:', messageId);

        const isAdmin = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized');
        }

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_deleted: false,
                    deleted_at: null,
                    deleted_by: null
                })
                .eq('id', messageId);

            if (error) throw error;

            console.log(`✅ Admin: Message ${messageId} restored`);
            return true;
        } catch (error) {
            console.error('Error restoring message:', error);
            throw error;
        }
    }

    /**
     * Envia uma mensagem como Admin/Suporte em qualquer conversa
     * Requer RLS policy que permite INSERT para admins
     */
    async sendAdminMessage(conversationId: string, adminId: string, content: string): Promise<MessageWithSender> {
        console.log('💬 Admin: Sending message to conversation:', conversationId);

        const isAdmin = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized: Only ADMIN/TEAM can send support messages');
        }

        if (!content.trim()) {
            throw new Error('Message content cannot be empty');
        }

        try {
            // Inserir mensagem
            const { data: message, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: adminId,
                    content: content.trim(),
                    is_read: false,
                    is_deleted: false
                })
                .select()
                .single();

            if (error) {
                console.error('Error sending admin message:', error);
                throw error;
            }

            // Buscar profile do admin para retornar mensagem completa
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('id, name, email, image_url')
                .eq('id', adminId)
                .single();

            // Atualizar updated_at da conversa
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);

            // Log de auditoria
            console.log(`📝 AUDIT: Admin ${adminId} sent message to conversation ${conversationId} at ${new Date().toISOString()}`);

            return {
                id: message.id,
                conversation_id: message.conversation_id,
                sender_id: message.sender_id,
                content: message.content,
                created_at: message.created_at,
                is_read: message.is_read,
                is_deleted: message.is_deleted,
                sender: adminProfile || { id: adminId, name: 'Suporte', email: '', image_url: null }
            };
        } catch (error) {
            console.error('Error in sendAdminMessage:', error);
            throw error;
        }
    }
}

export const adminChatService = new AdminChatService();
