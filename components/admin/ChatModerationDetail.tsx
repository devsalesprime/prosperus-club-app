// ChatModerationDetail.tsx
// Visualização detalhada de conversa com poderes de moderação

import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Trash2,
    RotateCcw,
    AlertCircle,
    Shield,
    ShieldOff,
    ShieldCheck,
    X,
    Loader2,
    MessageCircle,
    Ban,
    UserCheck,
    Send,
    Headphones
} from 'lucide-react';
import { adminChatService, MessageWithSender, ConversationWithParticipants } from '../../services/adminChatService';
import { adminUserService, UserProfile } from '../../services/adminUserService';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatModerationDetailProps {
    conversationId: string;
    currentAdminId: string;
    onBack: () => void;
}

export const ChatModerationDetail: React.FC<ChatModerationDetailProps> = ({
    conversationId,
    currentAdminId,
    onBack
}) => {
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Block user states
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedUserToBlock, setSelectedUserToBlock] = useState<{ id: string; name: string; isBlocked: boolean } | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [blockingUser, setBlockingUser] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

    // Admin message states
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    const loadMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminChatService.getConversationMessages(conversationId);
            setMessages(data);
        } catch (err: unknown) {
            console.error('Error loading messages:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mensagens';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleDeleteClick = (messageId: string) => {
        setSelectedMessageId(messageId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedMessageId) return;

        try {
            setDeletingMessageId(selectedMessageId);
            await adminChatService.deleteMessage(selectedMessageId, currentAdminId);

            // Atualizar estado local
            setMessages(prev => prev.map(msg =>
                msg.id === selectedMessageId
                    ? { ...msg, is_deleted: true, content: '[Mensagem removida pelo moderador]' }
                    : msg
            ));

            setShowDeleteModal(false);
            setSelectedMessageId(null);
        } catch (err: unknown) {
            console.error('Error deleting message:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao deletar mensagem: ' + errorMessage);
        } finally {
            setDeletingMessageId(null);
        }
    };

    const handleRestore = async (messageId: string) => {
        try {
            setDeletingMessageId(messageId);
            await adminChatService.restoreMessage(messageId);

            // Recarregar mensagens para obter conteúdo original
            await loadMessages();
        } catch (err: unknown) {
            console.error('Error restoring message:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao restaurar mensagem: ' + errorMessage);
        } finally {
            setDeletingMessageId(null);
        }
    };

    const formatTime = (date: string) => {
        try {
            return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
            return 'Data inválida';
        }
    };

    // Agrupar mensagens por data
    const groupMessagesByDate = (msgs: MessageWithSender[]) => {
        const groups: { date: string; messages: MessageWithSender[] }[] = [];
        let currentDate = '';

        msgs.forEach(msg => {
            const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({
                    date: format(new Date(msg.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
                    messages: [msg]
                });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    // Block user functions
    const handleBlockClick = (userId: string, userName: string, isBlocked: boolean) => {
        setSelectedUserToBlock({ id: userId, name: userName, isBlocked });
        setBlockReason('');
        setShowBlockModal(true);
    };

    const handleConfirmBlock = async () => {
        if (!selectedUserToBlock) return;

        try {
            setBlockingUser(true);
            const result = await adminUserService.toggleUserBlock(
                selectedUserToBlock.id,
                selectedUserToBlock.isBlocked ? undefined : blockReason
            );

            // Atualizar lista de bloqueados
            if (result.isBlocked) {
                setBlockedUsers(prev => new Set([...prev, selectedUserToBlock.id]));
            } else {
                setBlockedUsers(prev => {
                    const next = new Set(prev);
                    next.delete(selectedUserToBlock.id);
                    return next;
                });
            }

            alert(result.message);
            setShowBlockModal(false);
            setSelectedUserToBlock(null);
        } catch (err: unknown) {
            console.error('Error toggling user block:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro: ' + errorMessage);
        } finally {
            setBlockingUser(false);
        }
    };

    // Check if sender is blocked
    const isUserBlocked = (userId: string) => blockedUsers.has(userId);

    // Send admin message handler
    const handleSendMessage = async () => {
        if (!messageInput.trim() || sendingMessage) return;

        try {
            setSendingMessage(true);
            setSendError(null);

            const newMessage = await adminChatService.sendAdminMessage(
                conversationId,
                currentAdminId,
                messageInput.trim()
            );

            // Adicionar mensagem à lista local
            setMessages(prev => [...prev, newMessage]);
            setMessageInput('');

            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: unknown) {
            console.error('Error sending admin message:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
            setSendError(errorMessage);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Load blocked status for all senders on mount
    useEffect(() => {
        const checkBlockedStatus = async () => {
            const senderIds = [...new Set(messages.map(m => m.sender_id))];
            const blocked = new Set<string>();

            for (const senderId of senderIds) {
                try {
                    const profile = await adminUserService.getUserProfile(senderId);
                    if (profile?.is_blocked) {
                        blocked.add(senderId);
                    }
                } catch (e) {
                    // Ignore errors for individual user checks
                }
            }

            setBlockedUsers(blocked);
        };

        if (messages.length > 0) {
            checkBlockedStatus();
        }
    }, [messages]);

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="btn-sm p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="text-yellow-500" size={20} />
                        Moderação de Conversa
                    </h3>
                    <p className="text-xs text-slate-400">
                        {messages.length} mensagens • ID: {conversationId.slice(0, 8)}...
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
                            <p className="text-slate-400">Carregando mensagens...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-center">
                        <AlertCircle className="mx-auto text-red-400 mb-2" size={24} />
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={loadMessages}
                            className="text-sm text-red-300 hover:underline mt-2"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <MessageCircle size={48} className="mb-3 opacity-50" />
                        <p>Nenhuma mensagem nesta conversa</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messageGroups.map((group, groupIdx) => (
                            <div key={groupIdx}>
                                {/* Date separator */}
                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-slate-800"></div>
                                    <span className="text-xs text-slate-500 px-2">{group.date}</span>
                                    <div className="flex-1 h-px bg-slate-800"></div>
                                </div>

                                {/* Messages */}
                                <div className="space-y-3">
                                    {group.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`relative group ${msg.is_deleted ? 'opacity-60' : ''}`}
                                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                                            onMouseLeave={() => setHoveredMessageId(null)}
                                        >
                                            <div className={`flex gap-3 p-3 rounded-lg transition ${msg.is_deleted
                                                ? 'bg-red-900/10 border border-red-900/30'
                                                : 'bg-slate-800/50 hover:bg-slate-800'
                                                }`}>
                                                {/* Avatar */}
                                                <img
                                                    src={msg.sender.image_url || '/default-avatar.svg'}
                                                    alt={msg.sender.name}
                                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                                />

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-white">
                                                            {msg.sender.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                        {isUserBlocked(msg.sender_id) && (
                                                            <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded flex items-center gap-1">
                                                                <Ban size={10} />
                                                                BLOQUEADO
                                                            </span>
                                                        )}
                                                        {msg.is_deleted && (
                                                            <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded">
                                                                REMOVIDA
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm break-words ${msg.is_deleted ? 'text-red-400 italic' : 'text-slate-300'
                                                        }`}>
                                                        {msg.content}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                {(hoveredMessageId === msg.id || deletingMessageId === msg.id) && (
                                                    <div className="flex items-start gap-1 shrink-0">
                                                        {deletingMessageId === msg.id ? (
                                                            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                                                        ) : (
                                                            <>
                                                                {/* Block/Unblock User Button */}
                                                                <button
                                                                    onClick={() => handleBlockClick(
                                                                        msg.sender_id,
                                                                        msg.sender.name,
                                                                        isUserBlocked(msg.sender_id)
                                                                    )}
                                                                    className={`btn-sm p-1.5 rounded transition ${isUserBlocked(msg.sender_id)
                                                                        ? 'hover:bg-green-900/50'
                                                                        : 'hover:bg-orange-900/50'
                                                                        }`}
                                                                    title={isUserBlocked(msg.sender_id) ? 'Desbloquear usuário' : 'Bloquear usuário'}
                                                                >
                                                                    {isUserBlocked(msg.sender_id)
                                                                        ? <UserCheck className="text-green-400" size={16} />
                                                                        : <Ban className="text-orange-400" size={16} />
                                                                    }
                                                                </button>

                                                                {/* Delete/Restore Message Button */}
                                                                {msg.is_deleted ? (
                                                                    <button
                                                                        onClick={() => handleRestore(msg.id)}
                                                                        className="btn-sm p-1.5 hover:bg-green-900/50 rounded transition"
                                                                        title="Restaurar mensagem"
                                                                    >
                                                                        <RotateCcw className="text-green-400" size={16} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDeleteClick(msg.id)}
                                                                        className="btn-sm p-1.5 hover:bg-red-900/50 rounded transition"
                                                                        title="Remover mensagem"
                                                                    >
                                                                        <Trash2 className="text-red-400" size={16} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Admin Message Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                {sendError && (
                    <div className="mb-3 p-2 bg-red-900/30 border border-red-900/50 rounded-lg flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle size={14} />
                        {sendError}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg">
                        <Headphones size={14} />
                        <span>Suporte</span>
                    </div>
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enviar mensagem como Suporte..."
                        disabled={sendingMessage}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-600 transition disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                        className="p-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center justify-center"
                    >
                        {sendingMessage ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-900/30 rounded-full">
                                <Trash2 className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Remover Mensagem</h4>
                                <p className="text-sm text-slate-400">Esta ação será registrada no log de auditoria</p>
                            </div>
                        </div>

                        <p className="text-slate-300 mb-6">
                            Tem certeza que deseja remover esta mensagem? O conteúdo será substituído por
                            <span className="italic text-red-400"> "[Mensagem removida pelo moderador]"</span>.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletingMessageId !== null}
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deletingMessageId ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Removendo...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Confirmar Remoção
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block User Confirmation Modal */}
            {showBlockModal && selectedUserToBlock && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-full ${selectedUserToBlock.isBlocked ? 'bg-green-900/30' : 'bg-orange-900/30'}`}>
                                {selectedUserToBlock.isBlocked
                                    ? <UserCheck className="text-green-400" size={24} />
                                    : <Ban className="text-orange-400" size={24} />
                                }
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">
                                    {selectedUserToBlock.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                                </h4>
                                <p className="text-sm text-slate-400">
                                    {selectedUserToBlock.name}
                                </p>
                            </div>
                        </div>

                        {selectedUserToBlock.isBlocked ? (
                            <p className="text-slate-300 mb-6">
                                O usuário <strong className="text-white">{selectedUserToBlock.name}</strong> será
                                <span className="text-green-400"> desbloqueado</span> e poderá enviar mensagens novamente.
                            </p>
                        ) : (
                            <>
                                <p className="text-slate-300 mb-4">
                                    O usuário <strong className="text-white">{selectedUserToBlock.name}</strong> será
                                    <span className="text-orange-400"> bloqueado</span> e não poderá enviar mensagens.
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Motivo (opcional)
                                    </label>
                                    <textarea
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        placeholder="Ex: Violação de regras de conduta..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-orange-600 transition resize-none"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowBlockModal(false);
                                    setSelectedUserToBlock(null);
                                }}
                                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmBlock}
                                disabled={blockingUser}
                                className={`flex-1 py-2 px-4 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${selectedUserToBlock.isBlocked
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-orange-600 hover:bg-orange-700'
                                    }`}
                            >
                                {blockingUser ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Processando...
                                    </>
                                ) : selectedUserToBlock.isBlocked ? (
                                    <>
                                        <UserCheck size={16} />
                                        Desbloquear
                                    </>
                                ) : (
                                    <>
                                        <Ban size={16} />
                                        Bloquear
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
