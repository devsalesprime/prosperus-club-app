// BottomNav — Mobile Bottom Navigation
// Safe-area padding via embedded <style> tag (not index.html, not inline)
// iOS needs env() in a real CSS rule, not JS-applied inline styles

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
        <>
            {/* ── CSS embedded in component ──
                 Using !important to override any conflicting rules.
                 env() MUST be in a stylesheet <style> tag for iOS WebKit. */}
            <style>{`
                #prosperus-bottom-nav {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    width: 100% !important;
                    flex-shrink: 0 !important;
                    padding-top: 10px !important;
                    padding-bottom: 10px !important;
                    background: ${BG} !important;
                    border-top: 1px solid ${BORDER} !important;
                    position: relative !important;
                    z-index: 50 !important;
                    overflow: visible !important;
                }

                /* iOS: add safe-area-inset-bottom to padding */
                @supports (-webkit-touch-callout: none) {
                    #prosperus-bottom-nav {
                        padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }

                /* Hide on desktop */
                @media (min-width: 768px) {
                    #prosperus-bottom-nav {
                        display: none !important;
                    }
                }
            `}</style>

            <nav id="prosperus-bottom-nav">
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
                                gap: 3,
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
                            <span style={{
                                fontSize: 10,
                                lineHeight: '12px',
                                fontWeight: isActive ? 600 : 400,
                                color: color,
                                whiteSpace: 'nowrap' as const,
                                textAlign: 'center' as const,
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </nav>
        </>
    );
};