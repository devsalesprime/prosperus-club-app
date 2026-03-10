// ============================================
// BOTTOM NAV — Mobile Bottom Navigation
// ============================================
// Flex item within AppLayout — NO position:fixed
// Height: 56px icons+labels + safe-area-inset-bottom
//
// CRITICAL: env(safe-area-inset-bottom) MUST be in a <style> tag,
// NOT in React inline styles — iOS WebKit ignores env() in inline styles.

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
    const { view, setView } = useApp();

    return (
        <>
            {/* ── CSS: safe-area + visibility + stacking ──
                 env() MUST be in a stylesheet, NOT inline styles (iOS WebKit bug) */}
            <style>{`
                .prosperus-bottom-nav {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    justify-content: space-around;
                    width: 100%;
                    flex-shrink: 0;

                    /* Safe area — MUST be in CSS, not inline */
                    padding-top: 8px;
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                    min-height: calc(56px + env(safe-area-inset-bottom, 0px));

                    /* Design system */
                    background: #031A2B;
                    border-top: 1px solid #123F5B;

                    /* Stacking context */
                    position: relative;
                    z-index: 9999;
                }
                @media (min-width: 768px) {
                    .prosperus-bottom-nav { display: none !important; }
                }

                .prosperus-bottom-nav button {
                    min-width: 44px;
                    min-height: 44px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    background: none;
                    border: none;
                    padding: 0 4px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }

                .prosperus-bottom-nav .nav-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    transition: color 0.15s ease;
                }

                .prosperus-bottom-nav .nav-label {
                    display: block;
                    font-size: 10px;
                    line-height: 12px;
                    white-space: nowrap;
                    transition: color 0.15s ease;
                }

                .prosperus-bottom-nav .nav-active {
                    color: #FFDA71;
                }
                .prosperus-bottom-nav .nav-active .nav-label {
                    font-weight: 600;
                }
                .prosperus-bottom-nav .nav-inactive {
                    color: #A8B4BC;
                }
                .prosperus-bottom-nav .nav-inactive .nav-label {
                    font-weight: 400;
                }
            `}</style>

            <nav className="prosperus-bottom-nav">
                {bottomNavItems.map(item => {
                    const targetView = ('view' in item && item.view) ? item.view : item.id;
                    const isActive = view === targetView;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(targetView as ViewState)}
                            data-tour-id={item.id === 'prosperus-tools' ? 'prosperus-tools' : item.id.toLowerCase()}
                            className={isActive ? 'nav-active' : 'nav-inactive'}
                        >
                            <span className="nav-icon">
                                {item.icon}
                            </span>
                            <span className="nav-label">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};
