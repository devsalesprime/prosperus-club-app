// ============================================
// DESKTOP SIDEBAR — Left Navigation Panel
// ============================================
// Extracted from App.tsx L914-1020

import React from 'react';
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    Briefcase,
    Users,
    Image as ImageIcon,
    Newspaper,
    TrendingUp,
    Send,
    Trophy,
    MessageCircle,
    User,
    PlayCircle,
    Lightbulb,
    BarChart2,
    ChevronDown,
    Heart
} from 'lucide-react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { ChatIconWithBadge } from '../ChatIconWithBadge';
import { NotificationCenter } from '../NotificationCenter';

export const DesktopSidebar: React.FC = () => {
    const {
        currentUser, view, setView,
        expandedMenus, toggleMenu,
        hasNews, handleNotificationNavigate
    } = useApp();

    // Full nav items for sidebar
    const navItems = [
        { id: ViewState.DASHBOARD, label: 'Início', icon: <LayoutDashboard size={20} /> },
        { id: ViewState.AGENDA, label: 'Agenda', icon: <CalendarIcon size={20} /> },
        {
            id: 'prosperus-tools' as any,
            label: 'Prosperus Tools',
            icon: <Briefcase size={20} />,
            view: ViewState.PROSPERUS_TOOLS,
            children: [
                { id: ViewState.ACADEMY, label: 'Aulas', icon: <PlayCircle size={18} /> },
                { id: ViewState.SOLUTIONS, label: 'Soluções', icon: <Lightbulb size={18} /> },
                { id: ViewState.PROGRESS, label: 'Meu Progresso', icon: <BarChart2 size={18} /> },
            ]
        },
        { id: ViewState.MEMBERS, label: 'Sócios', icon: <Users size={20} /> },
        { id: ViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={20} /> },
        ...(hasNews ? [{ id: ViewState.NEWS, label: 'News', icon: <Newspaper size={20} /> }] : []),
        { id: ViewState.DEALS, label: 'Negócios', icon: <TrendingUp size={20} /> },
        { id: ViewState.REFERRALS, label: 'Indicações', icon: <Send size={20} /> },
        { id: ViewState.RANKINGS, label: 'Rankings', icon: <Trophy size={20} /> },
        { id: ViewState.MESSAGES, label: 'Chat', icon: <MessageCircle size={20} /> },
        { id: ViewState.PROFILE, label: 'Perfil', icon: <User size={20} /> },
    ];

    return (
        <div className="hidden md:flex w-64 flex-col border-r border-prosperus-navy-light bg-prosperus-navy">
            <div className="p-6 border-b border-prosperus-navy-light">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => setView(ViewState.DASHBOARD)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        title="Ir para Home"
                    >
                        <img src="https://salesprime.com.br/wp-content/uploads/2025/11/logo-prosperus.svg" alt="Prosperus" className="h-8 w-auto" />
                    </button>
                    {currentUser && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setView(ViewState.FAVORITES)}
                                className="p-2 text-prosperus-grey hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                                title="Meus Favoritos"
                            >
                                <Heart size={20} />
                            </button>
                            <ChatIconWithBadge
                                userId={currentUser.id}
                                onClick={() => setView(ViewState.MESSAGES)}
                            />
                            <NotificationCenter currentUserId={currentUser.id} onNavigate={handleNotificationNavigate} />
                        </div>
                    )}
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map(item => {
                    if ('children' in item && item.children) {
                        const isExpanded = expandedMenus.has(item.id);
                        return (
                            <div key={item.id}>
                                <button
                                    onClick={() => {
                                        toggleMenu(item.id);
                                        if ('view' in item && item.view) {
                                            setView(item.view as ViewState);
                                        }
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-prosperus-grey hover:bg-prosperus-navy-light hover:text-prosperus-white"
                                >
                                    <div className="flex items-center space-x-3">
                                        {item.icon}
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="mt-1 ml-4 space-y-1 border-l-2 border-prosperus-gold/30 pl-2">
                                        {item.children.map((child: any) => (
                                            <button
                                                key={child.id}
                                                onClick={() => setView(child.id)}
                                                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${view === child.id
                                                    ? 'bg-gradient-to-r from-prosperus-gold to-prosperus-gold-light text-prosperus-navy shadow-lg font-semibold'
                                                    : 'text-prosperus-grey hover:bg-prosperus-navy-light/50 hover:text-prosperus-white'
                                                    }`}
                                            >
                                                {child.icon}
                                                <span className="font-medium">{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${view === item.id
                                ? 'bg-gradient-to-r from-prosperus-gold to-prosperus-gold-light text-prosperus-navy shadow-lg font-semibold'
                                : 'text-prosperus-grey hover:bg-prosperus-navy-light hover:text-prosperus-white'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            {currentUser && (
                <div className="p-4 border-t border-prosperus-navy-light">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-prosperus-navy-light/50">
                        <img src={currentUser.image || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={currentUser.name} className="w-8 h-8 rounded-full border border-prosperus-gold-dark object-cover" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-prosperus-white truncate">{currentUser.name}</p>
                            <p className="text-xs text-prosperus-grey truncate">{currentUser.jobTitle || currentUser.role}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
