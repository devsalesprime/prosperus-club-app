// ============================================
// BOTTOM NAV — Mobile Bottom Navigation
// ============================================
// Flex item within AppLayout — NO position:fixed
// (body is already position:fixed on iOS, so children use flow layout)

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
            // md:hidden → some no desktop
            // NÃO É MAIS fixed — é elemento normal no flex column
            className="md:hidden w-full bg-prosperus-navy border-t border-prosperus-navy-light z-50"
            style={{
                // Ícones: 56px de altura fixa
                // Safe area: empurra o nav para baixo (home indicator)
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                // Nunca ser menor que 56px
                minHeight: 56,
                flexShrink: 0,
            }}
        >
            <div
                className="flex justify-around items-center px-2"
                style={{ height: 56 }}
            >
                {bottomNavItems.map(item => {
                    const targetView = ('view' in item && item.view) ? item.view : item.id;
                    const isActive = view === targetView;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(targetView as ViewState)}
                            data-tour-id={
                                item.id === 'prosperus-tools'
                                    ? 'prosperus-tools'
                                    : item.id.toLowerCase()
                            }
                            style={{ minHeight: 'unset', minWidth: 'unset' }}
                            className={`
                                flex-1 min-w-0 flex flex-col items-center
                                justify-center gap-0.5 rounded-lg
                                transition-colors
                                ${isActive ? 'text-prosperus-gold' : 'text-prosperus-grey'}
                            `}
                        >
                            <span className="w-5 h-5 flex items-center justify-center">
                                {item.icon}
                            </span>
                            <span className="text-[9px] leading-tight font-medium">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
