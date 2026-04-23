// ============================================
// ADMIN CHAT MANAGER — Orchestrator / Container (Refactored)
// ============================================
// State management + data loading + business logic ONLY.
// All visual presentation delegated to:
//   - AdminChatSidebar (conversation list)
//   - AdminChatWindow (messages view)
//   - AdminChatModals (block, new conv, delete conv, toast)
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { adminChatService, ConversationWithParticipants, MessageWithSender } from '../services/adminChatService';
import { adminUserService } from '../services/adminUserService';
import { profileService } from '../services/profileService';
import { conversationService } from '../services/conversationService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';
import { AdminConfirmDialog } from './admin/shared/AdminConfirmDialog';
import { AdminChatSidebar } from './admin/chat/AdminChatSidebar';
import { AdminChatWindow } from './admin/chat/AdminChatWindow';
import {
    BlockUserModal,
    NewConversationModal,
    DeleteConversationModal,
    AdminToast,
} from './admin/chat/AdminChatModals';

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
    const [searchedUsers, setSearchedUsers] = useState<Record<string, unknown>[]>([]);
    const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
    const [newConversationMessage, setNewConversationMessage] = useState('');
    const [creatingConversation, setCreatingConversation] = useState(false);

    // Delete conversation states
    const [showDeleteConvModal, setShowDeleteConvModal] = useState(false);
    const [convToDelete, setConvToDelete] = useState<ConversationWithParticipants | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletingConv, setDeletingConv] = useState(false);
    const [adminToast, setAdminToast] = useState<string | null>(null);

    // Delete message states
    const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    const DELETE_REASONS = [
        'Conteúdo impróprio',
        'Spam / Propaganda',
        'Conta inativa',
        'Solicitação do usuário',
        'Violação de políticas'
    ];

    // ============================================
    // DATA LOADING
    // ============================================

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

    useEffect(() => { loadConversations(); }, []);
    useEffect(() => { if (selectedConversation) loadMessages(selectedConversation.id); }, [selectedConversation]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Realtime subscription
    useEffect(() => {
        if (!selectedConversation) return;

        logger.debug('🔌 AdminChatManager: Listening to selected conversation:', selectedConversation.id);

        const handleNewMessage = (event: Event) => {
            const payload = (event as CustomEvent).detail;
            const msg = payload.new ?? payload;
            if (msg.conversation_id !== selectedConversation.id) return;

            logger.debug('📩 AdminChatManager: Received message update:', msg);

            setMessages(prev => {
                const exists = prev.some(m => m.id === msg.id);
                const messageWithSender: MessageWithSender = {
                    ...msg,
                    is_deleted: msg.is_deleted || false,
                    sender: (msg.sender as { id: string; name: string; email: string; image_url: string | null }) || { id: msg.sender_id, name: 'Sócio', email: '', image_url: null },
                };
                if (exists) return prev.map(m => m.id === msg.id ? messageWithSender : m);
                return [...prev, messageWithSender];
            });
        };

        window.addEventListener('prosperus:new-message', handleNewMessage);
        window.addEventListener('prosperus:message-updated', handleNewMessage);

        return () => {
            logger.debug('🧹 AdminChatManager: Removing DOM event listener');
            window.removeEventListener('prosperus:new-message', handleNewMessage);
            window.removeEventListener('prosperus:message-updated', handleNewMessage);
        };
    }, [selectedConversation?.id]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleSearch = () => loadConversations();

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim() || sending) return;
        try {
            setSending(true);
            await adminChatService.sendAdminMessage(selectedConversation.id, currentAdminId, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = (messageId: string) => {
        setMessageToDelete(messageId);
        setShowDeleteMessageModal(true);
    };

    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            await adminChatService.deleteMessage(messageToDelete, currentAdminId);
            if (selectedConversation) loadMessages(selectedConversation.id);
            toast.success('Mensagem deletada');
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Erro ao deletar mensagem');
        } finally {
            setShowDeleteMessageModal(false);
            setMessageToDelete(null);
        }
    };

    const getParticipantNames = (conv: ConversationWithParticipants): string => {
        return conv.participants.map(p => p.name).join(' × ');
    };

    // ── Delete conversation ──
    const handleDeleteConversation = (conv: ConversationWithParticipants) => {
        setConvToDelete(conv);
        setDeleteReason('');
        setShowDeleteConvModal(true);
    };

    const confirmDeleteConversation = async () => {
        if (!convToDelete) return;
        try {
            setDeletingConv(true);
            await conversationService.deleteConversation(convToDelete.id);

            logger.debug('🗑️ [ADMIN AUDIT] Conversation deleted:', {
                conversationId: convToDelete.id,
                participants: convToDelete.participants.map(p => p.name).join(', '),
                deletedBy: currentAdminId,
                reason: deleteReason || 'Sem motivo informado',
                timestamp: new Date().toISOString()
            });

            setConversations(prev => prev.filter(c => c.id !== convToDelete.id));
            if (selectedConversation?.id === convToDelete.id) {
                setSelectedConversation(null);
                setMessages([]);
            }

            setShowDeleteConvModal(false);
            setConvToDelete(null);
            setAdminToast('Conversa excluída permanentemente');
            setTimeout(() => setAdminToast(null), 3000);
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast.error('Erro ao excluir conversa');
        } finally {
            setDeletingConv(false);
        }
    };

    // ── Block user ──
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
            if (result.isBlocked) {
                setBlockedUsers(prev => new Set([...prev, selectedUserToBlock.id]));
            } else {
                setBlockedUsers(prev => { const next = new Set(prev); next.delete(selectedUserToBlock.id); return next; });
            }
            toast.success(result.message);
            setShowBlockModal(false);
            setSelectedUserToBlock(null);
        } catch (err: unknown) {
            console.error('Error toggling user block:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            toast.error('Erro: ' + errorMessage);
        } finally {
            setBlockingUser(false);
        }
    };

    const isUserBlocked = (userId: string) => blockedUsers.has(userId);

    // Load blocked status when conversation changes
    useEffect(() => {
        const checkBlockedStatus = async () => {
            if (!selectedConversation) return;
            const blocked = new Set<string>();
            for (const p of selectedConversation.participants) {
                try {
                    const profile = await adminUserService.getUserProfile(p.id);
                    if (profile?.is_blocked) blocked.add(p.id);
                } catch { /* ignore */ }
            }
            setBlockedUsers(blocked);
        };
        if (selectedConversation) checkBlockedStatus();
    }, [selectedConversation]);

    // ── New conversation ──
    const handleSearchUsers = async () => {
        if (!userSearchQuery.trim()) { setSearchedUsers([]); return; }
        try {
            const users = await profileService.getFilteredProfiles({ query: userSearchQuery });
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
            const conversationId = await conversationService.getOrCreateConversation(currentAdminId, selectedUser.id);
            await adminChatService.sendAdminMessage(conversationId, currentAdminId, newConversationMessage.trim());
            await loadConversations();

            const allConvs = await adminChatService.getAllConversations(1, 100);
            const newConv = allConvs.data.find(c => c.id === conversationId);
            if (newConv) setSelectedConversation(newConv);

            setShowNewConversationModal(false);
            setSelectedUser(null);
            setNewConversationMessage('');
            setUserSearchQuery('');
            setSearchedUsers([]);
        } catch (error: unknown) {
            console.error('Error creating conversation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast.error('Erro ao criar conversa: ' + errorMessage);
        } finally {
            setCreatingConversation(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => { if (userSearchQuery) handleSearchUsers(); }, 300);
        return () => clearTimeout(timer);
    }, [userSearchQuery]);

    // ============================================
    // RENDER (Orchestrator — delegates to children)
    // ============================================

    return (
        <div className="flex h-full bg-prosperus-navy relative">
            <AdminChatSidebar
                conversations={conversations}
                selectedConversationId={selectedConversation?.id || null}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                onSelectConversation={setSelectedConversation}
                onDeleteConversation={handleDeleteConversation}
                onNewConversation={() => setShowNewConversationModal(true)}
                getParticipantNames={getParticipantNames}
                isHidden={!!selectedConversation}
            />

            <BlockUserModal
                isOpen={showBlockModal}
                user={selectedUserToBlock}
                blockReason={blockReason}
                blockingUser={blockingUser}
                onReasonChange={setBlockReason}
                onConfirm={handleConfirmBlock}
                onClose={() => { setShowBlockModal(false); setSelectedUserToBlock(null); }}
            />

            <NewConversationModal
                isOpen={showNewConversationModal}
                userSearchQuery={userSearchQuery}
                searchedUsers={searchedUsers}
                selectedUser={selectedUser}
                newConversationMessage={newConversationMessage}
                creatingConversation={creatingConversation}
                onSearchChange={setUserSearchQuery}
                onSelectUser={setSelectedUser}
                onDeselectUser={() => setSelectedUser(null)}
                onMessageChange={setNewConversationMessage}
                onCreate={handleCreateConversation}
                onClose={() => { setShowNewConversationModal(false); setSelectedUser(null); setUserSearchQuery(''); setSearchedUsers([]); }}
            />

            <AdminChatWindow
                selectedConversation={selectedConversation}
                messages={messages}
                loadingMessages={loadingMessages}
                newMessage={newMessage}
                sending={sending}
                currentAdminId={currentAdminId}
                messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
                isUserBlocked={isUserBlocked}
                onBack={() => setSelectedConversation(null)}
                onClose={() => setSelectedConversation(null)}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                onBlockClick={handleBlockClick}
                getParticipantNames={getParticipantNames}
                isHidden={!selectedConversation}
            />

            <DeleteConversationModal
                isOpen={showDeleteConvModal && !!convToDelete}
                convName={convToDelete ? getParticipantNames(convToDelete) : ''}
                deleteReason={deleteReason}
                deletingConv={deletingConv}
                deleteReasons={DELETE_REASONS}
                onReasonChange={setDeleteReason}
                onConfirm={confirmDeleteConversation}
                onClose={() => { setShowDeleteConvModal(false); setConvToDelete(null); }}
            />

            <AdminToast message={adminToast} />

            <AdminConfirmDialog
                isOpen={showDeleteMessageModal}
                onClose={() => { setShowDeleteMessageModal(false); setMessageToDelete(null); }}
                onConfirm={confirmDeleteMessage}
                title="Excluir Mensagem"
                message="Tem certeza que deseja excluir permanentemente esta mensagem? A ação não pode ser desfeita e a mensagem desaparecerá para ambos os usuários."
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </div>
    );
};
