// ChatModerationList.tsx
// Lista de conversas para moderação administrativa

import React, { useState, useEffect } from 'react';
import {
    Search,
    MessageCircle,
    ChevronRight,
    RefreshCw,
    Users,
    Calendar,
    Hash,
    AlertCircle
} from 'lucide-react';
import { adminChatService, ConversationWithParticipants } from '../../services/adminChatService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatModerationListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string | null;
}

export const ChatModerationList: React.FC<ChatModerationListProps> = ({
    onSelectConversation,
    selectedConversationId
}) => {
    const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    const loadConversations = async (reset: boolean = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentPage = reset ? 1 : page;
            const result = await adminChatService.getAllConversations(currentPage, 20, searchQuery || undefined);

            if (reset) {
                setConversations(result.data);
                setPage(1);
            } else {
                setConversations(prev => [...prev, ...result.data]);
            }

            setHasMore(result.hasMore);
            setTotal(result.total);
        } catch (err: unknown) {
            console.error('Error loading conversations:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar conversas';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations(true);
    }, [searchQuery]);

    const handleRefresh = () => {
        setPage(1);
        loadConversations(true);
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
        loadConversations(false);
    };

    const formatParticipants = (participants: ConversationWithParticipants['participants']) => {
        if (participants.length === 0) return 'Sem participantes';
        if (participants.length === 1) return participants[0].name;
        if (participants.length === 2) {
            return `${participants[0].name} & ${participants[1].name}`;
        }
        return `${participants[0].name} & +${participants.length - 1}`;
    };

    const formatTime = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: ptBR
            });
        } catch {
            return 'Data inválida';
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageCircle className="text-yellow-500" size={20} />
                        Conversas
                        <span className="text-sm font-normal text-slate-400">({total})</span>
                    </h3>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por usuário..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-yellow-600 transition"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {error && (
                    <div className="p-4 m-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="text-red-400 shrink-0" size={20} />
                        <div>
                            <p className="text-red-400 text-sm">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="text-xs text-red-300 hover:underline mt-1"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                )}

                {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-slate-400 text-sm">Carregando conversas...</p>
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <MessageCircle size={48} className="mb-3 opacity-50" />
                        <p>Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`w-full p-4 text-left hover:bg-slate-800/50 transition flex items-center gap-3 ${selectedConversationId === conv.id ? 'bg-slate-800 border-l-2 border-yellow-500' : ''
                                    }`}
                            >
                                {/* Avatars */}
                                <div className="relative shrink-0">
                                    {conv.participants.length >= 2 ? (
                                        <div className="relative w-12 h-12">
                                            <img
                                                src={conv.participants[0]?.image_url || '/default-avatar.svg'}
                                                alt=""
                                                className="absolute top-0 left-0 w-8 h-8 rounded-full object-cover border-2 border-slate-900"
                                            />
                                            <img
                                                src={conv.participants[1]?.image_url || '/default-avatar.svg'}
                                                alt=""
                                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full object-cover border-2 border-slate-900"
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={conv.participants[0]?.image_url || '/default-avatar.svg'}
                                            alt=""
                                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                                        />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-white truncate">
                                            {formatParticipants(conv.participants)}
                                        </p>
                                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                                            {formatTime(conv.updated_at)}
                                        </span>
                                    </div>

                                    {conv.lastMessage && (
                                        <p className={`text-sm truncate ${conv.lastMessage.is_deleted ? 'text-red-400 italic' : 'text-slate-400'
                                            }`}>
                                            {conv.lastMessage.is_deleted
                                                ? '[Mensagem removida]'
                                                : conv.lastMessage.content}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Hash size={12} />
                                            {conv.messageCount} msgs
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={12} />
                                            {conv.participants.length}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className="text-slate-600 shrink-0" size={20} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && !loading && (
                    <div className="p-4">
                        <button
                            onClick={handleLoadMore}
                            className="w-full py-2 text-sm text-yellow-500 hover:text-yellow-400 transition"
                        >
                            Carregar mais conversas...
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
