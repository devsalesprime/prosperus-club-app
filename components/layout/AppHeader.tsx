// ============================================
// APP HEADER — Mobile Top Bar
// ============================================
// Flex item within AppLayout — NO position:fixed
// (body is already position:fixed on iOS, so children use flow layout)

import React from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { NotificationCenter } from '../NotificationCenter';

export const AppHeader: React.FC = () => {
    const { currentUser, setView, handleNotificationNavigate } = useApp();

    return (
        <header
            className="md:hidden shrink-0 z-50 flex items-center justify-between px-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/60"
            style={{ height: 60 }}
        >
            <button onClick={() => setView(ViewState.DASHBOARD)} className="hover:opacity-80 transition-opacity" title="Ir para Home">
                <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus" className="h-6 w-auto" />
            </button>
            <div className="flex items-center gap-2">
                {currentUser && (
                    <>
                        <button
                            onClick={() => setView(ViewState.FAVORITES)}
                            className="p-2 text-prosperus-grey hover:text-red-400 transition-colors"
                            title="Meus Favoritos"
                            data-tour-id="favorites"
                        >
                            <Heart size={22} />
                        </button>
                        <button
                            onClick={() => setView(ViewState.MESSAGES)}
                            className="p-2 text-prosperus-grey hover:text-prosperus-gold transition-colors"
                            title="Chat"
                            data-tour-id="chat"
                        >
                            <MessageCircle size={22} />
                        </button>
                        <NotificationCenter currentUserId={currentUser.id} onNavigate={handleNotificationNavigate} />
                    </>
                )}
                <button onClick={() => setView(ViewState.PROFILE)} className="p-2 text-prosperus-grey" data-tour-id="profile">
                    {currentUser ? <img src={currentUser.image || `${import.meta.env.BASE_URL}default-avatar.svg`} className="w-8 h-8 rounded-full object-cover" /> : <User size={24} />}
                </button>
            </div>
        </header>
    );
};
