// ============================================
// BOTTOM NAV — Mobile Navigation (iOS Safe Area Aware)
// ============================================
// Layout: The nav absorbs env(safe-area-inset-bottom) into its own
// background, sitting flush against the screen edge on all devices.
//
// Architecture:
//   <nav>                         ← flex-column, expands into safe area
//     <div height=56>             ← usable button area (icons + labels)
//     [safe area padding]         ← CSS padding-bottom via env()
//
// CRITICAL:  env() MUST be in a <style> tag — iOS WebKit ignores
//            env() when applied via JS inline styles.
// NON-REGRESSION:
//   - NO overflow:hidden on html/body/#root in React components
//   - div role="button" (not <button>) to avoid iOS overflow:clip
//   - Icon 24px, label 11px/14px line-height

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

export const bottomNavItems = [
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
            <style>{`
                /* ── Nav safe area: absorb bottom inset into nav background ── */
                /* env() returns ~34px on iPhones with Home Indicator, 0 elsewhere */
                #prosperus-bottom-nav {
                    min-height: calc(56px + env(safe-area-inset-bottom, 0px));
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                }
                /* Hide on desktop */
                @media (min-width: 768px) {
                    #prosperus-bottom-nav { display: none !important; }
                }
            `}</style>

            <nav
                id="prosperus-bottom-nav"
                style={{
                    flexShrink: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 50,
                    overflow: 'visible',
                    background: BG,
                    borderTop: `1px solid ${BORDER}`,
                }}
            >
                {/* ── Usable button area: exactly 56px ── */}
                {/* Icons + labels are vertically centered within this zone */}
                {/* Safe area padding sits BELOW this div, inside the nav */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: 56,
                    paddingLeft: 4,
                    paddingRight: 4,
                }}>
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
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <Icon
                                    size={24}
                                    color={color}
                                    strokeWidth={isActive ? 2.2 : 1.8}
                                />
                                <span style={{
                                    fontSize: 11,
                                    lineHeight: '14px',
                                    fontWeight: isActive ? 600 : 400,
                                    color: color,
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};