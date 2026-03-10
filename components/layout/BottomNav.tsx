// ============================================
// BOTTOM NAV — Mobile Bottom Navigation
// ============================================
// Flex item within AppLayout — NO position:fixed
// Height: 56px icons+labels + safe-area-inset-bottom
// Uses INLINE STYLES to guarantee rendering (no Tailwind purge risk)

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
    { id: ViewState.DASHBOARD, label: 'Início', icon: <LayoutDashboard size={22} /> },
    { id: ViewState.AGENDA, label: 'Agenda', icon: <CalendarIcon size={22} /> },
    { id: 'prosperus-tools', label: 'Prosperus Tools', icon: <Briefcase size={22} />, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', icon: <Users size={22} /> },
    { id: ViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={22} /> },
];

export const BottomNav: React.FC = () => {
    const { view, setView, isMobile } = useApp();

    // Only render on mobile
    if (!isMobile) return null;

    return (
        <nav
            style={{
                // ── Layout ──────────────────────────────────
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-around',
                width: '100%',

                // ── Sizing ──────────────────────────────────
                // Nunca comprimir verticalmente
                flexShrink: 0,
                paddingTop: 8,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                // Garante espaço mínimo mesmo sem safe-area
                minHeight: 'calc(56px + env(safe-area-inset-bottom, 0px))',

                // ── Design system ───────────────────────────
                background: '#031A2B',
                borderTop: '1px solid #123F5B',

                // ── Stacking ────────────────────────────────
                position: 'relative',
                zIndex: 50,
            } as React.CSSProperties}
        >
            {bottomNavItems.map(item => {
                const targetView = ('view' in item && item.view) ? item.view : item.id;
                const isActive = view === targetView;
                const color = isActive ? '#FFDA71' : '#A8B4BC';

                return (
                    <button
                        key={item.id}
                        onClick={() => setView(targetView as ViewState)}
                        data-tour-id={item.id === 'prosperus-tools' ? 'prosperus-tools' : item.id.toLowerCase()}
                        style={{
                            // Apple HIG touch target
                            minWidth: 44,
                            minHeight: 44,
                            flex: 1,

                            // Empilhar ícone + label verticalmente
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,

                            // Reset de botão
                            background: 'none',
                            border: 'none',
                            padding: '0 4px',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {/* Ícone — tamanho fixo, nunca comprimir */}
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color,
                            transition: 'color 0.15s ease',
                            width: 24,
                            height: 24,
                            flexShrink: 0,
                        }}>
                            {item.icon}
                        </span>

                        {/* Label — NUNCA esconder */}
                        <span style={{
                            display: 'block',
                            fontSize: 10,
                            lineHeight: '12px',
                            fontWeight: isActive ? 600 : 400,
                            color,
                            transition: 'color 0.15s ease',
                            whiteSpace: 'nowrap',
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
