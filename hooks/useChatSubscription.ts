import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';
import { logger } from '../utils/logger';

/**
 * Hook para escutar novas mensagens em uma conversa específica via Supabase Realtime.
 * Inclui:
 *  - Status handler (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT)
 *  - Reconexão automática após erro/timeout
 *  - Reconexão ao retornar online (troca WiFi → 4G)
 *
 * @param conversationId - ID da conversa atual
 * @param onNewMessage - Callback chamado quando nova mensagem é recebida
 */
export const useChatSubscription = (
    conversationId: string | null,
    onNewMessage: (message: Message) => void
) => {
    // Ref estável para sempre ter o callback mais recente sem re-subscribe
    const callbackRef = useRef(onNewMessage);
    callbackRef.current = onNewMessage;

    useEffect(() => {
        if (!conversationId) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let isCleanedUp = false;

        const setupChannel = () => {
            // Limpar canal anterior se existir
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
            if (isCleanedUp) return;

            logger.debug('[Chat Realtime] 🔌 Subscribing to conversation:', conversationId);

            channel = supabase
                .channel(`messages:${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        const raw = payload.new as Record<string, unknown>;
                        // Realtime retorna snake_case (nome da coluna), não camelCase
                        if (raw.conversation_id !== conversationId) return;
                        logger.debug('📨 New message received:', raw);
                        callbackRef.current(raw as unknown as Message);
                    }
                )
                .subscribe((status, err) => {
                    // ─── CRÍTICO: monitorar status do channel ───────────
                    if (status === 'SUBSCRIBED') {
                        logger.debug('[Chat Realtime] ✅ Conectado à conversa:', conversationId);
                    }
                    if (status === 'CHANNEL_ERROR') {
                        logger.error('[Chat Realtime] ❌ Erro no channel:', err);
                        if (!isCleanedUp) {
                            reconnectTimer = setTimeout(setupChannel, 3000);
                        }
                    }
                    if (status === 'TIMED_OUT') {
                        logger.warn('[Chat Realtime] ⏱️ Timeout — reconectando...');
                        if (!isCleanedUp) {
                            reconnectTimer = setTimeout(setupChannel, 2000);
                        }
                    }
                    if (status === 'CLOSED') {
                        logger.debug('[Chat Realtime] 🔒 Channel fechado');
                    }
                });
        };

        setupChannel();

        // ─── Reconexão ao voltar online (troca de rede no celular) ─────
        const handleOnline = () => {
            logger.info('[Chat Realtime] 📶 Online — reconectando canal...');
            setupChannel();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            isCleanedUp = true;
            window.removeEventListener('online', handleOnline);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (channel) {
                logger.debug('[Chat Realtime] 🔌 Unsubscribing from conversation:', conversationId);
                supabase.removeChannel(channel);
            }
        };
    }, [conversationId]);
};
