// ConversationList.tsx
// Premium conversation list with glassmorphism, animations, and modern UX
// With Supabase Realtime for live updates

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Search, Plus, Loader2, Users } from 'lucide-react';
import { conversationService, ConversationWithDetails } from '../services/conversationService';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationListProps {
    currentUserId: string;
    selectedConversationId?: string | null;
    onSelectConversation: (conversationId: string) => void;
    onNewConversation: () => void;
}

const formatTimestamp = (timestamp: string) => {
    try {
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'Ontem';
        return format(date, 'dd/MM/yy');
    } catch {
        return '';
    }
};

export const ConversationList: React.FC<ConversationListProps> = ({
    currentUserId,
    selectedConversationId,
    onSelectConversation,
    onNewConversation
}) => {
    const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const isSubscribedRef = useRef(false);

    // Load conversations and setup realtime subscription
    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await conversationService.getUserConversations(currentUserId);
                setConversations(data);

                subscription = conversationService.subscribeToUserMessages(
                    currentUserId,
                    async (payload) => {
                        const { conversation_id, sender_id, content, created_at } = payload;

                        setConversations(prevConversations => {
                            const existingIndex = prevConversations.findIndex(
                                c => c.id === conversation_id
                            );

                            if (existingIndex !== -1) {
                                const updatedConversations = [...prevConversations];
                                const conversation = { ...updatedConversations[existingIndex] };

                                conversation.lastMessage = {
                                    id: `temp-${Date.now()}`,
                                    conversation_id,
                                    sender_id,
                                    content,
                                    created_at,
                                    is_read: false
                                };

                                conversation.updated_at = created_at;

                                if (sender_id !== currentUserId && selectedConversationId !== conversation_id) {
                                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                                }

                                updatedConversations.splice(existingIndex, 1);
                                return [conversation, ...updatedConversations];
                            } else {
                                conversationService.getConversationById(conversation_id, currentUserId)
                                    .then(newConversation => {
                                        if (newConversation) {
                                            setConversations(prev => {
                                                const alreadyExists = prev.some(c => c.id === conversation_id);
                                                if (alreadyExists) return prev;
                                                return [newConversation, ...prev];
                                            });
                                        }
                                    })
                                    .catch(err => console.error('Error fetching new conversation:', err));

                                return prevConversations;
                            }
                        });
                    }
                );

                isSubscribedRef.current = true;

            } catch (err) {
                console.error('Error loading conversations:', err);
                setError('Erro ao carregar conversas');
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
    }, [currentUserId]);

    // Mark selected as read
    useEffect(() => {
        if (selectedConversationId) {
            setConversations(prev => prev.map(conv => {
                if (conv.id === selectedConversationId && conv.unreadCount > 0) {
                    return { ...conv, unreadCount: 0 };
                }
                return conv;
            }));
        }
    }, [selectedConversationId]);

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await conversationService.getUserConversations(currentUserId);
            setConversations(data);
        } catch (err) {
            console.error('Error loading conversations:', err);
            setError('Erro ao carregar conversas');
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const otherName = conv.otherParticipant?.name?.toLowerCase() || '';
        return otherName.includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-yellow-500/20"></div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-500 text-sm">Carregando conversas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)' }}>
                <div className="text-center p-6">
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <MessageCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 mb-4 text-sm">{error}</p>
                    <button
                        onClick={loadConversations}
                        className="px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #b45309, #d97706)',
                            boxShadow: '0 2px 12px rgba(217,119,6,0.3)',
                        }}
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)' }}>
            {/* Header */}
            <div
                className="p-4 border-b border-slate-800/50 shrink-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(217,119,6,0.1))' }}
                        >
                            <MessageCircle size={16} className="text-yellow-500" />
                        </div>
                        Mensagens
                    </h2>
                    <button
                        onClick={onNewConversation}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-200 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #b45309, #d97706)',
                            boxShadow: '0 2px 8px rgba(217,119,6,0.25)',
                        }}
                    >
                        <Plus size={14} className="text-white" />
                        <span className="text-white text-xs">Nova</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-yellow-500' : 'text-slate-500'
                            }`}
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="w-full rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder-slate-500 transition-all duration-200 focus:outline-none"
                        style={{
                            background: 'rgba(30,41,59,0.6)',
                            border: searchFocused
                                ? '1px solid rgba(217,119,6,0.4)'
                                : '1px solid rgba(51,65,85,0.4)',
                            boxShadow: searchFocused
                                ? '0 0 0 3px rgba(217,119,6,0.08)'
                                : 'none',
                        }}
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                                background: 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(217,119,6,0.04))',
                                border: '1px solid rgba(250,204,21,0.1)',
                            }}
                        >
                            {searchQuery ? (
                                <Search className="w-8 h-8 text-slate-600" />
                            ) : (
                                <Users className="w-8 h-8 text-yellow-500/50" />
                            )}
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5">
                            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4 max-w-[220px]">
                            {searchQuery
                                ? 'Tente buscar por outro nome'
                                : 'Inicie uma conversa com um membro do clube'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onNewConversation}
                                className="px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, #b45309, #d97706)',
                                    boxShadow: '0 2px 12px rgba(217,119,6,0.3)',
                                }}
                            >
                                <Plus size={16} />
                                Nova Conversa
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="py-1">
                        {filteredConversations.map((conversation, index) => {
                            const otherUser = conversation.otherParticipant;
                            const lastMsg = conversation.lastMessage;
                            const unread = conversation.unreadCount || 0;
                            const isSelected = selectedConversationId === conversation.id;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className="w-full px-3 py-3 transition-all duration-200 text-left flex items-center gap-3 group relative"
                                    style={{
                                        background: isSelected
                                            ? 'linear-gradient(90deg, rgba(217,119,6,0.12), rgba(217,119,6,0.04))'
                                            : 'transparent',
                                        animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`,
                                    }}
                                >
                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full"
                                            style={{ background: 'linear-gradient(180deg, #d97706, #f59e0b)' }}
                                        />
                                    )}

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div
                                            className={`w-12 h-12 rounded-full p-[2px] transition-all duration-200 ${isSelected ? '' : 'group-hover:shadow-lg'
                                                }`}
                                            style={{
                                                background: isSelected
                                                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                                                    : unread > 0
                                                        ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                                                        : 'rgba(51,65,85,0.5)',
                                            }}
                                        >
                                            <img
                                                src={otherUser?.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
                                                alt={otherUser?.name || 'Usuário'}
                                                className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                                            />
                                        </div>

                                        {/* Unread badge */}
                                        {unread > 0 && (
                                            <div
                                                className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
                                                style={{
                                                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                                                    boxShadow: '0 2px 8px rgba(217,119,6,0.4)',
                                                    animation: 'pulseScale 2s ease-in-out infinite',
                                                }}
                                            >
                                                {unread > 9 ? '9+' : unread}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                            <h3 className={`font-semibold text-sm truncate transition-colors duration-200 ${isSelected
                                                    ? 'text-yellow-500'
                                                    : unread > 0
                                                        ? 'text-white'
                                                        : 'text-slate-200 group-hover:text-white'
                                                }`}>
                                                {otherUser?.name || 'Usuário Desconhecido'}
                                            </h3>
                                            {lastMsg && (
                                                <span className={`text-[10px] shrink-0 ${unread > 0 ? 'text-yellow-500 font-semibold' : 'text-slate-600'
                                                    }`}>
                                                    {formatTimestamp(lastMsg.created_at)}
                                                </span>
                                            )}
                                        </div>

                                        {otherUser?.job_title && (
                                            <p className="text-[11px] text-slate-600 mb-0.5 truncate">
                                                {otherUser.job_title}
                                                {otherUser.company && ` · ${otherUser.company}`}
                                            </p>
                                        )}

                                        {lastMsg && (
                                            <p className={`text-xs truncate ${unread > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'
                                                }`}>
                                                {lastMsg.sender_id === currentUserId && (
                                                    <span className="text-slate-600">Você: </span>
                                                )}
                                                {lastMsg.content}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseScale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};
