import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types/types';
import { logger } from '../utils/logger';

/**
 * Hook para escutar novas mensagens em uma conversa específica via Supabase Realtime
 * 
 * @param conversationId - ID da conversa atual
 * @param onNewMessage - Callback chamado quando nova mensagem é recebida
 * 
 * @example
 * ```tsx
 * const [messages, setMessages] = useState<Message[]>([]);
 * 
 * useChatSubscription(currentConversationId, (newMessage) => {
 *   setMessages(prev => {
 *     if (prev.some(m => m.id === newMessage.id)) return prev;
 *     return [...prev, newMessage];
 *   });
 * });
 * ```
 */
export const useChatSubscription = (
    conversationId: string | null,
    onNewMessage: (message: Message) => void
) => {
    useEffect(() => {
        if (!conversationId) return;

        logger.debug('🔌 Subscribing to conversation:', conversationId);

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    logger.debug('📨 New message received:', payload.new);
                    onNewMessage(payload.new as Message);
                }
            )
            .subscribe();

        // Cleanup: Unsubscribe ao desmontar ou trocar conversa
        return () => {
            logger.debug('🔌 Unsubscribing from conversation:', conversationId);
            supabase.removeChannel(channel);
        };
    }, [conversationId, onNewMessage]);
};
