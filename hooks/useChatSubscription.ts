import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { logger } from '../utils/logger';

/**
 * Hook para escutar novas mensagens em uma conversa específica.
 *
 * NÃO cria channel Realtime próprio — consome o evento `prosperus:new-message`
 * disparado por useUnreadMessageCount (que é o único subscriber de `messages`).
 * Isso evita o erro "mismatch between server and client bindings" que ocorre
 * quando dois channels escutam a mesma tabela com bindings diferentes.
 *
 * @param conversationId - ID da conversa atual
 * @param onNewMessage - Callback chamado quando nova mensagem é recebida
 */
export const useChatSubscription = (
    conversationId: string | null,
    onNewMessage: (message: Message) => void
) => {
    const callbackRef = useRef(onNewMessage);
    callbackRef.current = onNewMessage;

    useEffect(() => {
        if (!conversationId) return;

        logger.debug('[Chat Realtime] 🔌 Listening for messages in conversation:', conversationId);

        const handleNewMessage = (event: Event) => {
            const raw = (event as CustomEvent).detail;
            if (!raw) return;

            // Filtrar: só processar mensagens DESTA conversa
            if (raw.conversation_id !== conversationId) return;

            logger.debug('📨 New message received:', raw);
            callbackRef.current(raw as unknown as Message);
        };

        window.addEventListener('prosperus:new-message', handleNewMessage);

        return () => {
            logger.debug('[Chat Realtime] 🔌 Stopped listening for conversation:', conversationId);
            window.removeEventListener('prosperus:new-message', handleNewMessage);
        };
    }, [conversationId]);
};
