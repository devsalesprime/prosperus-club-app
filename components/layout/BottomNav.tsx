// BottomNav — DEBUG VERSION
// Bright red labels to diagnose iOS visibility issue

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

const GOLD = '#FFDA71';
const GREY = '#8A9BB0';
const BG = '#031A2B';
const BORDER = '#123F5B';

const bottomNavItems = [
    { id: ViewState.DASHBOARD, label: 'Início', Icon: LayoutDashboard },
    { id: ViewState.AGENDA, label: 'Agenda', Icon: CalendarIcon },
    { id: 'prosperus-tools', label: 'Prosperus', Icon: Briefcase, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', Icon: Users },
    { id: ViewState.GALLERY, label: 'Galeria', Icon: ImageIcon },
];

export const BottomNav: React.FC = () => {
    const { view, setView } = useApp();

    return (
        <nav
            className="md:hidden bottom-nav-ios"
            style={{
                flexShrink: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'row' as const,
                alignItems: 'center',
                justifyContent: 'space-around',
                position: 'relative' as const,
                zIndex: 50,
                background: BG,
                borderTop: `1px solid ${BORDER}`,
            }}
        >
            {bottomNavItems.map(item => {
                const targetView = ('view' in item && item.view) ? item.view : item.id;
                const isActive = view === targetView;
                const color = isActive ? GOLD : GREY;
                const { Icon } = item;

                return (
                    <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setView(targetView as ViewState)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setView(targetView as ViewState);
                            }
                        }}
                        data-tour-id={
                            item.id === 'prosperus-tools'
                                ? 'prosperus-tools'
                                : item.id.toLowerCase()
                        }
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column' as const,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            padding: '4px 0',
                            cursor: 'pointer',
                            userSelect: 'none' as const,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Icon
                            size={20}
                            color={color}
                            strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {/* ─── DEBUG: RED background, large white text ─── */}
                        <span style={{
                            fontSize: 14,
                            lineHeight: '16px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            background: '#FF0000',
                            padding: '2px 4px',
                            whiteSpace: 'nowrap' as const,
                            textAlign: 'center' as const,
                            display: 'block',
                            overflow: 'visible',
                            visibility: 'visible' as const,
                            opacity: 1,
                        }}>
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </nav>
    );
};