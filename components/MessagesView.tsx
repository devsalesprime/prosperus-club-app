// MessagesView.tsx
// Container component for the messaging system

import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { ConversationWithDetails } from '../services/conversationService';

interface MessagesViewProps {
    currentUserId: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ currentUserId }) => {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        // In a real app, we'd fetch the conversation details here
        // For now, we'll pass the data from the list
    };

    const handleBack = () => {
        setSelectedConversationId(null);
        setRefreshKey(prev => prev + 1); // Force refresh to update unread counts
    };

    const handleConversationCreated = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="h-full flex">
            {/* Desktop: Side-by-side layout */}
            <div className="hidden md:flex w-full h-full">
                {/* Conversation List (Left Panel) */}
                <div className="w-96 border-r border-slate-800 h-full">
                    <ConversationList
                        key={refreshKey}
                        currentUserId={currentUserId}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={handleSelectConversation}
                        onNewConversation={() => setShowNewConversationModal(true)}
                    />
                </div>

                {/* Chat Window (Right Panel) */}
                <div className="flex-1 h-full">
                    {selectedConversationId ? (
                        <ChatWindowWrapper
                            conversationId={selectedConversationId}
                            currentUserId={currentUserId}
                            onBack={handleBack}
                        />
                    ) : (
                        <EmptyState onNewConversation={() => setShowNewConversationModal(true)} />
                    )}
                </div>
            </div>

            {/* Mobile: Full-screen toggle */}
            <div className="md:hidden w-full h-full">
                {selectedConversationId ? (
                    <ChatWindowWrapper
                        conversationId={selectedConversationId}
                        currentUserId={currentUserId}
                        onBack={handleBack}
                    />
                ) : (
                    <ConversationList
                        key={refreshKey}
                        currentUserId={currentUserId}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={handleSelectConversation}
                        onNewConversation={() => setShowNewConversationModal(true)}
                    />
                )}
            </div>

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={showNewConversationModal}
                onClose={() => setShowNewConversationModal(false)}
                currentUserId={currentUserId}
                onConversationCreated={handleConversationCreated}
            />
        </div>
    );
};

// Wrapper to fetch conversation details
const ChatWindowWrapper: React.FC<{
    conversationId: string;
    currentUserId: string;
    onBack: () => void;
}> = ({ conversationId, currentUserId, onBack }) => {
    const [otherUser, setOtherUser] = useState<{
        name: string;
        image: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        let isMounted = true;

        const fetchConversationDetails = async () => {
            try {
                setLoading(true);

                // Importar dinamicamente para evitar dependência circular
                const { conversationService } = await import('../services/conversationService');

                const conversation = await conversationService.getConversationById(
                    conversationId,
                    currentUserId
                );

                if (!isMounted) return;

                if (conversation?.otherParticipant) {
                    setOtherUser({
                        name: conversation.otherParticipant.name || 'Usuário',
                        image: conversation.otherParticipant.image_url || '/default-avatar.svg'
                    });
                } else {
                    // Fallback se não encontrar o participante
                    setOtherUser({
                        name: 'Usuário',
                        image: '/default-avatar.svg'
                    });
                }
            } catch (error) {
                console.error('Error fetching conversation details:', error);
                if (isMounted) {
                    // Fallback em caso de erro
                    setOtherUser({
                        name: 'Usuário',
                        image: '/default-avatar.svg'
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchConversationDetails();

        return () => {
            isMounted = false;
        };
    }, [conversationId, currentUserId]);

    if (loading || !otherUser) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-400 text-sm">Carregando conversa...</p>
                </div>
            </div>
        );
    }

    return (
        <ChatWindow
            conversationId={conversationId}
            currentUserId={currentUserId}
            otherUserName={otherUser.name}
            otherUserImage={otherUser.image}
            onBack={onBack}
        />
    );
};

// Empty state when no conversation is selected
const EmptyState: React.FC<{ onNewConversation: () => void }> = ({ onNewConversation }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-950 p-6 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <svg
                    className="w-12 h-12 text-slate-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Suas Mensagens</h3>
            <p className="text-slate-400 mb-6 max-w-md">
                Selecione uma conversa à esquerda ou inicie uma nova conversa com um membro
            </p>
            <button
                onClick={onNewConversation}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition"
            >
                Nova Conversa
            </button>
        </div>
    );
};
