// ============================================
// ADMIN CHAT SIDEBAR — Conversation list
// Extracted from AdminChatManager.tsx (Operação Estilhaço)
// Presenter component
// ============================================

import React from 'react';
import { MessageSquare, Search, Trash2, Loader2, Shield } from 'lucide-react';
import { ConversationWithParticipants } from '../../../services/adminChatService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AdminChatSidebarProps {
    conversations: ConversationWithParticipants[];
    selectedConversationId: string | null;
    loading: boolean;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
    onSelectConversation: (conv: ConversationWithParticipants) => void;
    onDeleteConversation: (conv: ConversationWithParticipants) => void;
    onNewConversation: () => void;
    getParticipantNames: (conv: ConversationWithParticipants) => string;
    isHidden: boolean;
}

export const AdminChatSidebar: React.FC<AdminChatSidebarProps> = ({
    conversations,
    selectedConversationId,
    loading,
    searchQuery,
    onSearchChange,
    onSearch,
    onSelectConversation,
    onDeleteConversation,
    onNewConversation,
    getParticipantNames,
    isHidden,
}) => {
    return (
        <div className={`
            ${isHidden ? 'hidden md:flex' : 'flex'}
            w-full md:w-80 lg:w-96 md:border-r border-prosperus-navy-light flex-col flex-shrink-0
        `}>
            {/* Header */}
            <div className="p-4 border-b border-prosperus-navy-light">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-prosperus-gold flex items-center gap-2">
                        <Shield size={20} />
                        Chat Manager
                    </h2>
                    <button
                        onClick={onNewConversation}
                        className="px-3 py-1.5 bg-prosperus-gold text-prosperus-navy rounded-lg font-semibold hover:bg-prosperus-gold/90 transition-colors flex items-center gap-2 text-sm"
                    >
                        <MessageSquare size={14} />
                        Nova Conversa
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        className="w-full px-4 py-2.5 pl-10 bg-prosperus-navy-light text-white rounded-lg border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none text-sm"
                    />
                    <Search className="absolute left-3 top-3 text-prosperus-grey" size={18} />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-prosperus-gold" size={32} />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-prosperus-grey">
                        <MessageSquare size={40} className="mb-2" />
                        <p className="text-sm">Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => onSelectConversation(conv)}
                            className={`p-4 border-b border-prosperus-navy-light cursor-pointer transition-colors group ${selectedConversationId === conv.id
                                ? 'bg-prosperus-navy-light'
                                : 'hover:bg-prosperus-navy-light/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-prosperus-gold/20 flex items-center justify-center">
                                        <MessageSquare size={18} className="text-prosperus-gold" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white truncate text-sm">
                                        {getParticipantNames(conv)}
                                    </p>
                                    <p className="text-xs text-prosperus-grey truncate mt-0.5">
                                        {conv.lastMessage?.content || 'Sem mensagens'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-prosperus-grey/70">
                                            {conv.messageCount} msg
                                        </span>
                                        {conv.lastMessage && (
                                            <span className="text-xs text-prosperus-grey/70">
                                                • {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Delete conversation button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conv);
                                    }}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20
                                            transition-colors opacity-0 group-hover:opacity-100
                                            flex-shrink-0"
                                    title="Excluir conversa"
                                >
                                    <Trash2 size={14} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
