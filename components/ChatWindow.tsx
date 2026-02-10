// ChatWindow.tsx
// Chat window component for displaying and sending messages
// PHASE 2: With Supabase Realtime integration

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { conversationService, Message } from '../services/conversationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnreadCountContext } from '../contexts/UnreadCountContext';

interface ChatWindowProps {
    conversationId: string;
    currentUserId: string;
    otherUserName: string;
    otherUserImage: string;
    onBack: () => void;
}

// Extended message type for optimistic UI
interface OptimisticMessage extends Message {
    _isOptimistic?: boolean;
    _failed?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    currentUserId,
    otherUserName,
    otherUserImage,
    onBack
}) => {
    const [messages, setMessages] = useState<OptimisticMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [failedMessage, setFailedMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isSubscribedRef = useRef(false);
    const { refreshUnreadCount } = useUnreadCountContext();

    // Load initial messages and setup subscription
    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        const initialize = async () => {
            try {
                setLoading(true);

                // 1. Load existing messages
                const data = await conversationService.getMessages(conversationId);
                setMessages(data);

                // 2. Mark as read
                await conversationService.markMessagesAsRead(conversationId, currentUserId);

                // 3. Refresh badge count immediately
                console.log('🔄 ChatWindow: Refreshing unread count after marking as read');
                refreshUnreadCount();

                // 4. Subscribe to new messages (Realtime)
                subscription = conversationService.subscribeToConversation(
                    conversationId,
                    (newMsg) => {
                        console.log('📩 Realtime: New message from subscription:', newMsg.id);

                        // Avoid duplicates - check if message already exists (from optimistic UI)
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === newMsg.id);
                            if (exists) {
                                // Replace optimistic message with real one
                                return prev.map(m =>
                                    m.id === newMsg.id ? { ...newMsg, _isOptimistic: false, _failed: false } : m
                                );
                            }

                            // New message from other user - add to list
                            if (newMsg.sender_id !== currentUserId) {
                                // Play notification sound for incoming messages
                                playNotificationSound();
                            }

                            return [...prev, newMsg];
                        });

                        // Mark as read if from other user
                        if (newMsg.sender_id !== currentUserId) {
                            conversationService.markMessagesAsRead(conversationId, currentUserId);
                        }
                    }
                );

                isSubscribedRef.current = true;

            } catch (error) {
                console.error('Error initializing chat:', error);
            } finally {
                setLoading(false);
            }
        };

        initialize();

        // Cleanup on unmount or conversationId change
        return () => {
            if (subscription) {
                console.log('🧹 ChatWindow: Cleaning up subscription');
                subscription.unsubscribe();
                isSubscribedRef.current = false;
            }
        };
    }, [conversationId, currentUserId]);

    // Auto-scroll when messages change
    useEffect(() => {
        if (messages.length > 0) {
            // Instant scroll on first load, smooth scroll for updates
            const behavior = loading ? 'auto' : 'smooth';
            messagesEndRef.current?.scrollIntoView({ behavior });
        }
    }, [messages, loading]);

    const scrollToBottom = useCallback((instant = false) => {
        messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }, []);

    // Play notification sound for incoming messages
    const playNotificationSound = useCallback(() => {
        try {
            // Create a simple notification beep using Web Audio API
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (err) {
            console.debug('Could not play notification sound:', err);
        }
    }, []);

    // Handle send message with Optimistic UI
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setFailedMessage(null);

        // Create optimistic message (with temporary ID)
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMessage: OptimisticMessage = {
            id: optimisticId,
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: messageContent,
            is_read: false,
            created_at: new Date().toISOString(),
            _isOptimistic: true,
            _failed: false
        };

        // Add optimistic message immediately
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            setSending(true);
            const sentMessage = await conversationService.sendMessage(
                conversationId,
                currentUserId,
                messageContent
            );

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m =>
                m.id === optimisticId ? { ...sentMessage, _isOptimistic: false, _failed: false } : m
            ));

        } catch (error) {
            console.error('Error sending message:', error);

            // Mark optimistic message as failed
            setMessages(prev => prev.map(m =>
                m.id === optimisticId ? { ...m, _failed: true } : m
            ));
            setFailedMessage(messageContent);

        } finally {
            setSending(false);
        }
    };

    // Retry failed message
    const handleRetry = async (failedMsg: OptimisticMessage) => {
        // Remove failed message
        setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
        setNewMessage(failedMsg.content);
        setFailedMessage(null);
    };

    // Dismiss failed message
    const handleDismissFailed = (failedId: string) => {
        setMessages(prev => prev.filter(m => m.id !== failedId));
        setFailedMessage(null);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: ptBR
            });
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900">
                <button
                    onClick={onBack}
                    className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <img
                    src={otherUserImage || '/default-avatar.svg'}
                    alt={otherUserName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                />
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white truncate">{otherUserName}</h2>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Nenhuma mensagem ainda</h3>
                        <p className="text-slate-400 text-sm">
                            Envie a primeira mensagem para iniciar a conversa
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwn = message.sender_id === currentUserId;
                            const showAvatar =
                                index === 0 ||
                                messages[index - 1].sender_id !== message.sender_id;
                            const isFailed = message._failed;
                            const isOptimistic = message._isOptimistic && !isFailed;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 shrink-0">
                                        {!isOwn && showAvatar && (
                                            <img
                                                src={otherUserImage || '/default-avatar.svg'}
                                                alt={otherUserName}
                                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                            />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div
                                        className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'
                                            } flex flex-col gap-1`}
                                    >
                                        <div
                                            className={`px-4 py-2 rounded-2xl relative ${isFailed
                                                ? 'bg-red-900/50 border border-red-600/50 text-red-200'
                                                : isOwn
                                                    ? 'bg-yellow-600 text-white'
                                                    : 'bg-slate-800 text-white'
                                                } ${isOptimistic ? 'opacity-70' : ''}`}
                                        >
                                            <p className={`text-sm whitespace-pre-wrap break-words ${(message as any).is_deleted ? 'italic opacity-70' : ''}`}>
                                                {(message as any).is_deleted
                                                    ? '[Mensagem removida pelo moderador]'
                                                    : message.content
                                                }
                                            </p>

                                            {/* Failed indicator */}
                                            {isFailed && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-600/30">
                                                    <AlertCircle size={14} className="text-red-400" />
                                                    <span className="text-xs text-red-400">Falha no envio</span>
                                                    <button
                                                        onClick={() => handleRetry(message)}
                                                        className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 ml-2"
                                                    >
                                                        <RefreshCw size={12} />
                                                        Tentar novamente
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismissFailed(message.id)}
                                                        className="text-xs text-slate-400 hover:text-slate-300 ml-1"
                                                    >
                                                        Descartar
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp + sending indicator */}
                                        <span className="text-xs text-slate-500 px-2 flex items-center gap-1">
                                            {isOptimistic && (
                                                <Loader2 size={10} className="animate-spin" />
                                            )}
                                            {formatTimestamp(message.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-800 bg-slate-900"
            >
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-600 transition disabled:opacity-50"
                        maxLength={2000}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    {newMessage.length}/2000 caracteres
                </p>
            </form>
        </div>
    );
};
