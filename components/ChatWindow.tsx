// ChatWindow.tsx
// Premium chat window with modern messaging UX
// Features: gradient bubbles, date separators, auto-resize input, scroll FAB, animations

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Send, Loader2, MessageCircle, AlertCircle, RefreshCw, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { conversationService, Message } from '../services/conversationService';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
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

// Format timestamp for message bubbles (compact)
const formatMessageTime = (timestamp: string) => {
    try {
        return format(new Date(timestamp), 'HH:mm');
    } catch {
        return '';
    }
};

// Format date for separators
const formatDateSeparator = (timestamp: string) => {
    try {
        const date = new Date(timestamp);
        if (isToday(date)) return 'Hoje';
        if (isYesterday(date)) return 'Ontem';
        return format(date, "d 'de' MMMM", { locale: ptBR });
    } catch {
        return '';
    }
};

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
    const [showScrollFab, setShowScrollFab] = useState(false);
    const [newMsgCount, setNewMsgCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSubscribedRef = useRef(false);
    const isNearBottomRef = useRef(true);
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
                refreshUnreadCount();

                // 4. Subscribe to new messages (Realtime)
                subscription = conversationService.subscribeToConversation(
                    conversationId,
                    (newMsg) => {
                        // Avoid duplicates
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === newMsg.id);
                            if (exists) {
                                return prev.map(m =>
                                    m.id === newMsg.id ? { ...newMsg, _isOptimistic: false, _failed: false } : m
                                );
                            }

                            // New message from other user
                            if (newMsg.sender_id !== currentUserId) {
                                playNotificationSound();
                                // If user scrolled up, show count
                                if (!isNearBottomRef.current) {
                                    setNewMsgCount(prev => prev + 1);
                                }
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

        return () => {
            if (subscription) {
                subscription.unsubscribe();
                isSubscribedRef.current = false;
            }
        };
    }, [conversationId, currentUserId]);

    // Auto-scroll when messages change (only if near bottom)
    useEffect(() => {
        if (messages.length > 0 && isNearBottomRef.current) {
            const behavior = loading ? 'auto' : 'smooth';
            messagesEndRef.current?.scrollIntoView({ behavior });
        }
    }, [messages, loading]);

    // Track scroll position for FAB
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const nearBottom = distanceFromBottom < 100;

        isNearBottomRef.current = nearBottom;
        setShowScrollFab(!nearBottom && messages.length > 5);

        if (nearBottom) {
            setNewMsgCount(0);
        }
    }, [messages.length]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollFab(false);
        setNewMsgCount(0);
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
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

    // Auto-resize textarea
    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, []);

    // Handle send message with Optimistic UI
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setFailedMessage(null);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Create optimistic message
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

        setMessages(prev => [...prev, optimisticMessage]);
        isNearBottomRef.current = true; // Force scroll for own messages

        try {
            setSending(true);
            const sentMessage = await conversationService.sendMessage(
                conversationId,
                currentUserId,
                messageContent
            );

            setMessages(prev => prev.map(m =>
                m.id === optimisticId ? { ...sentMessage, _isOptimistic: false, _failed: false } : m
            ));

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(m =>
                m.id === optimisticId ? { ...m, _failed: true } : m
            ));
            setFailedMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    // Handle Enter key: on desktop, Enter sends (Shift+Enter = newline)
    // On mobile, Enter always inserts newline (user taps the send button)
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
        }
    }, [newMessage, sending]);

    // Retry failed message
    const handleRetry = async (failedMsg: OptimisticMessage) => {
        setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
        setNewMessage(failedMsg.content);
        setFailedMessage(null);
    };

    // Dismiss failed message
    const handleDismissFailed = (failedId: string) => {
        setMessages(prev => prev.filter(m => m.id !== failedId));
        setFailedMessage(null);
    };

    // Group messages with date separators
    const messagesWithSeparators = useMemo(() => {
        const result: Array<{ type: 'separator'; date: string } | { type: 'message'; message: OptimisticMessage; showAvatar: boolean }> = [];

        messages.forEach((message, index) => {
            const msgDate = new Date(message.created_at);
            const prevDate = index > 0 ? new Date(messages[index - 1].created_at) : null;

            // Add date separator if it's a new day
            if (!prevDate || !isSameDay(msgDate, prevDate)) {
                result.push({ type: 'separator', date: message.created_at });
            }

            const showAvatar =
                index === 0 ||
                messages[index - 1].sender_id !== message.sender_id ||
                (prevDate && !isSameDay(msgDate, prevDate));

            result.push({ type: 'message', message, showAvatar: !!showAvatar });
        });

        return result;
    }, [messages]);

    return (
        <div
            className="chat-window-root flex flex-col fixed inset-0 z-50 md:relative md:z-40 md:inset-auto"
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)',
            }}
        >
            {/* Header */}
            <div
                className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/50 shrink-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/5 rounded-xl transition-all duration-200 text-slate-400 hover:text-white active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Avatar with gradient ring */}
                <div className="relative">
                    <div
                        className="w-10 h-10 rounded-full p-[2px]"
                        style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)' }}
                    >
                        <img
                            src={otherUserImage || `${import.meta.env.BASE_URL}default-avatar.svg`}
                            alt={otherUserName}
                            className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                        />
                    </div>
                    {/* Online dot */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900">
                        <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white truncate text-sm">{otherUserName}</h2>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        Online
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-4 relative"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(250,204,21,0.02) 0%, transparent 50%)`,
                }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-2 border-yellow-500/20"></div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
                            </div>
                            <p className="text-slate-500 text-sm">Carregando mensagens...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                                background: 'linear-gradient(135deg, rgba(250,204,21,0.1), rgba(217,119,6,0.05))',
                                border: '1px solid rgba(250,204,21,0.15)',
                            }}
                        >
                            <MessageCircle className="w-10 h-10 text-yellow-500/60" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Inicie a conversa</h3>
                        <p className="text-slate-500 text-sm max-w-[240px]">
                            Envie uma mensagem para {otherUserName} e comece o networking!
                        </p>
                    </div>
                ) : (
                    <>
                        {messagesWithSeparators.map((item, index) => {
                            if (item.type === 'separator') {
                                return (
                                    <div key={`sep-${item.date}`} className="flex items-center justify-center my-4">
                                        <div
                                            className="px-3 py-1 rounded-full text-[11px] font-medium text-slate-400"
                                            style={{
                                                background: 'rgba(30,41,59,0.8)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(51,65,85,0.5)',
                                            }}
                                        >
                                            {formatDateSeparator(item.date)}
                                        </div>
                                    </div>
                                );
                            }

                            const { message, showAvatar } = item;
                            const isOwn = message.sender_id === currentUserId;
                            const isFailed = message._failed;
                            const isOptimistic = message._isOptimistic && !isFailed;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                                    style={{
                                        animation: isOptimistic ? 'none' : index === messagesWithSeparators.length - 1 ? 'slideInUp 0.3s ease-out' : 'none',
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className="w-7 shrink-0">
                                        {!isOwn && showAvatar && (
                                            <img
                                                src={otherUserImage || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                                alt={otherUserName}
                                                className="w-7 h-7 rounded-full object-cover border border-slate-700/50"
                                            />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-3 py-2 relative ${isFailed
                                                ? 'bg-red-900/40 border border-red-500/30'
                                                : isOwn
                                                    ? ''
                                                    : ''
                                                } ${isOptimistic ? 'opacity-60' : ''}`}
                                            style={{
                                                ...(isFailed ? {} : isOwn
                                                    ? {
                                                        background: 'linear-gradient(135deg, #b45309, #d97706)',
                                                        borderRadius: showAvatar ? '16px 16px 4px 16px' : '16px 4px 4px 16px',
                                                        boxShadow: '0 2px 8px rgba(217,119,6,0.2)',
                                                    }
                                                    : {
                                                        background: 'rgba(30,41,59,0.7)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid rgba(51,65,85,0.4)',
                                                        borderRadius: showAvatar ? '16px 16px 16px 4px' : '4px 16px 16px 4px',
                                                    }
                                                ),
                                                ...(isFailed ? { borderRadius: '16px' } : {}),
                                            }}
                                        >
                                            <p className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${(message as any).is_deleted ? 'italic opacity-60' : ''
                                                } ${isFailed ? 'text-red-200' : 'text-white'}`}>
                                                {(message as any).is_deleted
                                                    ? '[Mensagem removida pelo moderador]'
                                                    : message.content
                                                }
                                            </p>

                                            {/* Inline timestamp + status */}
                                            <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <span className={`text-[10px] ${isOwn ? 'text-amber-200/60' : 'text-slate-500'}`}>
                                                    {formatMessageTime(message.created_at)}
                                                </span>
                                                {isOwn && !isFailed && (
                                                    <span className="text-amber-200/60">
                                                        {isOptimistic ? (
                                                            <Loader2 size={10} className="animate-spin" />
                                                        ) : message.is_read ? (
                                                            <CheckCheck size={12} className="text-sky-400" />
                                                        ) : (
                                                            <Check size={12} />
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Failed indicator */}
                                            {isFailed && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-500/20">
                                                    <AlertCircle size={12} className="text-red-400" />
                                                    <span className="text-[11px] text-red-400">Falha</span>
                                                    <button
                                                        onClick={() => handleRetry(message)}
                                                        className="text-[11px] text-yellow-500 hover:text-yellow-400 flex items-center gap-1 ml-auto"
                                                    >
                                                        <RefreshCw size={10} />
                                                        Reenviar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismissFailed(message.id)}
                                                        className="text-[11px] text-slate-500 hover:text-slate-400"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}

                {/* Scroll to Bottom FAB — absolute inside messages container */}
                {showScrollFab && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(51,65,85,0.6)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        }}
                    >
                        <ChevronDown size={18} className="text-slate-300" />
                        {newMsgCount > 0 && (
                            <div
                                className="absolute -top-2 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                            >
                                {newMsgCount > 9 ? '9+' : newMsgCount}
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Input Area */}
            <div
                className="px-3 py-3 border-t border-slate-800/50 shrink-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,1) 100%)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua mensagem..."
                            disabled={sending}
                            rows={1}
                            maxLength={2000}
                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-slate-500 resize-none transition-all duration-200 focus:outline-none focus:border-yellow-600/50 focus:bg-slate-800/80 disabled:opacity-50"
                            style={{
                                minHeight: '40px',
                                maxHeight: '120px',
                                lineHeight: '1.4',
                            }}
                        />
                        {newMessage.length > 1800 && (
                            <span className={`absolute right-3 bottom-1.5 text-[10px] ${newMessage.length > 1950 ? 'text-red-400' : 'text-slate-600'
                                }`}>
                                {newMessage.length}/2000
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 shrink-0"
                        style={{
                            width: '44px',
                            height: '44px',
                            minWidth: '44px',
                            minHeight: '44px',
                            background: newMessage.trim()
                                ? 'linear-gradient(135deg, #b45309, #d97706)'
                                : 'rgba(51,65,85,0.5)',
                            boxShadow: newMessage.trim()
                                ? '0 2px 12px rgba(217,119,6,0.3)'
                                : 'none',
                        }}
                    >
                        {sending ? (
                            <Loader2 size={20} className="text-white animate-spin" />
                        ) : (
                            <Send size={20} className="text-white" />
                        )}
                    </button>
                </form>
            </div>

            {/* CSS Animation + Layout */}
            <style>{`
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (min-width: 768px) {
                    .chat-window-root {
                        height: 100% !important;
                        position: relative !important;
                    }
                }
            `}</style>
        </div>
    );
};
