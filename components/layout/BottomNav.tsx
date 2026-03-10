// ============================================
// BOTTOM NAV — Mobile Bottom Navigation (FIXED)
// ============================================
// Flex item within AppLayout — NO position:fixed
// Adicionado: position:relative + z-index explícito
// Garante que o nav fica SEMPRE acima de qualquer absolute dentro da coluna

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
    { id: 'prosperus-tools', label: 'Prosperus', icon: <Briefcase size={20} />, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', icon: <Users size={20} /> },
    { id: ViewState.GALLERY, label: 'Galeria', icon: <ImageIcon size={20} /> },
];

export const BottomNav: React.FC = () => {
    const { view, setView } = useApp();

    return (
        <nav
            className="md:hidden w-full bg-prosperus-navy border-t border-prosperus-navy-light"
            style={{
                // ── Posicionamento ───────────────────────────────────────
                // position:relative cria contexto de empilhamento próprio
                // z-index 50 garante que fica acima do SupportWidget (z-40)
                position: 'relative',
                zIndex: 50,

                // ── Dimensões ────────────────────────────────────────────
                flexShrink: 0,
                width: '100%',

                // ── Safe area iOS (home indicator) ───────────────────────
                // paddingBottom empurra o conteúdo para cima do indicador
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',

                // ── Altura mínima: 56px de conteúdo + safe area ──────────
                minHeight: 'calc(56px + env(safe-area-inset-bottom, 0px))',

                // ── Background garante que nada "vaza" por baixo ─────────
                background: '#031A2B',
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
                            className={`
                                flex-1 min-w-0 flex flex-col items-center
                                justify-center rounded-lg transition-colors
                                active:scale-95
                                ${isActive ? 'text-prosperus-gold' : 'text-prosperus-grey'}
                            `}
                            style={{
                                // Touch target mínimo Apple HIG: 44×44px
                                minHeight: 44,
                                minWidth: 44,
                                gap: 3,
                                border: 'none',
                                background: 'none',
                                padding: '0 4px',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {/* Ícone */}
                            <span
                                className="flex items-center justify-center"
                                style={{ width: 20, height: 20, flexShrink: 0 }}
                            >
                                {item.icon}
                            </span>

                            {/* Label — display:block garante renderização */}
                            <span
                                style={{
                                    display: 'block',
                                    fontSize: 9,
                                    lineHeight: '11px',
                                    fontWeight: isActive ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                    overflow: 'visible',
                                }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};