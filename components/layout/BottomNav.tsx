// ============================================
// BOTTOM NAV — Mobile Bottom Navigation
// ============================================
// Extracted from App.tsx L1554-1573

import React from 'react';
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    Briefcase,
    Users,
    Image as ImageIcon
} from 'lucide-react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';

// Fixed nav items for bottom bar (first 5)
const bottomNavItems = [
    { id: ViewState.DASHBOARD, label: 'Início', icon: <LayoutDashboard size={20} /> },
    { id: ViewState.AGENDA, label: 'Agenda', icon: <CalendarIcon size={20} /> },
    { id: 'prosperus-tools', label: 'Prosperus Tools', icon: <Briefcase size={20} />, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', icon: <Users size={20} /> },
    { id: ViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={20} /> },
];

export const BottomNav: React.FC = () => {
    const { view, setView } = useApp();

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-prosperus-navy border-t border-prosperus-navy-light flex justify-around items-start px-2 pt-1.5"
            style={{ height: 'var(--nav-h, 48px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {bottomNavItems.map(item => {
                const targetView = ('view' in item && item.view) ? item.view : item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setView(targetView as ViewState)}
                        data-tour-id={item.id === 'prosperus-tools' ? 'prosperus-tools' : item.id.toLowerCase()}
                        className={`flex-1 min-w-0 flex flex-col items-center rounded-lg transition ${view === targetView ? 'text-prosperus-gold' : 'text-prosperus-grey'}`}
                    >
                        <span className="w-5 h-5 mb-0.5">{item.icon}</span>
                        <span className="text-[9px] leading-tight">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
