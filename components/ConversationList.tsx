// ConversationList.tsx
// Component for displaying list of user conversations
// With Supabase Realtime for live updates

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Search, Plus, Loader2 } from 'lucide-react';
import { conversationService, ConversationWithDetails } from '../services/conversationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationListProps {
    currentUserId: string;
    selectedConversationId?: string | null;
    onSelectConversation: (conversationId: string) => void;
    onNewConversation: () => void;
}

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
    const isSubscribedRef = useRef(false);

    // Load conversations and setup realtime subscription
    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Load existing conversations
                const data = await conversationService.getUserConversations(currentUserId);
                setConversations(data);

                // 2. Subscribe to new messages (Realtime)
                subscription = conversationService.subscribeToUserMessages(
                    currentUserId,
                    async (payload) => {
                        console.log('📬 ConversationList: New message received:', payload);

                        const { conversation_id, sender_id, content, created_at } = payload;

                        // Update conversations state
                        setConversations(prevConversations => {
                            // Check if conversation exists in list
                            const existingIndex = prevConversations.findIndex(
                                c => c.id === conversation_id
                            );

                            if (existingIndex !== -1) {
                                // Cenário A: Conversation exists - update and move to top
                                const updatedConversations = [...prevConversations];
                                const conversation = { ...updatedConversations[existingIndex] };

                                // Update last message
                                conversation.lastMessage = {
                                    id: `temp-${Date.now()}`,
                                    conversation_id,
                                    sender_id,
                                    content,
                                    created_at,
                                    is_read: false
                                };

                                // Update timestamp
                                conversation.updated_at = created_at;

                                // Increment unread count if not from current user 
                                // and conversation is not currently selected
                                if (sender_id !== currentUserId && selectedConversationId !== conversation_id) {
                                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                                }

                                // Remove from current position
                                updatedConversations.splice(existingIndex, 1);

                                // Add to top
                                return [conversation, ...updatedConversations];
                            } else {
                                // Cenário B: New conversation - fetch details and add to top
                                console.log('🆕 ConversationList: New conversation detected, fetching details...');

                                // Fetch in background (don't block)
                                conversationService.getConversationById(conversation_id, currentUserId)
                                    .then(newConversation => {
                                        if (newConversation) {
                                            setConversations(prev => {
                                                // Check again if it was added in the meantime
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

        // Cleanup on unmount
        return () => {
            if (subscription) {
                console.log('🧹 ConversationList: Cleaning up subscription');
                subscription.unsubscribe();
                isSubscribedRef.current = false;
            }
        };
    }, [currentUserId]);

    // Update unread count when selected conversation changes (mark as read)
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

    // Reload conversations (for manual refresh)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Carregando conversas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <div className="text-center p-6">
                    <MessageCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={loadConversations}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle size={24} className="text-yellow-500" />
                        Mensagens
                    </h2>
                    <button
                        onClick={onNewConversation}
                        className="btn-sm p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
                        title="Nova conversa"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar conversas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-yellow-600 transition"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <MessageCircle className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">
                            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            {searchQuery
                                ? 'Tente buscar por outro nome'
                                : 'Inicie uma nova conversa com um membro'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onNewConversation}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Nova Conversa
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {filteredConversations.map((conversation) => {
                            const otherUser = conversation.otherParticipant;
                            const lastMsg = conversation.lastMessage;
                            const unread = conversation.unreadCount || 0;
                            const isSelected = selectedConversationId === conversation.id;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className={`w-full p-4 transition text-left flex items-start gap-3 group ${isSelected
                                        ? 'bg-yellow-600/10 border-l-2 border-yellow-600'
                                        : 'hover:bg-slate-900'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={otherUser?.image_url || '/default-avatar.svg'}
                                            alt={otherUser?.name || 'Usuário'}
                                            className={`w-12 h-12 rounded-full object-cover border-2 transition ${isSelected
                                                ? 'border-yellow-600'
                                                : 'border-slate-700 group-hover:border-yellow-600'
                                                }`}
                                        />
                                        {unread > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                                {unread > 9 ? '9+' : unread}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-bold truncate transition ${isSelected
                                                ? 'text-yellow-500'
                                                : 'text-white group-hover:text-yellow-500'
                                                }`}>
                                                {otherUser?.name || 'Usuário Desconhecido'}
                                            </h3>
                                            {lastMsg && (
                                                <span className={`text-xs shrink-0 ${unread > 0 ? 'text-yellow-500 font-bold' : 'text-slate-500'
                                                    }`}>
                                                    {formatTimestamp(lastMsg.created_at)}
                                                </span>
                                            )}
                                        </div>

                                        {otherUser?.job_title && (
                                            <p className="text-xs text-slate-500 mb-1 truncate">
                                                {otherUser.job_title}
                                                {otherUser.company && ` @ ${otherUser.company}`}
                                            </p>
                                        )}

                                        {lastMsg && (
                                            <p
                                                className={`text-sm truncate ${unread > 0 ? 'text-white font-medium' : 'text-slate-400'
                                                    }`}
                                            >
                                                {lastMsg.sender_id === currentUserId && (
                                                    <span className="text-slate-500">Você: </span>
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
        </div>
    );
};
