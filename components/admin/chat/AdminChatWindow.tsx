// ============================================
// ADMIN CHAT WINDOW — Messages view + input
// Extracted from AdminChatManager.tsx (Operação Estilhaço)
// Presenter component
// ============================================

import React from 'react';
import {
    MessageSquare, Trash2, Send, Loader2, X, Ban, UserCheck, ArrowLeft,
} from 'lucide-react';
import { ConversationWithParticipants, MessageWithSender } from '../../../services/adminChatService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AdminChatWindowProps {
    selectedConversation: ConversationWithParticipants | null;
    messages: MessageWithSender[];
    loadingMessages: boolean;
    newMessage: string;
    sending: boolean;
    currentAdminId: string;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    isUserBlocked: (userId: string) => boolean;
    onBack: () => void;
    onClose: () => void;
    onNewMessageChange: (value: string) => void;
    onSendMessage: () => void;
    onDeleteMessage: (messageId: string) => void;
    onBlockClick: (userId: string, userName: string, isBlocked: boolean) => void;
    getParticipantNames: (conv: ConversationWithParticipants) => string;
    isHidden: boolean;
}

export const AdminChatWindow: React.FC<AdminChatWindowProps> = ({
    selectedConversation,
    messages,
    loadingMessages,
    newMessage,
    sending,
    currentAdminId,
    messagesEndRef,
    isUserBlocked,
    onBack,
    onClose,
    onNewMessageChange,
    onSendMessage,
    onDeleteMessage,
    onBlockClick,
    getParticipantNames,
    isHidden,
}) => {
    const isAdminMessage = (msg: MessageWithSender): boolean => {
        return msg.sender_id === currentAdminId;
    };

    return (
        <div className={`
            ${isHidden ? 'hidden md:flex' : 'flex'}
            flex-1 flex-col min-w-0
        `}>
            {selectedConversation ? (
                <>
                    {/* Chat Header */}
                    <div className="p-3 md:p-4 border-b border-prosperus-navy-light bg-prosperus-navy-light">
                        <div className="flex items-center gap-3">
                            {/* Back button — mobile only */}
                            <button
                                onClick={onBack}
                                className="md:hidden p-2 -ml-1 hover:bg-prosperus-navy rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} className="text-prosperus-grey" />
                            </button>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm md:text-base truncate">
                                    {getParticipantNames(selectedConversation)}
                                </h3>
                                <p className="text-xs text-prosperus-grey truncate">
                                    {selectedConversation.participants.map(p => p.email).join(', ')}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Block/Unblock Button */}
                                {selectedConversation.participants.length === 2 && selectedConversation.participants.map(participant => {
                                    if (participant.id !== currentAdminId) {
                                        const blocked = isUserBlocked(participant.id);
                                        return (
                                            <button
                                                key={participant.id}
                                                onClick={() => onBlockClick(participant.id, participant.name, blocked)}
                                                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs md:text-sm ${blocked
                                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                                    : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                                                    }`}
                                                title={blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                                            >
                                                {blocked ? <UserCheck size={16} /> : <Ban size={16} />}
                                                <span className="hidden sm:inline font-medium">
                                                    {blocked ? 'Desbloquear' : 'Bloquear'}
                                                </span>
                                            </button>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Close — desktop only */}
                                <button
                                    onClick={onClose}
                                    className="hidden md:block p-2 hover:bg-prosperus-navy rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-prosperus-grey" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-prosperus-gold" size={32} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-prosperus-grey">
                                <MessageSquare size={40} className="mb-2" />
                                <p className="text-sm">Nenhuma mensagem ainda</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${isAdminMessage(msg) ? 'justify-end' : 'justify-start'} group`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] ${isAdminMessage(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {/* Sender name and badge */}
                                        <div className="flex items-center gap-2 mb-1">
                                            {isAdminMessage(msg) && (
                                                <span className="text-xs bg-prosperus-gold text-prosperus-navy px-2 py-0.5 rounded-full font-bold">
                                                    ADMIN
                                                </span>
                                            )}
                                            <span className="text-xs text-prosperus-grey">
                                                {msg.sender.name}
                                            </span>
                                        </div>

                                        {/* Message bubble */}
                                        <div className="relative">
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl ${isAdminMessage(msg)
                                                    ? 'bg-prosperus-gold text-prosperus-navy rounded-br-md'
                                                    : msg.is_deleted
                                                        ? 'bg-red-500/20 text-red-300 italic rounded-bl-md'
                                                        : 'bg-prosperus-navy-light text-white rounded-bl-md'
                                                    }`}
                                            >
                                                <p className="break-words text-sm">{msg.content}</p>
                                                <p className="text-xs mt-1 opacity-60">
                                                    {formatDistanceToNow(new Date(msg.created_at), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
                                                </p>
                                            </div>

                                            {/* Delete button (only for non-admin messages) */}
                                            {!isAdminMessage(msg) && !msg.is_deleted && (
                                                <button
                                                    onClick={() => onDeleteMessage(msg.id)}
                                                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                                                    title="Deletar mensagem"
                                                >
                                                    <Trash2 size={16} className="text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 md:p-4 border-t border-prosperus-navy-light bg-prosperus-navy-light">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => onNewMessageChange(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                                disabled={sending}
                                className="flex-1 px-4 py-2.5 bg-prosperus-navy text-white text-sm rounded-xl border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={onSendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="px-4 py-2.5 bg-prosperus-gold text-prosperus-navy rounded-xl font-semibold hover:bg-prosperus-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {sending ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-prosperus-grey">
                    <MessageSquare size={56} className="mb-4 opacity-30" />
                    <p className="text-base">Selecione uma conversa</p>
                    <p className="text-sm text-prosperus-grey/60 mt-1">para visualizar as mensagens</p>
                </div>
            )}
        </div>
    );
};
