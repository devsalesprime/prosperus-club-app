// MessagesView.tsx
// Container component for the messaging system — Premium Design

import React, { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { ConversationWithDetails } from '../services/conversationService';
import { MessageCircle, Plus, Sparkles } from 'lucide-react';

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
    };

    const handleBack = () => {
        setSelectedConversationId(null);
        setRefreshKey(prev => prev + 1);
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
                <div className="w-96 border-r border-slate-800/30 h-full">
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
                const { conversationService } = await import('../services/conversationService');

                const conversation = await conversationService.getConversationById(
                    conversationId,
                    currentUserId
                );

                if (!isMounted) return;

                if (conversation?.otherParticipant) {
                    setOtherUser({
                        name: conversation.otherParticipant.name || 'Usuário',
                        image: conversation.otherParticipant.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`
                    });
                } else {
                    setOtherUser({
                        name: 'Usuário',
                        image: `${import.meta.env.BASE_URL}default-avatar.svg`
                    });
                }
            } catch (error) {
                console.error('Error fetching conversation details:', error);
                if (isMounted) {
                    setOtherUser({
                        name: 'Usuário',
                        image: `${import.meta.env.BASE_URL}default-avatar.svg`
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
            <div
                className="flex items-center justify-center h-full"
                style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)' }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-yellow-500/20"></div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-yellow-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-500 text-sm">Carregando conversa...</p>
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

// Premium empty state when no conversation is selected (desktop only)
const EmptyState: React.FC<{ onNewConversation: () => void }> = ({ onNewConversation }) => {
    return (
        <div
            className="flex flex-col items-center justify-center h-full p-6 text-center"
            style={{
                background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)',
                backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(250,204,21,0.03) 0%, transparent 50%)',
            }}
        >
            {/* Animated icon */}
            <div className="relative mb-6">
                <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(217,119,6,0.04))',
                        border: '1px solid rgba(250,204,21,0.1)',
                        boxShadow: '0 0 40px rgba(250,204,21,0.05)',
                    }}
                >
                    <MessageCircle className="w-10 h-10 text-yellow-500/50" />
                </div>
                <div
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                        boxShadow: '0 2px 8px rgba(217,119,6,0.4)',
                    }}
                >
                    <Sparkles size={14} className="text-white" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Suas Mensagens</h3>
            <p className="text-slate-500 mb-6 max-w-xs text-sm leading-relaxed">
                Selecione uma conversa à esquerda ou inicie uma nova conversa para conectar-se com outros membros do clube
            </p>

            <button
                onClick={onNewConversation}
                className="px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
                style={{
                    background: 'linear-gradient(135deg, #b45309, #d97706)',
                    boxShadow: '0 4px 16px rgba(217,119,6,0.3)',
                }}
            >
                <Plus size={18} />
                Nova Conversa
            </button>
        </div>
    );
};
