import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

/**
 * Hook para gerenciar indicador de "digitando..." via Broadcast Channel
 * NÃO grava no banco de dados - apenas broadcast em tempo real
 * 
 * @param conversationId - ID da conversa atual
 * @param userId - ID do usuário logado
 * @returns Object com lista de usuários digitando e função para enviar evento
 * 
 * @example
 * ```tsx
 * const { typingUsers, sendTypingEvent } = useTypingIndicator(conversationId, userId);
 * 
 * <input
 *   onFocus={() => sendTypingEvent(true)}
 *   onBlur={() => sendTypingEvent(false)}
 * />
 * 
 * {typingUsers.length > 0 && (
 *   <div>
 *     {typingUsers.length === 1 ? 'Alguém' : `${typingUsers.length} pessoas`} digitando...
 *   </div>
 * )}
 * ```
 */
export const useTypingIndicator = (
    conversationId: string | null,
    userId: string | null
) => {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        if (!conversationId || !userId) return;

        logger.debug('⌨️ Setting up typing indicator for conversation:', conversationId);

        const typingChannel = supabase.channel(`typing:${conversationId}`);

        // Escutar eventos de digitação
        typingChannel
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { user_id, is_typing } = payload.payload;

                // Ignorar próprio evento
                if (user_id === userId) return;

                logger.debug('⌨️ Typing event received:', { user_id, is_typing });

                setTypingUsers(prev => {
                    if (is_typing) {
                        // Adicionar usuário se não estiver na lista
                        return prev.includes(user_id) ? prev : [...prev, user_id];
                    } else {
                        // Remover usuário da lista
                        return prev.filter(id => id !== user_id);
                    }
                });

                // Auto-remover após 3 segundos (caso usuário não envie evento de parada)
                if (is_typing) {
                    setTimeout(() => {
                        setTypingUsers(prev => prev.filter(id => id !== user_id));
                    }, 3000);
                }
            })
            .subscribe();

        setChannel(typingChannel);

        return () => {
            logger.debug('⌨️ Cleaning up typing indicator');
            supabase.removeChannel(typingChannel);
            setTypingUsers([]);
        };
    }, [conversationId, userId]);

    // Função para enviar evento de digitação
    const sendTypingEvent = useCallback((isTyping: boolean) => {
        if (!channel || !userId) return;

        logger.debug('⌨️ Sending typing event:', isTyping);

        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: userId, is_typing: isTyping }
        });
    }, [channel, userId]);

    return { typingUsers, sendTypingEvent };
};
