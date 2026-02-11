// AdminChatManager.tsx
// Painel de controle de chat para administradores
// Permite visualizar todas as conversas, moderar e responder como suporte

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Search,
    Trash2,
    Send,
    AlertCircle,
    Loader2,
    Shield,
    X,
    Ban,
    UserCheck
} from 'lucide-react';
import { adminChatService, ConversationWithParticipants, MessageWithSender } from '../services/adminChatService';
import { adminUserService } from '../services/adminUserService';
import { profileService } from '../services/profileService';
import { conversationService } from '../services/conversationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminChatManagerProps {
    currentAdminId: string;
}

export const AdminChatManager: React.FC<AdminChatManagerProps> = ({ currentAdminId }) => {
    const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null);
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Block user states
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedUserToBlock, setSelectedUserToBlock] = useState<{ id: string; name: string; isBlocked: boolean } | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [blockingUser, setBlockingUser] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

    // New conversation states
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [newConversationMessage, setNewConversationMessage] = useState('');
    const [creatingConversation, setCreatingConversation] = useState(false);

    // Load all conversations
    useEffect(() => {
        loadConversations();
    }, []);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const result = await adminChatService.getAllConversations(1, 100, searchQuery);
            setConversations(result.data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            setLoadingMessages(true);
            const msgs = await adminChatService.getConversationMessages(conversationId);
            setMessages(msgs);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Subscribe to realtime updates for selected conversation
    useEffect(() => {
        if (!selectedConversation) return;

        console.log('🔌 AdminChatManager: Subscribing to conversation:', selectedConversation.id);

        const subscription = conversationService.subscribeToConversation(
            selectedConversation.id,
            (newMessage) => {
                console.log('📩 AdminChatManager: Received message update:', newMessage);

                setMessages(prev => {
                    // Check if message already exists (UPDATE case)
                    const exists = prev.some(m => m.id === newMessage.id);

                    // Cast to MessageWithSender with default values
                    const messageWithSender: MessageWithSender = {
                        ...newMessage,
                        is_deleted: newMessage.is_deleted || false,
                        sender: newMessage.sender as any || {
                            id: newMessage.sender_id,
                            name: 'Sócio',
                            email: '',
                            image_url: null
                        }
                    };

                    if (exists) {
                        // Update existing message (e.g., soft delete)
                        return prev.map(m =>
                            m.id === newMessage.id ? messageWithSender : m
                        );
                    }

                    // New message - add to list
                    return [...prev, messageWithSender];
                });
            }
        );

        return () => {
            console.log('🧹 AdminChatManager: Unsubscribing from conversation');
            subscription.unsubscribe();
        };
    }, [selectedConversation?.id]);


    const handleSearch = () => {
        loadConversations();
    };

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim() || sending) return;

        try {
            setSending(true);
            const message = await adminChatService.sendAdminMessage(
                selectedConversation.id,
                currentAdminId,
                newMessage
            );
            // Don't manually add message - realtime subscription will handle it
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

        try {
            await adminChatService.deleteMessage(messageId, currentAdminId);
            // Reload messages
            if (selectedConversation) {
                loadMessages(selectedConversation.id);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Erro ao deletar mensagem');
        }
    };

    const getParticipantNames = (conv: ConversationWithParticipants): string => {
        return conv.participants.map(p => p.name).join(' × ');
    };

    const isAdminMessage = (msg: MessageWithSender): boolean => {
        return msg.sender_id === currentAdminId;
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

            // Update blocked users list
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

    const isUserBlocked = (userId: string) => blockedUsers.has(userId);

    // Load blocked status for conversation participants
    useEffect(() => {
        const checkBlockedStatus = async () => {
            if (!selectedConversation) return;

            const participantIds = selectedConversation.participants.map(p => p.id);
            const blocked = new Set<string>();

            for (const participantId of participantIds) {
                try {
                    const profile = await adminUserService.getUserProfile(participantId);
                    if (profile?.is_blocked) {
                        blocked.add(participantId);
                    }
                } catch (e) {
                    // Ignore errors for individual user checks
                }
            }

            setBlockedUsers(blocked);
        };

        if (selectedConversation) {
            checkBlockedStatus();
        }
    }, [selectedConversation]);

    // New conversation functions
    const handleSearchUsers = async () => {
        if (!userSearchQuery.trim()) {
            setSearchedUsers([]);
            return;
        }

        try {
            const users = await profileService.getFilteredProfiles({ query: userSearchQuery });
            // Filter out current admin
            setSearchedUsers(users.filter(u => u.id !== currentAdminId));
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchedUsers([]);
        }
    };

    const handleCreateConversation = async () => {
        if (!selectedUser || !newConversationMessage.trim()) return;

        try {
            setCreatingConversation(true);

            // Get or create conversation
            const conversationId = await conversationService.getOrCreateConversation(
                currentAdminId,
                selectedUser.id
            );

            // Send initial message
            await adminChatService.sendAdminMessage(
                conversationId,
                currentAdminId,
                newConversationMessage.trim()
            );

            // Reload conversations
            await loadConversations();

            // Find and select the new conversation
            const conversations = await adminChatService.getAllConversations(1, 100);
            const newConv = conversations.data.find(c => c.id === conversationId);
            if (newConv) {
                setSelectedConversation(newConv);
            }

            // Close modal and reset
            setShowNewConversationModal(false);
            setSelectedUser(null);
            setNewConversationMessage('');
            setUserSearchQuery('');
            setSearchedUsers([]);
        } catch (error: unknown) {
            console.error('Error creating conversation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert('Erro ao criar conversa: ' + errorMessage);
        } finally {
            setCreatingConversation(false);
        }
    };

    // Search users when query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (userSearchQuery) {
                handleSearchUsers();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearchQuery]);

    return (
        <div className="flex h-screen bg-prosperus-navy">
            {/* Left Column - Conversation List */}
            <div className="w-1/3 border-r border-prosperus-navy-light flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-prosperus-navy-light">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-prosperus-gold flex items-center gap-2">
                            <Shield size={24} />
                            Chat Manager
                        </h2>
                        <button
                            onClick={() => setShowNewConversationModal(true)}
                            className="px-3 py-1.5 bg-prosperus-gold text-prosperus-navy rounded-lg font-semibold hover:bg-prosperus-gold/90 transition-colors flex items-center gap-2 text-sm"
                        >
                            <MessageSquare size={16} />
                            Nova Conversa
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-4 py-2 pl-10 bg-prosperus-navy-light text-white rounded-lg border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-prosperus-grey" size={20} />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-prosperus-gold" size={32} />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-prosperus-grey">
                            <MessageSquare size={48} className="mb-2" />
                            <p>Nenhuma conversa encontrada</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`p-4 border-b border-prosperus-navy-light cursor-pointer transition-colors ${selectedConversation?.id === conv.id
                                    ? 'bg-prosperus-navy-light'
                                    : 'hover:bg-prosperus-navy-light/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-prosperus-gold/20 flex items-center justify-center">
                                            <MessageSquare size={20} className="text-prosperus-gold" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">
                                            {getParticipantNames(conv)}
                                        </p>
                                        <p className="text-sm text-prosperus-grey truncate">
                                            {conv.lastMessage?.content || 'Sem mensagens'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-prosperus-grey">
                                                {conv.messageCount} mensagens
                                            </span>
                                            {conv.lastMessage && (
                                                <span className="text-xs text-prosperus-grey">
                                                    • {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Block User Confirmation Modal */}
            {showBlockModal && selectedUserToBlock && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-prosperus-navy border border-prosperus-navy-light rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-full ${selectedUserToBlock.isBlocked ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                {selectedUserToBlock.isBlocked
                                    ? <UserCheck className="text-green-400" size={24} />
                                    : <Ban className="text-orange-400" size={24} />
                                }
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">
                                    {selectedUserToBlock.isBlocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                                </h4>
                                <p className="text-sm text-prosperus-grey">
                                    {selectedUserToBlock.name}
                                </p>
                            </div>
                        </div>

                        {selectedUserToBlock.isBlocked ? (
                            <p className="text-prosperus-grey mb-6">
                                O usuário <strong className="text-white">{selectedUserToBlock.name}</strong> será
                                <span className="text-green-400"> desbloqueado</span> e poderá enviar mensagens novamente.
                            </p>
                        ) : (
                            <>
                                <p className="text-prosperus-grey mb-4">
                                    O usuário <strong className="text-white">{selectedUserToBlock.name}</strong> será
                                    <span className="text-orange-400"> bloqueado</span> e não poderá enviar mensagens.
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm text-prosperus-grey mb-2">
                                        Motivo (opcional)
                                    </label>
                                    <textarea
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                        placeholder="Ex: Violação de regras de conduta..."
                                        className="w-full bg-prosperus-navy-light border border-prosperus-grey/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-prosperus-gold transition resize-none"
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
                                className="flex-1 py-2 px-4 bg-prosperus-navy-light hover:bg-prosperus-grey/20 text-white rounded-lg transition"
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

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-prosperus-navy border border-prosperus-navy-light rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                <MessageSquare className="text-prosperus-gold" size={24} />
                                Nova Conversa
                            </h4>
                            <button
                                onClick={() => {
                                    setShowNewConversationModal(false);
                                    setSelectedUser(null);
                                    setUserSearchQuery('');
                                    setSearchedUsers([]);
                                }}
                                className="p-1 hover:bg-prosperus-navy-light rounded transition"
                            >
                                <X size={20} className="text-prosperus-grey" />
                            </button>
                        </div>

                        {!selectedUser ? (
                            <>
                                {/* User Search */}
                                <div className="mb-4">
                                    <label className="block text-sm text-prosperus-grey mb-2">
                                        Buscar usuário
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            placeholder="Digite o nome ou email..."
                                            className="w-full px-4 py-2 pl-10 bg-prosperus-navy-light text-white rounded-lg border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-prosperus-grey" size={18} />
                                    </div>
                                </div>

                                {/* User List */}
                                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                                    {searchedUsers.length === 0 ? (
                                        <p className="text-center text-prosperus-grey py-8">
                                            {userSearchQuery ? 'Nenhum usuário encontrado' : 'Digite para buscar usuários'}
                                        </p>
                                    ) : (
                                        searchedUsers.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="w-full p-3 bg-prosperus-navy-light hover:bg-prosperus-grey/20 rounded-lg transition text-left flex items-center gap-3"
                                            >
                                                <img
                                                    src={user.image_url || '/default-avatar.svg'}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white truncate">{user.name}</p>
                                                    <p className="text-sm text-prosperus-grey truncate">{user.email}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Selected User */}
                                <div className="mb-4 p-3 bg-prosperus-navy-light rounded-lg flex items-center gap-3">
                                    <img
                                        src={selectedUser.image_url || '/default-avatar.svg'}
                                        alt={selectedUser.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{selectedUser.name}</p>
                                        <p className="text-sm text-prosperus-grey">{selectedUser.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-1 hover:bg-prosperus-navy rounded transition"
                                    >
                                        <X size={18} className="text-prosperus-grey" />
                                    </button>
                                </div>

                                {/* Message Input */}
                                <div className="mb-4">
                                    <label className="block text-sm text-prosperus-grey mb-2">
                                        Mensagem inicial
                                    </label>
                                    <textarea
                                        value={newConversationMessage}
                                        onChange={(e) => setNewConversationMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="w-full bg-prosperus-navy-light border border-prosperus-grey/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-prosperus-gold transition resize-none"
                                        rows={4}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowNewConversationModal(false);
                                            setSelectedUser(null);
                                            setNewConversationMessage('');
                                        }}
                                        className="flex-1 py-2 px-4 bg-prosperus-navy-light hover:bg-prosperus-grey/20 text-white rounded-lg transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateConversation}
                                        disabled={!newConversationMessage.trim() || creatingConversation}
                                        className="flex-1 py-2 px-4 bg-prosperus-gold text-prosperus-navy rounded-lg font-semibold hover:bg-prosperus-gold/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creatingConversation ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Criando...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Enviar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Right Column - Chat View */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-prosperus-navy-light bg-prosperus-navy-light">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">
                                        {getParticipantNames(selectedConversation)}
                                    </h3>
                                    <p className="text-sm text-prosperus-grey">
                                        {selectedConversation.participants.map(p => p.email).join(', ')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Block/Unblock User Button */}
                                    {selectedConversation.participants.length === 2 && selectedConversation.participants.map(participant => {
                                        // Find the non-admin participant
                                        if (participant.id !== currentAdminId) {
                                            const isBlocked = isUserBlocked(participant.id);
                                            return (
                                                <button
                                                    key={participant.id}
                                                    onClick={() => handleBlockClick(participant.id, participant.name, isBlocked)}
                                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isBlocked
                                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                                        : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                                                        }`}
                                                    title={isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                                                >
                                                    {isBlocked ? <UserCheck size={18} /> : <Ban size={18} />}
                                                    <span className="text-sm font-medium">
                                                        {isBlocked ? 'Desbloquear' : 'Bloquear'}
                                                    </span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="p-2 hover:bg-prosperus-navy rounded-lg transition-colors"
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
                                    <MessageSquare size={48} className="mb-2" />
                                    <p>Nenhuma mensagem ainda</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isAdminMessage(msg) ? 'justify-end' : 'justify-start'} group`}
                                    >
                                        <div className={`max-w-[70%] ${isAdminMessage(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
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
                                                    className={`px-4 py-2 rounded-lg ${isAdminMessage(msg)
                                                        ? 'bg-prosperus-gold text-prosperus-navy'
                                                        : msg.is_deleted
                                                            ? 'bg-red-500/20 text-red-300 italic'
                                                            : 'bg-prosperus-navy-light text-white'
                                                        }`}
                                                >
                                                    <p className="break-words">{msg.content}</p>
                                                    <p className="text-xs mt-1 opacity-70">
                                                        {formatDistanceToNow(new Date(msg.created_at), {
                                                            addSuffix: true,
                                                            locale: ptBR
                                                        })}
                                                    </p>
                                                </div>

                                                {/* Delete button (only for non-admin messages) */}
                                                {!isAdminMessage(msg) && !msg.is_deleted && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
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
                        <div className="p-4 border-t border-prosperus-navy-light bg-prosperus-navy-light">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Digite sua mensagem como suporte..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 bg-prosperus-navy text-white rounded-lg border border-prosperus-grey/20 focus:border-prosperus-gold focus:outline-none disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="px-4 py-2 bg-prosperus-gold text-prosperus-navy rounded-lg font-semibold hover:bg-prosperus-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {sending ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-prosperus-grey">
                        <MessageSquare size={64} className="mb-4" />
                        <p className="text-lg">Selecione uma conversa para visualizar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
